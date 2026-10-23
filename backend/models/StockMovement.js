const mongoose = require('mongoose');

const stockMovementSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
      index: true,
    },
    movementType: {
      type: String,
      enum: ['OPENING', 'PURCHASE', 'SALE', 'SALE_RETURN', 'PURCHASE_RETURN', 'DAMAGE', 'ADJUSTMENT'],
      required: true,
      index: true,
    },
    quantity: {
      type: Number,
      required: true, // Can be positive or negative depending on context, or signed where in is + and out is -
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    unitCost: {
      type: Number,
      default: 0,
    },
    referenceDocument: {
      type: String, // e.g. 'INV-1001', 'PO-2001', 'RET-3001', 'ADJ-101'
      index: true,
    },
    referenceModel: {
      type: String,
      enum: ['Sale', 'Purchase', 'SalesReturn', 'PurchaseReturn', 'Adjustment', 'Opening'],
    },
    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    reason: {
      type: String,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('StockMovement', stockMovementSchema);
