const mongoose = require('mongoose');

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
    },
    supplierName: String,
    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Purchase',
    },
    purchaseNumber: String,
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
        totalRefund: {
          type: Number,
          required: true,
        },
      },
    ],
    grandTotalRefund: {
      type: Number,
      required: true,
    },
    refundStatus: {
      type: String,
      enum: ['ADJUSTED_TO_BALANCE', 'RECEIVED_CASH', 'RECEIVED_BANK'],
      default: 'ADJUSTED_TO_BALANCE',
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

module.exports = mongoose.model('PurchaseReturn', purchaseReturnSchema);
