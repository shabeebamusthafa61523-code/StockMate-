const Purchase = require('../models/Purchase');
const PurchaseReturn = require('../models/PurchaseReturn');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');
const StockMovement = require('../models/StockMovement');
const { logAudit } = require('../middleware/auditLogger');

// @desc    Get purchases with filters & pagination
// @route   GET /api/purchases
// @access  Private
const getPurchases = async (req, res, next) => {
  try {
    const {
      search,
      supplierId,
      status,
      paymentStatus,
      startDate,
      endDate,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { purchaseNumber: { $regex: search, $options: 'i' } },
        { supplierInvoiceNo: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } },
      ];
    }

    if (supplierId) query.supplier = supplierId;
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      query.purchaseDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.purchaseDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.purchaseDate.$lte = end;
      }
    }

    const total = await Purchase.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const purchases = await Purchase.find(query)
      .populate('supplier', 'name businessName phone currentBalance')
      .populate('createdBy', 'name role')
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: purchases,
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

// @desc    Get single purchase by ID
// @route   GET /api/purchases/:id
// @access  Private
const getPurchaseById = async (req, res, next) => {
  try {
    const purchase = await Purchase.findById(req.params.id)
      .populate('supplier', 'name businessName phone address gstin')
      .populate('createdBy', 'name role');

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    res.json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// @desc    Create purchase invoice & receive stock
// @route   POST /api/purchases
// @access  Private/Admin, Storekeeper
const createPurchase = async (req, res, next) => {
  try {
    const {
      supplierId,
      supplierInvoiceNo,
      purchaseDate = new Date(),
      items,
      amountPaid = 0,
      paymentMethod = 'CREDIT',
      status = 'RECEIVED',
      notes = '',
    } = req.body;

    if (!supplierId) {
      return res.status(400).json({ success: false, message: 'Supplier is required' });
    }

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, message: 'Supplier not found' });
    }

    // Check duplicate supplier invoice number
    if (supplierInvoiceNo && supplierInvoiceNo.trim()) {
      const existing = await Purchase.findOne({
        supplier: supplierId,
        supplierInvoiceNo: supplierInvoiceNo.trim(),
      });
      if (existing) {
        return res.status(400).json({
          success: false,
          message: `Invoice '${supplierInvoiceNo}' from this supplier has already been recorded`,
        });
      }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items are required' });
    }

    let calculatedSubtotal = 0;
    let calculatedTax = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found` });
      }

      const qty = Number(item.quantity);
      const price = Number(item.purchasePrice !== undefined ? item.purchasePrice : product.purchasePrice);
      const taxRate = Number(item.taxRate !== undefined ? item.taxRate : product.gstRate || 0);

      const lineSubtotal = qty * price;
      const lineTax = (lineSubtotal * taxRate) / 100;
      const lineTotal = lineSubtotal + lineTax;

      calculatedSubtotal += lineSubtotal;
      calculatedTax += lineTax;

      processedItems.push({
        product: product._id,
        productName: product.name,
        quantity: qty,
        purchasePrice: price,
        taxRate,
        taxAmount: Number(lineTax.toFixed(2)),
        total: Number(lineTotal.toFixed(2)),
      });
    }

    const grandTotal = Number((calculatedSubtotal + calculatedTax).toFixed(2));
    const paid = Number(amountPaid) || 0;
    const balanceDue = Math.max(0, Number((grandTotal - paid).toFixed(2)));

    let paymentStatus = 'UNPAID';
    if (paid >= grandTotal) {
      paymentStatus = 'PAID';
    } else if (paid > 0) {
      paymentStatus = 'PARTIAL';
    }

    const purchaseNumber = `PO-${Date.now().toString().slice(-6)}`;

    const purchase = await Purchase.create({
      purchaseNumber,
      supplier: supplier._id,
      supplierName: supplier.businessName,
      supplierInvoiceNo: supplierInvoiceNo ? supplierInvoiceNo.trim() : '',
      purchaseDate,
      items: processedItems,
      subtotal: Number(calculatedSubtotal.toFixed(2)),
      totalTax: Number(calculatedTax.toFixed(2)),
      grandTotal,
      paymentStatus,
      amountPaid: paid,
      balanceDue,
      paymentMethod,
      status,
      notes,
      createdBy: req.user._id,
    });

    // If status is RECEIVED, update product inventory & record StockMovement
    if (status === 'RECEIVED') {
      for (const item of processedItems) {
        const prod = await Product.findById(item.product);
        if (prod) {
          const previousStock = prod.currentStock;
          const newStock = previousStock + item.quantity;
          prod.currentStock = newStock;
          // Also optionally update product's purchase price to latest
          prod.purchasePrice = item.purchasePrice;
          await prod.save();

          await StockMovement.create({
            product: prod._id,
            movementType: 'PURCHASE',
            quantity: item.quantity,
            previousStock,
            newStock,
            unitCost: item.purchasePrice,
            referenceDocument: purchaseNumber,
            referenceModel: 'Purchase',
            referenceId: purchase._id,
            reason: `Purchased from ${supplier.businessName} (Inv: ${supplierInvoiceNo || purchaseNumber})`,
            user: req.user._id,
          });
        }
      }
    }

    // Update supplier outstanding balance (balanceDue increases what we owe the supplier)
    if (balanceDue > 0) {
      supplier.currentBalance += balanceDue;
      await supplier.save();
    }

    await logAudit({
      user: req.user,
      action: 'CREATE_PURCHASE',
      entity: 'Purchase',
      entityId: purchase._id,
      details: { purchaseNumber, grandTotal, supplier: supplier.businessName, balanceDue },
      req,
    });

    res.status(201).json({ success: true, data: purchase });
  } catch (error) {
    next(error);
  }
};

// @desc    Process Purchase Return to Supplier (e.g. damaged goods / wrong item)
// @route   POST /api/purchases/:id/return
// @access  Private/Admin, Storekeeper
const processPurchaseReturn = async (req, res, next) => {
  try {
    const { items, reason = 'Damaged goods return' } = req.body;
    const purchase = await Purchase.findById(req.params.id);

    if (!purchase) {
      return res.status(404).json({ success: false, message: 'Purchase not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Return items required' });
    }

    let totalRefund = 0;
    const returnItems = [];

    for (const ret of items) {
      const origItem = purchase.items.find((i) => i.product.toString() === ret.productId.toString());
      if (!origItem) {
        return res.status(400).json({ success: false, message: 'Product not found in this purchase' });
      }

      const qty = Number(ret.quantity);
      if (qty <= 0 || qty > origItem.quantity) {
        return res.status(400).json({ success: false, message: `Invalid return quantity for ${origItem.productName}` });
      }

      const lineTotal = Number(((origItem.total / origItem.quantity) * qty).toFixed(2));
      totalRefund += lineTotal;

      returnItems.push({
        product: origItem.product,
        productName: origItem.productName,
        quantity: qty,
        returnPrice: origItem.purchasePrice,
        taxRate: origItem.taxRate,
        totalRefund: lineTotal,
      });

      // Deduct product stock
      const prod = await Product.findById(origItem.product);
      if (prod) {
        const previousStock = prod.currentStock;
        const newStock = Math.max(0, previousStock - qty);
        prod.currentStock = newStock;
        await prod.save();

        await StockMovement.create({
          product: prod._id,
          movementType: 'PURCHASE_RETURN',
          quantity: -qty,
          previousStock,
          newStock,
          unitCost: origItem.purchasePrice,
          referenceDocument: purchase.purchaseNumber,
          referenceModel: 'PurchaseReturn',
          reason: `Returned to supplier: ${reason}`,
          user: req.user._id,
        });
      }
    }

    const returnNumber = `PRET-${Date.now().toString().slice(-6)}`;

    const purchaseReturn = await PurchaseReturn.create({
      returnNumber,
      supplier: purchase.supplier,
      supplierName: purchase.supplierName,
      purchase: purchase._id,
      purchaseNumber: purchase.purchaseNumber,
      items: returnItems,
      grandTotalRefund: Number(totalRefund.toFixed(2)),
      reason,
      createdBy: req.user._id,
    });

    // Reduce supplier balance
    const supplier = await Supplier.findById(purchase.supplier);
    if (supplier) {
      supplier.currentBalance = Math.max(0, supplier.currentBalance - totalRefund);
      await supplier.save();
    }

    await logAudit({
      user: req.user,
      action: 'PURCHASE_RETURN',
      entity: 'PurchaseReturn',
      entityId: purchaseReturn._id,
      details: { returnNumber, grandTotalRefund: totalRefund, supplier: purchase.supplierName },
      req,
    });

    res.status(201).json({ success: true, data: purchaseReturn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPurchases,
  getPurchaseById,
  createPurchase,
  processPurchaseReturn,
};
