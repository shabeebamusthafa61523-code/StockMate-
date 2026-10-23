const Payment = require('../models/Payment');
const Customer = require('../models/Customer');
const Supplier = require('../models/Supplier');
const CashSession = require('../models/CashSession');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get payments with filtering
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const { partyType, customerId, supplierId, startDate, endDate, page = 1, limit = 20 } = req.query;
    const query = {};

    if (partyType) query.partyType = partyType;
    if (customerId) query.customer = customerId;
    if (supplierId) query.supplier = supplierId;

    if (startDate || endDate) {
      query.paymentDate = {};
      if (startDate) query.paymentDate.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.paymentDate.$lte = end;
      }
    }

    const total = await Payment.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const payments = await Payment.find(query)
      .populate('createdBy', 'name role')
      .populate('customer', 'name phone')
      .populate('supplier', 'businessName phone')
      .sort({ paymentDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: payments,
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

// @desc    Record customer payment collection (Udhar recovery) or supplier payment
// @route   POST /api/payments
// @access  Private
const recordPayment = async (req, res, next) => {
  try {
    const {
      partyType, // 'CUSTOMER' or 'SUPPLIER'
      customerId,
      supplierId,
      amount,
      paymentMethod = 'CASH',
      referenceNo = '',
      notes = '',
    } = req.body;

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required' });
    }

    let partyName = '';
    let customerDoc = null;
    let supplierDoc = null;

    if (partyType === 'CUSTOMER') {
      if (!customerId) return res.status(400).json({ success: false, message: 'Customer ID required' });
      customerDoc = await Customer.findById(customerId);
      if (!customerDoc) return res.status(404).json({ success: false, message: 'Customer not found' });
      partyName = customerDoc.name;

      // Update customer ledger
      customerDoc.currentBalance = Math.max(0, Number((customerDoc.currentBalance - payAmount).toFixed(2)));
      customerDoc.totalPaid = Number((customerDoc.totalPaid + payAmount).toFixed(2));
      await customerDoc.save();

      // If CASH, record in open CashSession
      if (paymentMethod === 'CASH') {
        const openSession = await CashSession.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
        if (openSession) {
          openSession.cashReceivedPayments += payAmount;
          openSession.expectedCash =
            openSession.openingCash +
            openSession.cashSalesTotal +
            openSession.cashReceivedPayments -
            openSession.cashPaidExpenses -
            openSession.cashPaidSupplierPayments;
          await openSession.save();
        }
      }
    } else if (partyType === 'SUPPLIER') {
      if (!supplierId) return res.status(400).json({ success: false, message: 'Supplier ID required' });
      supplierDoc = await Supplier.findById(supplierId);
      if (!supplierDoc) return res.status(404).json({ success: false, message: 'Supplier not found' });
      partyName = supplierDoc.businessName;

      // Update supplier balance
      supplierDoc.currentBalance = Math.max(0, Number((supplierDoc.currentBalance - payAmount).toFixed(2)));
      await supplierDoc.save();

      // If CASH paid to supplier, record in CashSession
      if (paymentMethod === 'CASH') {
        const openSession = await CashSession.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
        if (openSession) {
          openSession.cashPaidSupplierPayments += payAmount;
          openSession.expectedCash =
            openSession.openingCash +
            openSession.cashSalesTotal +
            openSession.cashReceivedPayments -
            openSession.cashPaidExpenses -
            openSession.cashPaidSupplierPayments;
          await openSession.save();
        }
      }
    } else {
      return res.status(400).json({ success: false, message: 'Invalid partyType (CUSTOMER or SUPPLIER required)' });
    }

    const paymentNumber = `PAY-${Date.now().toString().slice(-6)}`;

    const payment = await Payment.create({
      paymentNumber,
      partyType,
      customer: customerDoc ? customerDoc._id : null,
      supplier: supplierDoc ? supplierDoc._id : null,
      partyName,
      amount: payAmount,
      paymentMethod,
      referenceNo,
      notes,
      createdBy: req.user._id,
    });

    await logAudit({
      user: req.user,
      action: 'RECORD_PAYMENT',
      entity: 'Payment',
      entityId: payment._id,
      details: { paymentNumber, partyType, partyName, amount: payAmount, paymentMethod },
      req,
    });

    res.status(201).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPayments,
  recordPayment,
};
