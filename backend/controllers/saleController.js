const Sale = require('../models/Sale');
const SalesReturn = require('../models/SalesReturn');
const Product = require('../models/Product');
const Customer = require('../models/Customer');
const StockMovement = require('../models/StockMovement');
const ShopSettings = require('../models/ShopSettings');
const CashSession = require('../models/CashSession');
const { logAudit } = require('../middleware/auditLogger');

// Generate unique invoice number from settings
const getNextInvoiceNumber = async () => {
  let settings = await ShopSettings.findOne();
  if (!settings) {
    settings = await ShopSettings.create({});
  }
  const prefix = settings.invoicePrefix || 'INV-';
  const num = settings.nextInvoiceNumber || 1001;
  settings.nextInvoiceNumber = num + 1;
  await settings.save();
  return `${prefix}${num}`;
};

// @desc    Create new sale / invoice (POS checkout)
// @route   POST /api/sales
// @access  Private
const createSale = async (req, res, next) => {
  try {
    const {
      customerId,
      customerName = 'Walk-in Customer',
      customerPhone = '',
      customerGstin = '',
      items,
      payments = [],
      discountTotal = 0,
      roundOff = 0,
      isInterstate = false,
      notes = '',
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required' });
    }

    // Step 1: Validate stock on server & fetch live product details
    const populatedItems = [];
    let calculatedSubtotal = 0;
    let calculatedTaxableTotal = 0;
    let calculatedCgst = 0;
    let calculatedSgst = 0;
    let calculatedIgst = 0;
    let calculatedGrandTotal = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId || item.product);
      if (!product || !product.isActive) {
        return res.status(400).json({
          success: false,
          message: `Product ${item.productName || item.sku || 'Unknown'} is not available`,
        });
      }

      const qty = Number(item.quantity);
      if (qty <= 0) {
        return res.status(400).json({ success: false, message: `Invalid quantity for ${product.name}` });
      }

      // Check stock availability
      if (product.currentStock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for '${product.name}'. Available: ${product.currentStock}, Requested: ${qty}`,
        });
      }

      const unitPrice = Number(item.unitPrice !== undefined ? item.unitPrice : product.sellingPrice);
      const discountPercent = Number(item.discountPercent || 0);
      const lineRawTotal = unitPrice * qty;
      const discountAmount = Number(item.discountAmount !== undefined ? item.discountAmount : (lineRawTotal * discountPercent) / 100);
      const lineAfterDiscount = Math.max(0, lineRawTotal - discountAmount);

      const gstRate = Number(item.gstRate !== undefined ? item.gstRate : product.gstRate || 0);
      const taxType = item.taxType || 'INCLUSIVE';

      let taxableAmount = 0;
      let taxAmount = 0;

      if (taxType === 'INCLUSIVE') {
        // Price includes GST
        taxableAmount = Number((lineAfterDiscount / (1 + gstRate / 100)).toFixed(2));
        taxAmount = Number((lineAfterDiscount - taxableAmount).toFixed(2));
      } else {
        // Price excludes GST
        taxableAmount = Number(lineAfterDiscount.toFixed(2));
        taxAmount = Number(((taxableAmount * gstRate) / 100).toFixed(2));
      }

      let cgst = 0;
      let sgst = 0;
      let igst = 0;

      if (isInterstate) {
        igst = taxAmount;
      } else {
        cgst = Number((taxAmount / 2).toFixed(2));
        sgst = Number((taxAmount - cgst).toFixed(2)); // Ensures no fractional rounding mismatch
      }

      const lineTotal = Number((taxableAmount + taxAmount).toFixed(2));

      calculatedSubtotal += lineRawTotal;
      calculatedTaxableTotal += taxableAmount;
      calculatedCgst += cgst;
      calculatedSgst += sgst;
      calculatedIgst += igst;
      calculatedGrandTotal += lineTotal;

      populatedItems.push({
        product: product._id,
        productName: product.name,
        sku: product.sku,
        hsnCode: product.hsnCode || '',
        unit: item.unit || 'Pcs',
        quantity: qty,
        unitPrice,
        purchasePrice: product.purchasePrice || 0,
        discountPercent,
        discountAmount,
        taxRate: gstRate,
        taxType,
        taxableAmount,
        cgst,
        sgst,
        igst,
        total: lineTotal,
      });
    }

    const finalGrandTotal = Math.max(0, Number((calculatedGrandTotal - Number(discountTotal || 0) + Number(roundOff || 0)).toFixed(2)));

    // Step 2: Calculate payment details & split
    let totalReceived = 0;
    let creditAmount = 0;

    for (const pay of payments) {
      const amt = Number(pay.amount || 0);
      if (pay.method === 'CREDIT') {
        creditAmount += amt;
      } else {
        totalReceived += amt;
      }
    }

    // If payments list was empty, assume full cash payment
    if (payments.length === 0) {
      totalReceived = finalGrandTotal;
      payments.push({ method: 'CASH', amount: finalGrandTotal, receivedAt: new Date() });
    }

    const balanceDue = Math.max(0, Number((finalGrandTotal - totalReceived).toFixed(2)));

    let paymentStatus = 'PAID';
    if (balanceDue > 0) {
      paymentStatus = totalReceived > 0 ? 'PARTIAL' : 'CREDIT';
    }

    // Step 3: If credit sale, customer is mandatory!
    let customerDoc = null;
    if (balanceDue > 0 || creditAmount > 0) {
      if (customerId) {
        customerDoc = await Customer.findById(customerId);
      } else if (customerPhone) {
        customerDoc = await Customer.findOne({ phone: customerPhone.trim() });
        if (!customerDoc && customerName) {
          // Auto create customer record for credit ledger
          customerDoc = await Customer.create({
            name: customerName,
            phone: customerPhone.trim(),
            gstin: customerGstin || '',
          });
        }
      }

      if (!customerDoc) {
        return res.status(400).json({
          success: false,
          message: 'Customer name and phone are required for Credit (Udhar) or partial payment sales',
        });
      }

      // Check credit limit if set (> 0)
      if (customerDoc.creditLimit > 0 && customerDoc.currentBalance + balanceDue > customerDoc.creditLimit) {
        return res.status(400).json({
          success: false,
          message: `Customer credit limit exceeded. Current balance: ₹${customerDoc.currentBalance}, Limit: ₹${customerDoc.creditLimit}`,
        });
      }
    }

    // Step 4: Generate unique invoice number
    const invoiceNumber = await getNextInvoiceNumber();

    // Step 5: Save Sale record
    const sale = await Sale.create({
      invoiceNumber,
      invoiceDate: new Date(),
      customer: customerDoc ? customerDoc._id : null,
      customerName: customerDoc ? customerDoc.name : customerName,
      customerPhone: customerDoc ? customerDoc.phone : customerPhone,
      customerGstin: customerDoc ? customerDoc.gstin : customerGstin,
      items: populatedItems,
      subtotal: Number(calculatedSubtotal.toFixed(2)),
      totalDiscount: Number(discountTotal || 0),
      taxableTotal: Number(calculatedTaxableTotal.toFixed(2)),
      totalCgst: Number(calculatedCgst.toFixed(2)),
      totalSgst: Number(calculatedSgst.toFixed(2)),
      totalIgst: Number(calculatedIgst.toFixed(2)),
      roundOff: Number(roundOff || 0),
      grandTotal: finalGrandTotal,
      paymentStatus,
      payments,
      amountReceived: Number(totalReceived.toFixed(2)),
      balanceDue,
      isInterstate,
      status: 'COMPLETED',
      notes,
      createdBy: req.user._id,
    });

    // Step 6: Deduct stock atomically and record StockMovement
    for (const item of populatedItems) {
      const prod = await Product.findById(item.product);
      const previousStock = prod.currentStock;
      const newStock = previousStock - item.quantity;
      prod.currentStock = newStock;
      await prod.save();

      await StockMovement.create({
        product: prod._id,
        movementType: 'SALE',
        quantity: -item.quantity,
        previousStock,
        newStock,
        unitCost: item.purchasePrice,
        referenceDocument: invoiceNumber,
        referenceModel: 'Sale',
        referenceId: sale._id,
        reason: `Sold in Invoice ${invoiceNumber}`,
        user: req.user._id,
      });
    }

    // Step 7: Update Customer balance & totals if credit/due
    if (customerDoc) {
      customerDoc.totalPurchases += finalGrandTotal;
      customerDoc.totalPaid += totalReceived;
      customerDoc.currentBalance += balanceDue;
      await customerDoc.save();
    }

    // Step 8: Update open CashSession if cash was paid
    const cashPortion = payments
      .filter((p) => p.method === 'CASH')
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);

    if (cashPortion > 0) {
      const openSession = await CashSession.findOne({ status: 'OPEN' }).sort({ createdAt: -1 });
      if (openSession) {
        openSession.cashSalesTotal += cashPortion;
        openSession.expectedCash =
          openSession.openingCash +
          openSession.cashSalesTotal +
          openSession.cashReceivedPayments -
          openSession.cashPaidExpenses -
          openSession.cashPaidSupplierPayments;
        await openSession.save();
      }
    }

    await logAudit({
      user: req.user,
      action: 'CREATE_SALE',
      entity: 'Sale',
      entityId: sale._id,
      details: { invoiceNumber, grandTotal: finalGrandTotal, customer: customerName, paymentStatus },
      req,
    });

    res.status(201).json({ success: true, data: sale });
  } catch (error) {
    next(error);
  }
};

// @desc    Get sales with pagination, search & filters
// @route   GET /api/sales
// @access  Private
const getSales = async (req, res, next) => {
  try {
    const {
      search,
      startDate,
      endDate,
      paymentStatus,
      status,
      customerId,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } },
        { customerPhone: { $regex: search, $options: 'i' } },
      ];
    }

    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (status) query.status = status;
    if (customerId) query.customer = customerId;

    if (startDate || endDate) {
      query.invoiceDate = {};
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        query.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.invoiceDate.$lte = end;
      }
    }

    const total = await Sale.countDocuments(query);
    const skip = (Number(page) - 1) * Number(limit);

    const sales = await Sale.find(query)
      .populate('createdBy', 'name role')
      .populate('customer', 'name phone currentBalance')
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(Number(limit));

    res.json({
      success: true,
      data: sales,
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

// @desc    Get single sale by ID or invoiceNumber
// @route   GET /api/sales/:id
// @access  Private
const getSaleById = async (req, res, next) => {
  try {
    const isId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
    const query = isId ? { _id: req.params.id } : { invoiceNumber: req.params.id };

    const sale = await Sale.findOne(query)
      .populate('createdBy', 'name role')
      .populate('customer', 'name phone gstin address currentBalance')
      .populate('cancelledBy', 'name role');

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    // Also fetch shop settings for printing
    const settings = (await ShopSettings.findOne()) || {};

    res.json({ success: true, data: sale, shopSettings: settings });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel sale invoice (authorized Admin/Cashier) & restore inventory
// @route   PUT /api/sales/:id/cancel
// @access  Private/Admin, Cashier
const cancelSale = async (req, res, next) => {
  try {
    const { reason = 'Cancelled by store' } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale invoice not found' });
    }

    if (sale.status === 'CANCELLED') {
      return res.status(400).json({ success: false, message: 'Sale invoice is already cancelled' });
    }

    // Step 1: Restore inventory and record StockMovement
    for (const item of sale.items) {
      const product = await Product.findById(item.product);
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock + item.quantity;
        product.currentStock = newStock;
        await product.save();

        await StockMovement.create({
          product: product._id,
          movementType: 'SALE_RETURN',
          quantity: item.quantity,
          previousStock,
          newStock,
          unitCost: item.purchasePrice,
          referenceDocument: sale.invoiceNumber,
          referenceModel: 'Sale',
          referenceId: sale._id,
          reason: `Invoice ${sale.invoiceNumber} Cancelled: ${reason}`,
          user: req.user._id,
        });
      }
    }

    // Step 2: Reverse customer balance if credit/partial
    if (sale.customer && sale.balanceDue > 0) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - sale.balanceDue);
        customer.totalPurchases = Math.max(0, customer.totalPurchases - sale.grandTotal);
        customer.totalPaid = Math.max(0, customer.totalPaid - sale.amountReceived);
        await customer.save();
      }
    }

    // Step 3: Update Sale record
    sale.status = 'CANCELLED';
    sale.cancelReason = reason;
    sale.cancelledBy = req.user._id;
    sale.cancelledAt = new Date();
    await sale.save();

    await logAudit({
      user: req.user,
      action: 'CANCEL_SALE',
      entity: 'Sale',
      entityId: sale._id,
      details: { invoiceNumber: sale.invoiceNumber, reason },
      req,
    });

    res.json({ success: true, message: 'Sale invoice cancelled and inventory restored', data: sale });
  } catch (error) {
    next(error);
  }
};

// @desc    Process Sales Return (Item-wise return & refund)
// @route   POST /api/sales/:id/return
// @access  Private/Admin, Cashier
const processSalesReturn = async (req, res, next) => {
  try {
    const { items, refundMethod = 'CASH', reason = 'Customer return' } = req.body;
    const sale = await Sale.findById(req.params.id);

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Original sale invoice not found' });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Return items required' });
    }

    let totalRefundAmount = 0;
    const returnItems = [];

    for (const retItem of items) {
      const origItem = sale.items.find((i) => i.product.toString() === retItem.productId.toString());
      if (!origItem) {
        return res.status(400).json({ success: false, message: `Product not found in original invoice` });
      }

      const qty = Number(retItem.quantity);
      if (qty <= 0 || qty > origItem.quantity) {
        return res.status(400).json({
          success: false,
          message: `Invalid return quantity (${qty}) for product ${origItem.productName}. Purchased: ${origItem.quantity}`,
        });
      }

      const lineRefund = Number(((origItem.total / origItem.quantity) * qty).toFixed(2));
      totalRefundAmount += lineRefund;

      returnItems.push({
        product: origItem.product,
        productName: origItem.productName,
        quantity: qty,
        returnPrice: origItem.unitPrice,
        taxRate: origItem.taxRate,
        refundAmount: lineRefund,
      });

      // Restore product stock
      const product = await Product.findById(origItem.product);
      if (product) {
        const previousStock = product.currentStock;
        const newStock = previousStock + qty;
        product.currentStock = newStock;
        await product.save();

        await StockMovement.create({
          product: product._id,
          movementType: 'SALE_RETURN',
          quantity: qty,
          previousStock,
          newStock,
          unitCost: origItem.purchasePrice,
          referenceDocument: sale.invoiceNumber,
          referenceModel: 'SalesReturn',
          reason: `Return against ${sale.invoiceNumber}: ${reason}`,
          user: req.user._id,
        });
      }
    }

    const returnNumber = `RET-${Date.now().toString().slice(-6)}`;

    const salesReturn = await SalesReturn.create({
      returnNumber,
      originalSale: sale._id,
      invoiceNumber: sale.invoiceNumber,
      customer: sale.customer || null,
      customerName: sale.customerName,
      items: returnItems,
      totalRefund: Number(totalRefundAmount.toFixed(2)),
      refundMethod,
      reason,
      createdBy: req.user._id,
    });

    // If credit adjustment, reduce customer's outstanding balance
    if (refundMethod === 'CREDIT_ADJUSTMENT' && sale.customer) {
      const customer = await Customer.findById(sale.customer);
      if (customer) {
        customer.currentBalance = Math.max(0, customer.currentBalance - totalRefundAmount);
        await customer.save();
      }
    }

    sale.status = 'RETURNED';
    await sale.save();

    await logAudit({
      user: req.user,
      action: 'SALES_RETURN',
      entity: 'SalesReturn',
      entityId: salesReturn._id,
      details: { returnNumber, invoiceNumber: sale.invoiceNumber, totalRefund: totalRefundAmount },
      req,
    });

    res.status(201).json({ success: true, data: salesReturn });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createSale,
  getSales,
  getSaleById,
  cancelSale,
  processSalesReturn,
};
