const Customer = require('../models/Customer');
const Sale = require('../models/Sale');
const Payment = require('../models/Payment');
const SalesReturn = require('../models/SalesReturn');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get all customers with optional search & filtering
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const { search, hasBalance } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    if (hasBalance === 'true') {
      query.currentBalance = { $gt: 0 };
    }

    const customers = await Customer.find(query).sort({ currentBalance: -1, name: 1 });
    res.json({ success: true, data: customers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get customer details with combined chronological ledger
// @route   GET /api/customers/:id
// @access  Private
const getCustomerById = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    const sales = await Sale.find({ customer: customer._id }).sort({ invoiceDate: -1 });
    const payments = await Payment.find({ customer: customer._id, partyType: 'CUSTOMER' }).sort({ paymentDate: -1 });
    const returns = await SalesReturn.find({ customer: customer._id }).sort({ returnDate: -1 });

    // Build unified chronological ledger
    const ledger = [];

    // Opening balance entry if exists
    if (customer.openingBalance) {
      ledger.push({
        date: customer.createdAt,
        type: 'OPENING_BALANCE',
        reference: 'OPENING',
        debit: customer.openingBalance > 0 ? customer.openingBalance : 0,
        credit: customer.openingBalance < 0 ? Math.abs(customer.openingBalance) : 0,
        description: 'Opening Balance',
      });
    }

    sales.forEach((s) => {
      ledger.push({
        date: s.invoiceDate,
        type: 'SALE_INVOICE',
        reference: s.invoiceNumber,
        referenceId: s._id,
        debit: s.grandTotal, // Bill increases customer debt
        credit: s.amountReceived, // Immediate payment decreases debt
        balanceChange: s.balanceDue,
        description: `Invoice ${s.invoiceNumber} (${s.items.length} items)`,
      });
    });

    payments.forEach((p) => {
      ledger.push({
        date: p.paymentDate,
        type: 'PAYMENT_RECEIVED',
        reference: p.paymentNumber,
        referenceId: p._id,
        debit: 0,
        credit: p.amount, // Payment decreases debt
        description: `Payment via ${p.paymentMethod}${p.referenceNo ? ` (Ref: ${p.referenceNo})` : ''}`,
      });
    });

    returns.forEach((r) => {
      ledger.push({
        date: r.returnDate,
        type: 'SALES_RETURN',
        reference: r.returnNumber,
        referenceId: r._id,
        debit: 0,
        credit: r.totalRefund,
        description: `Sales Return against ${r.invoiceNumber}`,
      });
    });

    // Sort ledger by date descending
    ledger.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      success: true,
      data: {
        ...customer.toObject(),
        ledger,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const { name, phone, email, address, gstin, state, openingBalance = 0, creditLimit = 0, notes } = req.body;

    const existing = await Customer.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: `Customer with phone ${phone} already exists` });
    }

    const customer = await Customer.create({
      name,
      phone: phone.trim(),
      email,
      address,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      state: state || 'Maharashtra',
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      creditLimit: Number(creditLimit) || 0,
      notes,
    });

    await logAudit({
      user: req.user,
      action: 'CREATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      details: { name: customer.name, phone: customer.phone },
      req,
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    await logAudit({
      user: req.user,
      action: 'UPDATE_CUSTOMER',
      entity: 'Customer',
      entityId: customer._id,
      details: { name: customer.name, currentBalance: customer.currentBalance },
      req,
    });

    res.json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
};
