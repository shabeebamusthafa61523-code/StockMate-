const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema(
  {
    expenseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Expense title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['RENT', 'ELECTRICITY', 'SALARY', 'TRANSPORT', 'TEA_SNACKS', 'MAINTENANCE', 'PACKAGING', 'OTHER'],
      default: 'OTHER',
      index: true,
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0.01, 'Amount must be greater than zero'],
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CARD'],
      default: 'CASH',
    },
    expenseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    paidTo: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Expense', expenseSchema);
