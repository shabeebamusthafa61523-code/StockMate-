const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Contact person name is required'],
      trim: true,
    },
    businessName: {
      type: String,
      required: [true, 'Supplier business name is required'],
      trim: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      trim: true,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
    },
    state: {
      type: String,
      default: 'Maharashtra',
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0, // Positive means we owe money to supplier
    },
    bankDetails: {
      bankName: String,
      accountNo: String,
      ifsc: String,
      upiId: String,
    },
    notes: String,
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);
