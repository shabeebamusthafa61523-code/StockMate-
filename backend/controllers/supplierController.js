const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');
const Payment = require('../models/Payment');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get all suppliers with optional search
// @route   GET /api/suppliers
// @access  Private
const getSuppliers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const query = { isActive: true };

    if (search) {
      query.$or = [
        { businessName: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { gstin: { $regex: search, $options: 'i' } },
      ];
    }

    const suppliers = await Supplier.find(query).sort({ businessName: 1 });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single supplier details with purchase & payment ledger
// @route   GET /api/suppliers/:id
// @access  Private
const getSupplierById = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    const purchases = await Purchase.find({ supplier: supplier._id }).sort({ purchaseDate: -1 }).limit(20);
    const payments = await Payment.find({ supplier: supplier._id, partyType: 'SUPPLIER' }).sort({ paymentDate: -1 }).limit(20);

    res.json({
      success: true,
      data: {
        ...supplier.toObject(),
        purchases,
        payments,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new supplier
// @route   POST /api/suppliers
// @access  Private/Admin, Storekeeper
const createSupplier = async (req, res, next) => {
  try {
    const { name, businessName, phone, email, address, gstin, state, openingBalance = 0, bankDetails, notes } = req.body;

    const supplier = await Supplier.create({
      name,
      businessName,
      phone,
      email,
      address,
      gstin: gstin ? gstin.toUpperCase() : undefined,
      state: state || 'Maharashtra',
      openingBalance: Number(openingBalance) || 0,
      currentBalance: Number(openingBalance) || 0,
      bankDetails: bankDetails || {},
      notes,
    });

    await logAudit({
      user: req.user,
      action: 'CREATE_SUPPLIER',
      entity: 'Supplier',
      entityId: supplier._id,
      details: { businessName: supplier.businessName, phone: supplier.phone },
      req,
    });

    res.status(201).json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

// @desc    Update supplier
// @route   PUT /api/suppliers/:id
// @access  Private/Admin, Storekeeper
const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    await logAudit({
      user: req.user,
      action: 'UPDATE_SUPPLIER',
      entity: 'Supplier',
      entityId: supplier._id,
      details: { businessName: supplier.businessName },
      req,
    });

    res.json({ success: true, data: supplier });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
};
