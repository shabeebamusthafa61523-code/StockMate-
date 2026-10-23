const Expense = require('../models/Expense');
const CashSession = require('../models/CashSession');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get all expenses with filters
// @route   GET /api/expenses
// @access  Private
const getExpenses = async (req, res, next) => {
  try {
    const { category, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category) query.category = category;

    if (startDate || endDate) {
      query.expenseDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.expenseDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.expenseDate.$lte = end;
      }
    }

    const total = await Expense.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const expenses = await Expense.find(query)
      .populate('createdBy', 'name role')
      .sort({ expenseDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: expenses,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record new shop expense
// @route   POST /api/expenses
// @access  Private
const createExpense = async (req, res, next) => {
  try {
    const { title, category, amount, paymentMethod = 'CASH', expenseDate = new Date(), paidTo, description } = req.body;

    const expenseAmount = Number(amount);
    if (!expenseAmount || expenseAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid expense amount required' });
    }

    const expenseNumber = `EXP-${Date.now().toString().slice(-6)}`;

    const expense = await Expense.create({
      expenseNumber,
      title,
      category,
      amount: expenseAmount,
      paymentMethod,
      expenseDate,
      paidTo,
      description,
      createdBy: req.user._id,
    });

    // If paid by CASH, record in open CashSession
    if (paymentMethod === 'CASH') {
      const openSession = await CashSession.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
      if (openSession) {
        openSession.cashPaidExpenses += expenseAmount;
        openSession.expectedCash =
          openSession.openingCash +
          openSession.cashSalesTotal +
          openSession.cashReceivedPayments -
          openSession.cashPaidExpenses -
          openSession.cashPaidSupplierPayments;
        await openSession.save();
      }
    }

    await logAudit({
      user: req.user,
      action: 'CREATE_EXPENSE',
      entity: 'Expense',
      entityId: expense._id,
      details: { title, amount: expenseAmount, category, paymentMethod },
      req,
    });

    res.status(201).json({ success: true, data: expense });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete expense
// @route   DELETE /api/expenses/:id
// @access  Private/Admin
const deleteExpense = async (req, res, next) => {
  try {
    const expense = await Expense.findByIdAndDelete(req.params.id);
    if (!expense) return res.status(404).json({ success: false, message: 'Expense not found' });
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getExpenses,
  createExpense,
  deleteExpense,
};
