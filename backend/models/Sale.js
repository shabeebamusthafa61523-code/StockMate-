const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  productName: {
    type: String,
    required: true,
  },
  sku: {
    type: String,
    required: true,
  },
  hsnCode: {
    type: String,
    default: '',
  },
  unit: {
    type: String,
    default: 'Pcs',
  },
  quantity: {
    type: Number,
    required: true,
    min: [0.001, 'Quantity must be positive'],
  },
  unitPrice: {
    type: Number,
    required: true,
  },
  purchasePrice: {
    type: Number,
    default: 0, // Snapshot for gross profit calculation
  },
  discountPercent: {
    type: Number,
    default: 0,
  },
  discountAmount: {
    type: Number,
    default: 0,
  },
  taxRate: {
    type: Number,
    default: 0,
  },
  taxType: {
    type: String,
    enum: ['INCLUSIVE', 'EXCLUSIVE'],
    default: 'INCLUSIVE',
  },
  taxableAmount: {
    type: Number,
    required: true,
  },
  cgst: {
    type: Number,
    default: 0,
  },
  sgst: {
    type: Number,
    default: 0,
  },
  igst: {
    type: Number,
    default: 0,
  },
  total: {
    type: Number,
    required: true,
  },
});

const salePaymentSchema = new mongoose.Schema({
  method: {
    type: String,
    enum: ['CASH', 'UPI', 'CARD', 'BANK_TRANSFER', 'CREDIT'],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  referenceNo: {
    type: String,
    default: '',
  },
  receivedAt: {
    type: Date,
    default: Date.now,
  },
});

const saleSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      default: null,
      index: true,
    },
    customerName: {
      type: String,
      default: 'Walk-in Customer',
    },
    customerPhone: {
      type: String,
      default: '',
    },
    customerGstin: {
      type: String,
      default: '',
    },
    items: [saleItemSchema],
    subtotal: {
      type: Number,
      required: true,
    },
    totalDiscount: {
      type: Number,
      default: 0,
    },
    taxableTotal: {
      type: Number,
      default: 0,
    },
    totalCgst: {
      type: Number,
      default: 0,
    },
    totalSgst: {
      type: Number,
      default: 0,
    },
    totalIgst: {
      type: Number,
      default: 0,
    },
    roundOff: {
      type: Number,
      default: 0,
    },
    grandTotal: {
      type: Number,
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PAID', 'PARTIAL', 'CREDIT'],
      default: 'PAID',
      index: true,
    },
    payments: [salePaymentSchema],
    amountReceived: {
      type: Number,
      default: 0,
    },
    balanceDue: {
      type: Number,
      default: 0,
    },
    isInterstate: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'CANCELLED', 'RETURNED'],
      default: 'COMPLETED',
      index: true,
    },
    cancelReason: {
      type: String,
    },
    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cancelledAt: {
      type: Date,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    notes: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);
