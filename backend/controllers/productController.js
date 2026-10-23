const Product = require('../models/Product');
const StockMovement = require('../models/StockMovement');
const { logAudit } = require('../middleware/auditLogger');

// Helper to generate unique SKU if not provided
const generateSKU = async (categoryName) => {
  const prefix = (categoryName ? categoryName.substring(0, 3).toUpperCase() : 'PRD');
  const count = await Product.countDocuments();
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}-${count + 1}-${randomNum}`;
};

// @desc    Get all products with filtering, search & pagination
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      brand,
      stockStatus,
      page = 1,
      limit = 25,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const query = { isActive: true };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { barcode: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } },
        { sizeSpec: { $regex: search, $options: 'i' } },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (brand) {
      query.brand = { $regex: brand, $options: 'i' };
    }

    if (stockStatus === 'low') {
      query.$expr = {
        $and: [
          { $gt: ['$currentStock', 0] },
          { $lte: ['$currentStock', '$minStockAlert'] },
        ],
      };
    } else if (stockStatus === 'out') {
      query.currentStock = { $lte: 0 };
    } else if (stockStatus === 'in_stock') {
      query.currentStock = { $gt: 0 };
    }

    const total = await Product.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const sortOption = {};
    sortOption[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const products = await Product.find(query)
      .populate('category', 'name code')
      .populate('unit', 'name code allowDecimals')
      .populate('preferredSupplier', 'name businessName phone')
      .sort(sortOption)
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: products,
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

// @desc    Lookup product by barcode or SKU (for barcode scanner / POS)
// @route   GET /api/products/lookup/:code
// @access  Private
const lookupProduct = async (req, res, next) => {
  try {
    const code = req.params.code.trim();
    const product = await Product.findOne({
      isActive: true,
      $or: [{ barcode: code }, { sku: code.toUpperCase() }],
    })
      .populate('category', 'name code')
      .populate('unit', 'name code allowDecimals');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found for scanned code' });
    }

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product details with recent stock movements
// @route   GET /api/products/:id
// @access  Private
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name code')
      .populate('unit', 'name code allowDecimals')
      .populate('preferredSupplier', 'name businessName phone');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const movements = await StockMovement.find({ product: product._id })
      .populate('user', 'name role')
      .sort({ createdAt: -1 })
      .limit(20);

    res.json({ success: true, data: { ...product.toObject(), movements } });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new product
// @route   POST /api/products
// @access  Private/Storekeeper, Admin
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      sku,
      barcode,
      category,
      brand,
      description,
      sizeSpec,
      unit,
      purchasePrice,
      sellingPrice,
      wholesalePrice,
      gstRate,
      hsnCode,
      openingStock = 0,
      minStockAlert = 5,
      preferredSupplier,
      rackLocation,
      imageUrl,
    } = req.body;

    let finalSku = sku ? sku.trim().toUpperCase() : await generateSKU();

    // Check duplicate SKU
    const existingSku = await Product.findOne({ sku: finalSku });
    if (existingSku) {
      return res.status(400).json({ success: false, message: `Product with SKU '${finalSku}' already exists` });
    }

    // Check duplicate barcode if barcode provided
    if (barcode && barcode.trim()) {
      const existingBarcode = await Product.findOne({ barcode: barcode.trim() });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: `Product with barcode '${barcode}' already exists` });
      }
    }

    const product = await Product.create({
      name,
      sku: finalSku,
      barcode: barcode ? barcode.trim() : undefined,
      category,
      brand,
      description,
      sizeSpec,
      unit,
      purchasePrice: Number(purchasePrice),
      sellingPrice: Number(sellingPrice),
      wholesalePrice: wholesalePrice ? Number(wholesalePrice) : 0,
      gstRate: Number(gstRate || 18),
      hsnCode: hsnCode ? hsnCode.trim() : '',
      currentStock: Number(openingStock) || 0,
      minStockAlert: Number(minStockAlert) || 5,
      preferredSupplier: preferredSupplier || null,
      rackLocation: rackLocation ? rackLocation.trim() : '',
      imageUrl: imageUrl || '',
    });

    // Record opening stock movement if > 0
    if (Number(openingStock) > 0) {
      await StockMovement.create({
        product: product._id,
        movementType: 'OPENING',
        quantity: Number(openingStock),
        previousStock: 0,
        newStock: Number(openingStock),
        unitCost: Number(purchasePrice),
        referenceDocument: 'OPENING-STOCK',
        referenceModel: 'Opening',
        reason: 'Initial opening stock setup',
        user: req.user._id,
      });
    }

    await logAudit({
      user: req.user,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, sku: product.sku, currentStock: product.currentStock },
      req,
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Update product
// @route   PUT /api/products/:id
// @access  Private/Storekeeper, Admin
const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const {
      name,
      sku,
      barcode,
      category,
      brand,
      description,
      sizeSpec,
      unit,
      purchasePrice,
      sellingPrice,
      wholesalePrice,
      gstRate,
      hsnCode,
      minStockAlert,
      preferredSupplier,
      rackLocation,
      imageUrl,
      isActive,
      stockAdjustment, // Optional manual adjustment: { newStock, reason }
    } = req.body;

    if (sku && sku.toUpperCase() !== product.sku) {
      const existingSku = await Product.findOne({ sku: sku.toUpperCase(), _id: { $ne: product._id } });
      if (existingSku) {
        return res.status(400).json({ success: false, message: 'SKU already in use by another product' });
      }
      product.sku = sku.toUpperCase();
    }

    if (barcode && barcode.trim() !== product.barcode) {
      const existingBarcode = await Product.findOne({ barcode: barcode.trim(), _id: { $ne: product._id } });
      if (existingBarcode) {
        return res.status(400).json({ success: false, message: 'Barcode already in use by another product' });
      }
      product.barcode = barcode.trim();
    }

    if (name) product.name = name;
    if (category) product.category = category;
    if (brand !== undefined) product.brand = brand;
    if (description !== undefined) product.description = description;
    if (sizeSpec !== undefined) product.sizeSpec = sizeSpec;
    if (unit) product.unit = unit;
    if (purchasePrice !== undefined) product.purchasePrice = Number(purchasePrice);
    if (sellingPrice !== undefined) product.sellingPrice = Number(sellingPrice);
    if (wholesalePrice !== undefined) product.wholesalePrice = Number(wholesalePrice);
    if (gstRate !== undefined) product.gstRate = Number(gstRate);
    if (hsnCode !== undefined) product.hsnCode = hsnCode;
    if (minStockAlert !== undefined) product.minStockAlert = Number(minStockAlert);
    if (preferredSupplier !== undefined) product.preferredSupplier = preferredSupplier || null;
    if (rackLocation !== undefined) product.rackLocation = rackLocation;
    if (imageUrl !== undefined) product.imageUrl = imageUrl;
    if (isActive !== undefined) product.isActive = isActive;

    // Handle manual stock adjustment with mandatory stock movement audit
    if (stockAdjustment && typeof stockAdjustment.newStock === 'number') {
      const previousStock = product.currentStock;
      const targetStock = Number(stockAdjustment.newStock);
      const diff = targetStock - previousStock;

      if (diff !== 0) {
        product.currentStock = targetStock;
        await StockMovement.create({
          product: product._id,
          movementType: 'ADJUSTMENT',
          quantity: diff,
          previousStock,
          newStock: targetStock,
          unitCost: product.purchasePrice,
          referenceDocument: 'MANUAL-ADJUSTMENT',
          referenceModel: 'Adjustment',
          reason: stockAdjustment.reason || 'Manual stock reconciliation',
          user: req.user._id,
        });
      }
    }

    await product.save();

    await logAudit({
      user: req.user,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, sku: product.sku, currentStock: product.currentStock },
      req,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    await logAudit({
      user: req.user,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: product._id,
      details: { name: product.name, sku: product.sku },
      req,
    });

    res.json({ success: true, message: 'Product deactivated successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Export products as CSV
// @route   GET /api/products/export/csv
// @access  Private
const exportProductsCSV = async (req, res, next) => {
  try {
    const products = await Product.find({ isActive: true })
      .populate('category', 'name')
      .populate('unit', 'code');

    const headers = 'SKU,Name,Category,Brand,Size/Spec,Unit,Purchase Price,Selling Price,Wholesale Price,GST %,HSN,Current Stock,Min Stock,Rack Location\n';
    const rows = products.map((p) => {
      const escape = (val) => `"${(val || '').toString().replace(/"/g, '""')}"`;
      return [
        escape(p.sku),
        escape(p.name),
        escape(p.category ? p.category.name : ''),
        escape(p.brand),
        escape(p.sizeSpec),
        escape(p.unit ? p.unit.code : 'Pcs'),
        p.purchasePrice,
        p.sellingPrice,
        p.wholesalePrice,
        p.gstRate,
        escape(p.hsnCode),
        p.currentStock,
        p.minStockAlert,
        escape(p.rackLocation),
      ].join(',');
    });

    const csv = headers + rows.join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=hardware_products.csv');
    res.send(csv);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProducts,
  lookupProduct,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  exportProductsCSV,
};
