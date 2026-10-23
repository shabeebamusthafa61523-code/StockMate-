const CashSession = require('../models/CashSession');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const Expense = require('../models/Expense');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get current active cash session or latest
// @route   GET /api/cash/current
// @access  Private
const getCurrentSession = async (req, res, next) => {
  try {
    let session = await CashSession.findOne({ status: 'OPEN' })
      .populate('openedBy', 'name role')
      .sort({ createdAt: -1 });

    if (session) {
      // Recalculate live expected cash
      session.expectedCash = Number(
        (
          session.openingCash +
          session.cashSalesTotal +
          session.cashReceivedPayments -
          session.cashPaidExpenses -
          session.cashPaidSupplierPayments
        ).toFixed(2)
      );
    }

    res.json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// @desc    Open a new daily cash session
// @route   POST /api/cash/open
// @access  Private
const openCashSession = async (req, res, next) => {
  try {
    const { openingCash = 0 } = req.body;

    const existingOpen = await CashSession.findOne({ status: 'OPEN' });
    if (existingOpen) {
      return res.status(400).json({
        success: false,
        message: 'A cash session is already open. Please reconcile and close it first.',
        data: existingOpen,
      });
    }

    const session = await CashSession.create({
      sessionDate: new Date(),
      openedBy: req.user._id,
      openingCash: Number(openingCash) || 0,
      expectedCash: Number(openingCash) || 0,
      status: 'OPEN',
    });

    await logAudit({
      user: req.user,
      action: 'OPEN_CASH_SESSION',
      entity: 'CashSession',
      entityId: session._id,
      details: { openingCash: session.openingCash },
      req,
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    next(error);
  }
};

// @desc    Close and reconcile cash session
// @route   POST /api/cash/close
// @access  Private
const closeCashSession = async (req, res, next) => {
  try {
    const { actualCash, notes = '' } = req.body;

    const session = await CashSession.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
    if (!session) {
      return res.status(400).json({ success: false, message: 'No active cash session found to close' });
    }

    const countedCash = Number(actualCash);
    const expected = Number(
      (
        session.openingCash +
        session.cashSalesTotal +
        session.cashReceivedPayments -
        session.cashPaidExpenses -
        session.cashPaidSupplierPayments
      ).toFixed(2)
    );

    const diff = Number((countedCash - expected).toFixed(2));

    session.actualCash = countedCash;
    session.expectedCash = expected;
    session.difference = diff;
    session.status = 'CLOSED';
    session.closedBy = req.user._id;
    session.closedAt = new Date();
    session.notes = notes;

    await session.save();

    await logAudit({
      user: req.user,
      action: 'CLOSE_CASH_SESSION',
      entity: 'CashSession',
      entityId: session._id,
      details: { expectedCash: expected, actualCash: countedCash, difference: diff },
      req,
    });

    res.json({ success: true, message: 'Cash session closed and reconciled', data: session });
  } catch (error) {
    next(error);
  }
};

// @desc    Get session history
// @route   GET /api/cash/history
// @access  Private
const getSessionHistory = async (req, res, next) => {
  try {
    const sessions = await CashSession.find()
      .populate('openedBy', 'name')
      .populate('closedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(30);

    res.json({ success: true, data: sessions });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCurrentSession,
  openCashSession,
  closeCashSession,
  getSessionHistory,
};
