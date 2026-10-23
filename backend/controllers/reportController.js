const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const Expense = require('../models/Expense');
const Payment = require('../models/Payment');
const CashSession = require('../models/CashSession');

// Helper to construct date filter
const getDateFilter = (startDate, endDate) => {
  const filter = {};
  if (startDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    filter.$gte = start;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return Object.keys(filter).length > 0 ? filter : null;
};

// @desc    Get Sales & Gross Profit Summary Report
// @route   GET /api/reports/sales-profit
// @access  Private
const getSalesProfitReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);
    const match = { status: { $ne: 'CANCELLED' } };
    if (dateFilter) match.invoiceDate = dateFilter;

    const sales = await Sale.find(match).populate('createdBy', 'name');

    let totalRevenue = 0;
    let totalTaxable = 0;
    let totalDiscount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let totalCostOfGoodsSold = 0;

    sales.forEach((s) => {
      totalRevenue += s.grandTotal;
      totalTaxable += s.taxableTotal || 0;
      totalDiscount += s.totalDiscount || 0;
      totalCgst += s.totalCgst || 0;
      totalSgst += s.totalSgst || 0;
      totalIgst += s.totalIgst || 0;

      s.items.forEach((item) => {
        totalCostOfGoodsSold += (item.purchasePrice || 0) * item.quantity;
      });
    });

    const grossProfit = totalTaxable - totalCostOfGoodsSold;
    const grossMarginPercent = totalTaxable > 0 ? Number(((grossProfit / totalTaxable) * 100).toFixed(2)) : 0;

    res.json({
      success: true,
      data: {
        totalInvoices: sales.length,
        totalRevenue: Math.round(totalRevenue),
        totalTaxable: Math.round(totalTaxable),
        totalDiscount: Math.round(totalDiscount),
        totalTax: Math.round(totalCgst + totalSgst + totalIgst),
        taxBreakdown: {
          cgst: Math.round(totalCgst),
          sgst: Math.round(totalSgst),
          igst: Math.round(totalIgst),
        },
        totalCostOfGoodsSold: Math.round(totalCostOfGoodsSold),
        grossProfit: Math.round(grossProfit),
        grossMarginPercent,
        sales: sales.slice(0, 50),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get GST Tax Summary for Tax Filing (GSTR-1 format summary)
// @route   GET /api/reports/gst-summary
// @access  Private
const getGstSummaryReport = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const dateFilter = getDateFilter(startDate, endDate);
    const match = { status: { $ne: 'CANCELLED' } };
    if (dateFilter) match.invoiceDate = dateFilter;

    const sales = await Sale.find(match);

    const b2bInvoices = [];
    const b2cInvoices = [];

    // Rate-wise summary: { 0: { taxable, cgst, sgst, igst }, 5: ..., 12: ..., 18: ..., 28: ... }
    const rateWise = {
      0: { taxable: 0, cgst: 0, sgst: 0, igst: 0 },
      5: { taxable: 0, cgst: 0, sgst: 0, igst: 0 },
      12: { taxable: 0, cgst: 0, sgst: 0, igst: 0 },
      18: { taxable: 0, cgst: 0, sgst: 0, igst: 0 },
      28: { taxable: 0, cgst: 0, sgst: 0, igst: 0 },
    };

    sales.forEach((s) => {
      if (s.customerGstin && s.customerGstin.trim().length >= 10) {
        b2bInvoices.push(s);
      } else {
        b2cInvoices.push(s);
      }

      s.items.forEach((item) => {
        const rate = item.taxRate || 0;
        if (!rateWise[rate]) {
          rateWise[rate] = { taxable: 0, cgst: 0, sgst: 0, igst: 0 };
        }
        rateWise[rate].taxable += item.taxableAmount;
        rateWise[rate].cgst += item.cgst || 0;
        rateWise[rate].sgst += item.sgst || 0;
        rateWise[rate].igst += item.igst || 0;
      });
    });

    res.json({
      success: true,
      data: {
        b2bCount: b2bInvoices.length,
        b2bTotal: Math.round(b2bInvoices.reduce((sum, i) => sum + i.grandTotal, 0)),
        b2cCount: b2cInvoices.length,
        b2cTotal: Math.round(b2cInvoices.reduce((sum, i) => sum + i.grandTotal, 0)),
        rateWise: Object.keys(rateWise).map((r) => ({
          rate: Number(r),
          taxable: Math.round(rateWise[r].taxable),
          cgst: Math.round(rateWise[r].cgst),
          sgst: Math.round(rateWise[r].sgst),
          igst: Math.round(rateWise[r].igst),
          totalTax: Math.round(rateWise[r].cgst + rateWise[r].sgst + rateWise[r].igst),
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Stock Valuation Report
// @route   GET /api/reports/stock-valuation
// @access  Private
const getStockValuationReport = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('unit', 'code');

    let totalPurchaseValue = 0;
    let totalSellingValue = 0;
    let totalStockUnits = 0;

    const items = products.map((p) => {
      const stock = p.currentStock || 0;
      const purchaseVal = stock * p.purchasePrice;
      const sellingVal = stock * p.sellingPrice;
      const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.purchasePrice) / p.sellingPrice) * 100 : 0;

      totalPurchaseValue += purchaseVal;
      totalSellingValue += sellingVal;
      totalStockUnits += stock;

      return {
        _id: p._id,
        sku: p.sku,
        name: p.name,
        category: p.category ? p.category.name : 'General',
        brand: p.brand,
        currentStock: stock,
        unit: p.unit ? p.unit.code : 'Pcs',
        purchasePrice: p.purchasePrice,
        sellingPrice: p.sellingPrice,
        purchaseValue: Math.round(purchaseVal),
        sellingValue: Math.round(sellingVal),
        marginPercent: Number(margin.toFixed(1)),
      };
    });

    res.json({
      success: true,
      data: {
        totalProducts: products.length,
        totalStockUnits: Math.round(totalStockUnits),
        totalPurchaseValue: Math.round(totalPurchaseValue),
        totalSellingValue: Math.round(totalSellingValue),
        potentialProfit: Math.round(totalSellingValue - totalPurchaseValue),
        items,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Outstanding Balances (Khata / Udhar) Report
// @route   GET /api/reports/balances
// @access  Private
const getBalancesReport = async (req, res, next) => {
  try {
    const customersWithBalance = await Customer.find({ isActive: true, currentBalance: { $gt: 0 } }).sort({
      currentBalance: -1,
    });
    const suppliersWithBalance = await Supplier.find({ isActive: true, currentBalance: { $gt: 0 } }).sort({
      currentBalance: -1,
    });

    const totalCustomerReceivable = customersWithBalance.reduce((sum, c) => sum + c.currentBalance, 0);
    const totalSupplierPayable = suppliersWithBalance.reduce((sum, s) => sum + s.currentBalance, 0);

    res.json({
      success: true,
      data: {
        totalCustomerReceivable: Math.round(totalCustomerReceivable),
        totalSupplierPayable: Math.round(totalSupplierPayable),
        netOutstanding: Math.round(totalCustomerReceivable - totalSupplierPayable),
        customers: customersWithBalance,
        suppliers: suppliersWithBalance,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSalesProfitReport,
  getGstSummaryReport,
  getStockValuationReport,
  getBalancesReport,
};
