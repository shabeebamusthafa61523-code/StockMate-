const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      index: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      index: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category is required'],
    },
    brand: {
      type: String,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      trim: true,
    },
    sizeSpec: {
      type: String,
      trim: true,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: [true, 'Unit of measurement is required'],
    },
    purchasePrice: {
      type: Number,
      required: [true, 'Purchase price is required'],
      min: [0, 'Purchase price cannot be negative'],
    },
    sellingPrice: {
      type: Number,
      required: [true, 'Selling price is required'],
      min: [0, 'Selling price cannot be negative'],
    },
    wholesalePrice: {
      type: Number,
      default: 0,
    },
    gstRate: {
      type: Number,
      default: 18,
      enum: [0, 5, 12, 18, 28],
    },
    hsnCode: {
      type: String,
      trim: true,
      default: '',
    },
    currentStock: {
      type: Number,
      default: 0,
    },
    minStockAlert: {
      type: Number,
      default: 5,
    },
    preferredSupplier: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Supplier',
    },
    rackLocation: {
      type: String,
      trim: true,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Text search index for quick POS searches
productSchema.index({ name: 'text', brand: 'text', sku: 'text', barcode: 'text', sizeSpec: 'text' });

module.exports = mongoose.model('Product', productSchema);
