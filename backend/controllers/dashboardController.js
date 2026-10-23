const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');

// @desc    Get dashboard metrics & chart data
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const { chartPeriod = 'daily' } = req.query; // 'daily', 'weekly', 'monthly'

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 1. Today's sales & count
    const todaySales = await Sale.find({
      invoiceDate: { $gte: todayStart, $lte: todayEnd },
      status: { $ne: 'CANCELLED' },
    });

    const todaySalesAmount = todaySales.reduce((acc, s) => acc + s.grandTotal, 0);
    const todayInvoicesCount = todaySales.length;

    // Estimated Gross Profit for today: Sum of (item.unitPrice - item.purchasePrice) * item.quantity
    let todayGrossProfit = 0;
    todaySales.forEach((s) => {
      s.items.forEach((item) => {
        const itemProfit = (item.unitPrice - (item.purchasePrice || 0)) * item.quantity;
        todayGrossProfit += itemProfit;
      });
    });

    // 2. Product counts
    const totalProducts = await Product.countDocuments({ isActive: true });
    const outOfStockProducts = await Product.countDocuments({ isActive: true, currentStock: { $lte: 0 } });
    const lowStockProducts = await Product.countDocuments({
      isActive: true,
      $expr: {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', '$minStockAlert'] },
        ],
      },
    });

    // 3. Customer & Supplier Balances
    const customerBalanceAgg = await Customer.aggregate([
      { $match: { isActive: true, currentBalance: { $gt: 0 } } },
      { $group: { _id: null, totalBalance: { $sum: '$currentBalance' } } },
    ]);
    const customerOutstanding = customerBalanceAgg.length > 0 ? customerBalanceAgg[0].totalBalance : 0;

    const supplierBalanceAgg = await Supplier.aggregate([
      { $match: { isActive: true, currentBalance: { $gt: 0 } } },
      { $group: { _id: null, totalBalance: { $sum: '$currentBalance' } } },
    ]);
    const supplierOutstanding = supplierBalanceAgg.length > 0 ? supplierBalanceAgg[0].totalBalance : 0;

    // 4. Recent sales (latest 5)
    const recentSales = await Sale.find({ status: { $ne: 'CANCELLED' } })
      .populate('createdBy', 'name')
      .sort({ invoiceDate: -1 })
      .limit(6);

    // 5. Top selling products (Aggregate over last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const topProducts = await Sale.aggregate([
      { $match: { invoiceDate: { $gte: thirtyDaysAgo }, status: { $ne: 'CANCELLED' } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.product',
          name: { $first: '$items.productName' },
          sku: { $first: '$items.sku' },
          totalQty: { $sum: '$items.quantity' },
          totalRevenue: { $sum: '$items.total' },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 5 },
    ]);

    // 6. Sales Chart Data
    let chartData = [];
    if (chartPeriod === 'daily') {
      // Last 7 days day-by-day
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const salesAgg = await Sale.aggregate([
        { $match: { invoiceDate: { $gte: sevenDaysAgo }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$invoiceDate' } },
            sales: { $sum: '$grandTotal' },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Fill in zero days
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
        const found = salesAgg.find((s) => s._id === dayStr);
        chartData.push({
          date: dayName,
          sales: found ? Math.round(found.sales) : 0,
          invoices: found ? found.invoices : 0,
        });
      }
    } else if (chartPeriod === 'weekly') {
      // Last 4 weeks
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      const salesAgg = await Sale.aggregate([
        { $match: { invoiceDate: { $gte: fourWeeksAgo }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { $week: '$invoiceDate' },
            sales: { $sum: '$grandTotal' },
            invoices: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      chartData = salesAgg.map((item, idx) => ({
        date: `Week ${idx + 1}`,
        sales: Math.round(item.sales),
        invoices: item.invoices,
      }));
    } else {
      // Monthly - Last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const salesAgg = await Sale.aggregate([
        { $match: { invoiceDate: { $gte: sixMonthsAgo }, status: { $ne: 'CANCELLED' } } },
        {
          $group: {
            _id: { $dateToString: { format: '%b %Y', date: '$invoiceDate' } },
            sales: { $sum: '$grandTotal' },
            invoices: { $sum: 1 },
          },
        },
      ]);

      // Fill last 6 months
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthLabel = d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const found = salesAgg.find((s) => s._id === monthLabel);
        chartData.push({
          date: d.toLocaleDateString('en-IN', { month: 'short' }),
          sales: found ? Math.round(found.sales) : 0,
          invoices: found ? found.invoices : 0,
        });
      }
    }

    res.json({
      success: true,
      data: {
        metrics: {
          todaySales: Math.round(todaySalesAmount),
          todayInvoicesCount,
          todayGrossProfit: Math.round(todayGrossProfit),
          totalProducts,
          lowStockProducts,
          outOfStockProducts,
          customerOutstanding: Math.round(customerOutstanding),
          supplierOutstanding: Math.round(supplierOutstanding),
        },
        chartData,
        topProducts,
        recentSales,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
