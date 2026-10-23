const mongoose = require('mongoose');

const salesReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    originalSale: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sale',
      required: true,
    },
    invoiceNumber: {
      type: String,
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
    },
    customerName: {
      type: String,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        productName: String,
        quantity: {
          type: Number,
          required: true,
        },
        returnPrice: {
          type: Number,
          required: true,
        },
        taxRate: {
          type: Number,
          default: 0,
        },
        refundAmount: {
          type: Number,
          required: true,
        },
      },
    ],
    totalRefund: {
      type: Number,
      required: true,
    },
    refundMethod: {
      type: String,
      enum: ['CASH', 'CREDIT_ADJUSTMENT', 'UPI', 'BANK_TRANSFER'],
      default: 'CASH',
    },
    reason: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    returnDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SalesReturn', salesReturnSchema);
