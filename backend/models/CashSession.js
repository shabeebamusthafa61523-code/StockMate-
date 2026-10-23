const mongoose = require('mongoose');

const cashSessionSchema = new mongoose.Schema(
  {
    sessionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    openedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    openingCash: {
      type: Number,
      required: true,
      default: 0,
    },
    cashSalesTotal: {
      type: Number,
      default: 0,
    },
    cashReceivedPayments: {
      type: Number,
      default: 0,
    },
    cashPaidExpenses: {
      type: Number,
      default: 0,
    },
    cashPaidSupplierPayments: {
      type: Number,
      default: 0,
    },
    expectedCash: {
      type: Number,
      default: 0,
    },
    actualCash: {
      type: Number,
      default: null,
    },
    difference: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['OPEN', 'CLOSED'],
      default: 'OPEN',
      index: true,
    },
    closedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    closedAt: {
      type: Date,
    },
    notes: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model('CashSession', cashSessionSchema);
