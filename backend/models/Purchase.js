const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be positive'],
  },
  purchasePrice: {
    type: Number,
    required: true,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const purchaseSchema = new mongoose.Schema(
  {
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    supplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
      required: true,
      index: true,
    },
    supplierName: {
      type: String,
      required: true,
    },
    supplierInvoiceNo: {
      type: String,
      trim: true,
      index: true,
    },
    purchaseDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    items: [purchaseItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    totalTax: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'UNPAID'],
      default: 'UNPAID',
      index: true,
    },
    amountPaid: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    paymentMethod: {
      type: String,
      enum: ['CASH', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'CREDIT'],
      default: 'CREDIT',
    },
    status: {
      type: String,
      enum: ['RECEIVED', 'ORDERED', 'CANCELLED'],
      default: 'RECEIVED',
      index: true,
    },
    receivedDate: {
      type: Date,
      default: Date.now,
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

module.exports = mongoose.model('Purchase', purchaseSchema);
