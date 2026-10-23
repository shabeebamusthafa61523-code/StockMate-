const StockMovement = require('../models/StockMovement');
const Product = require('../models/Product');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get stock movements with filters & pagination
// @route   GET /api/inventory/movements
// @access  Private
const getStockMovements = async (req, res, next) => {
  try {
    const { productId, movementType, startDate, endDate, page = 1, limit = 25 } = req.query;
    const query = {};

    if (productId) query.product = productId;
    if (movementType) query.movementType = movementType;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const total = await StockMovement.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const movements = await StockMovement.find(query)
      .populate('product', 'name sku brand sizeSpec unit')
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: movements,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit)),
        limit: Number(limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Record damaged / expired / lost stock
// @route   POST /api/inventory/damage
// @access  Private/Storekeeper, Admin
const recordDamage = async (req, res, next) => {
  try {
    const { productId, quantity, reason = 'Damaged in shop / transit' } = req.body;
    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, message: 'Valid positive quantity required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (product.currentStock < qty) {
      return res.status(400).json({
        success: false,
        message: `Cannot record damage of ${qty} units. Current stock is only ${product.currentStock}`,
      });
    }

    const previousStock = product.currentStock;
    const newStock = previousStock - qty;
    product.currentStock = newStock;
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      movementType: 'DAMAGE',
      quantity: -qty,
      previousStock,
      newStock,
      unitCost: product.purchasePrice,
      referenceDocument: `DMG-${Date.now().toString().slice(-6)}`,
      referenceModel: 'Adjustment',
      reason,
      user: req.user._id,
    });

    await logAudit({
      user: req.user,
      action: 'RECORD_DAMAGE',
      entity: 'Product',
      entityId: product._id,
      details: { productName: product.name, quantity: qty, reason },
      req,
    });

    res.status(201).json({ success: true, message: 'Damaged stock recorded', data: movement });
  } catch (error) {
    next(error);
  }
};

// @desc    Record manual stock adjustment (count correction)
// @route   POST /api/inventory/adjust
// @access  Private/Storekeeper, Admin
const recordAdjustment = async (req, res, next) => {
  try {
    const { productId, countedStock, reason = 'Physical stock audit adjustment' } = req.body;
    const target = Number(countedStock);

    if (isNaN(target) || target < 0) {
      return res.status(400).json({ success: false, message: 'Valid non-negative stock count required' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const previousStock = product.currentStock;
    const diff = target - previousStock;

    if (diff === 0) {
      return res.status(400).json({ success: false, message: 'Counted stock matches current stock. No adjustment needed.' });
    }

    product.currentStock = target;
    await product.save();

    const movement = await StockMovement.create({
      product: product._id,
      movementType: 'ADJUSTMENT',
      quantity: diff,
      previousStock,
      newStock: target,
      unitCost: product.purchasePrice,
      referenceDocument: `ADJ-${Date.now().toString().slice(-6)}`,
      referenceModel: 'Adjustment',
      reason,
      user: req.user._id,
    });

    await logAudit({
      user: req.user,
      action: 'STOCK_ADJUSTMENT',
      entity: 'Product',
      entityId: product._id,
      details: { productName: product.name, previousStock, newStock: target, diff, reason },
      req,
    });

    res.status(201).json({ success: true, message: 'Stock adjustment saved', data: movement });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStockMovements,
  recordDamage,
  recordAdjustment,
};
