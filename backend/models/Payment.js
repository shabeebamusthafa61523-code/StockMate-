const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    partyType: {
      type: String,
      enum: ['CUSTOMER', 'SUPPLIER'],
      required: true,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      index: true,
    },
    partyName: {
      type: String,
      required: true,
    },
    sale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
    },
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    amount: {
      type: Number,
      required: true,
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CHEQUE'],
      required: true,
    },
    referenceNo: {
      type: String,
      default: '',
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    notes: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Payment', paymentSchema);
