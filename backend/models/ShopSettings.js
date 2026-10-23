const mongoose = require('mongoose');

const shopSettingsSchema = new mongoose.Schema(
  {
    shopName: {
      type: String,
      default: 'StockMate',
      trim: true,
    },
    tagline: {
      type: String,
      default: 'Smart Inventory Solution',
    },
    address: {
      type: String,
      default: '',
    },
    city: {
      type: String,
      default: '',
    },
    state: {
      type: String,
      default: '',
    },
    stateCode: {
      type: String,
      default: '', // Standard Indian GST state code
    },
    phone: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    gstin: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    pan: {
      type: String,
      default: '',
      trim: true,
      uppercase: true,
    },
    invoicePrefix: {
      type: String,
      default: 'INV-',
    },
    nextInvoiceNumber: {
      type: Number,
      default: 1001,
    },
    defaultTaxType: {
      type: String,
      enum: ['INCLUSIVE', 'EXCLUSIVE'],
      default: 'INCLUSIVE',
    },
    defaultGstRate: {
      type: Number,
      default: 18,
    },
    printLayout: {
      type: String,
      enum: ['A4', 'THERMAL'],
      default: 'A4',
    },
    thermalWidth: {
      type: String,
      enum: ['80mm', '58mm'],
      default: '80mm',
    },
    invoiceFooterNotes: {
      type: String,
      default: '1. Goods once sold will not be taken back without original bill.\n2. Warranty as per manufacturer terms.\nThank you! Visit Again!',
    },
    upiId: {
      type: String,
      default: '',
    },
    bankDetails: {
      bankName: { type: String, default: '' },
      accountNo: { type: String, default: '' },
      ifsc: { type: String, default: '' },
      branch: { type: String, default: '' },
      accountHolder: { type: String, default: '' },
    },
    lowStockThresholdDefault: {
      type: Number,
      default: 5,
    },
    currencySymbol: {
      type: String,
      default: '₹',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ShopSettings', shopSettingsSchema);
