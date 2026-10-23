const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const User = require('./models/User');
const Unit = require('./models/Unit');
const Category = require('./models/Category');
const Supplier = require('./models/Supplier');
const Customer = require('./models/Customer');
const Product = require('./models/Product');
const StockMovement = require('./models/StockMovement');
const Sale = require('./models/Sale');
const Purchase = require('./models/Purchase');
const Payment = require('./models/Payment');
const Expense = require('./models/Expense');
const CashSession = require('./models/CashSession');
const ShopSettings = require('./models/ShopSettings');
const AuditLog = require('./models/AuditLog');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Unit.deleteMany({});
    await Category.deleteMany({});
    await Supplier.deleteMany({});
    await Customer.deleteMany({});
    await Product.deleteMany({});
    await StockMovement.deleteMany({});
    await Sale.deleteMany({});
    await Purchase.deleteMany({});
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await CashSession.deleteMany({});
    await ShopSettings.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Seeding Shop Settings...');
    const settings = await ShopSettings.create({
      shopName: 'Bharat Hardware & Sanitary Mart',
      tagline: 'Wholesale & Retail: Paints, Pipes, Fittings & Tools',
      address: 'Plot 42, Market Yard Road, Near Bus Depo',
      city: 'Navi Mumbai',
      state: 'Maharashtra',
      stateCode: '27',
      phone: '+91 98201 23456',
      email: 'contact@bharathardware.in',
      gstin: '27AABCB1234F1Z9',
      pan: 'AABCB1234F',
      invoicePrefix: 'INV-26-',
      nextInvoiceNumber: 1005,
      defaultTaxType: 'INCLUSIVE',
      defaultGstRate: 18,
      printLayout: 'A4',
      thermalWidth: '80mm',
      invoiceFooterNotes: '1. Goods once sold will not be taken back without bill.\n2. Warranty handled by manufacturer service centers.\nThank you! Visit again!',
      upiId: '9820123456@sbi',
      bankDetails: {
        bankName: 'State Bank of India',
        accountNo: '38927492817',
        ifsc: 'SBIN0004521',
        branch: 'Market Yard Branch, Navi Mumbai',
        accountHolder: 'Bharat Hardware & Sanitary Mart',
      },
    });

    console.log('Seeding Users...');
    const admin = await User.create({
      name: 'Rajesh Sharma (Owner)',
      username: 'admin',
      email: 'rajesh@bharathardware.in',
      password: 'admin123',
      role: 'admin',
      phone: '9820123456',
    });

    const cashier = await User.create({
      name: 'Amit Verma (Billing)',
      username: 'cashier',
      email: 'amit@bharathardware.in',
      password: 'cashier123',
      role: 'cashier',
      phone: '9820199887',
      createdBy: admin._id,
    });

    const storekeeper = await User.create({
      name: 'Suresh Patil (Storekeeper)',
      username: 'storekeeper',
      email: 'suresh@bharathardware.in',
      password: 'store123',
      role: 'storekeeper',
      phone: '9820155443',
      createdBy: admin._id,
    });

    console.log('Seeding Units...');
    const uPcs = await Unit.create({ name: 'Piece', code: 'PCS', allowDecimals: false });
    const uBox = await Unit.create({ name: 'Box', code: 'BOX', allowDecimals: false });
    const uPkt = await Unit.create({ name: 'Packet', code: 'PKT', allowDecimals: false });
    const uKg = await Unit.create({ name: 'Kilogram', code: 'KG', allowDecimals: true });
    const uMtr = await Unit.create({ name: 'Metre', code: 'MTR', allowDecimals: true });
    const uFt = await Unit.create({ name: 'Foot', code: 'FT', allowDecimals: true });
    const uLtr = await Unit.create({ name: 'Litre', code: 'LTR', allowDecimals: true });
    const uBag = await Unit.create({ name: 'Bag', code: 'BAG', allowDecimals: false });
    const uRoll = await Unit.create({ name: 'Roll', code: 'ROLL', allowDecimals: false });
    const uSet = await Unit.create({ name: 'Set', code: 'SET', allowDecimals: false });

    console.log('Seeding Categories...');
    const catPaints = await Category.create({ name: 'Paints & Primers', code: 'PNT', description: 'Emulsions, enamels, distempers' });
    const catPlumbing = await Category.create({ name: 'Plumbing & Pipes', code: 'PLM', description: 'CPVC, UPVC, brass fittings' });
    const catElectrical = await Category.create({ name: 'Electrical & Wiring', code: 'ELE', description: 'Wires, switches, LED lights' });
    const catFasteners = await Category.create({ name: 'Fasteners & Screws', code: 'FST', description: 'Drywall screws, nuts, bolts' });
    const catTools = await Category.create({ name: 'Hand & Power Tools', code: 'TLS', description: 'Drills, pliers, tape measures' });
    const catAdhesives = await Category.create({ name: 'Adhesives & Sealants', code: 'ADH', description: 'Fevicol, silicone, M-Seal' });
    const catSanitary = await Category.create({ name: 'Sanitary & Bath', code: 'SAN', description: 'Taps, valves, showers' });
    const catBuilding = await Category.create({ name: 'Building Materials', code: 'BLD', description: 'Cement, wall putty, POP' });

    console.log('Seeding Suppliers...');
    const supAsian = await Supplier.create({
      name: 'Vikas Shah',
      businessName: 'Asian Paints Authorized Depot',
      phone: '9822011001',
      email: 'depot.mumbai@asianpaints.com',
      address: 'Plot 10, Bhiwandi Logistics Park',
      gstin: '27AABCA1234B1Z2',
      openingBalance: 0,
      currentBalance: 45000,
    });

    const supAstral = await Supplier.create({
      name: 'Ketan Patel',
      businessName: 'Astral Pipes & Fittings Agency',
      phone: '9822022002',
      email: 'sales@astralwest.com',
      address: 'Gala 4, Kalher Complex, Thane',
      gstin: '27BBBCB5678C1Z4',
      openingBalance: 0,
      currentBalance: 28500,
    });

    const supHavells = await Supplier.create({
      name: 'Prakash Sharma',
      businessName: 'Havells Electrical Wholesale',
      phone: '9822033003',
      email: 'havells.dist@gmail.com',
      address: 'Lohar Chawl, Marine Lines, Mumbai',
      gstin: '27CCCCD9012D1Z6',
      openingBalance: 0,
      currentBalance: 0,
    });

    const supGodrej = await Supplier.create({
      name: 'Nitin Kulkarni',
      businessName: 'Godrej Locks & Hardware Wholesale',
      phone: '9822044004',
      email: 'godrej.locks@gmail.com',
      address: 'Vashi Plaza, Navi Mumbai',
      gstin: '27DDDDE3456E1Z8',
      openingBalance: 0,
      currentBalance: 12000,
    });

    console.log('Seeding Customers...');
    const custRamesh = await Customer.create({
      name: 'Ramesh Contractor',
      phone: '9820011223',
      address: 'Sector 19, Kopar Khairane',
      gstin: '27AARPR4321R1Z1',
      openingBalance: 5000,
      currentBalance: 14500,
      creditLimit: 50000,
      totalPurchases: 62000,
      totalPaid: 47500,
    });

    const custGanesh = await Customer.create({
      name: 'Shree Ganesh Builders',
      phone: '9819922334',
      address: 'Palm Beach Road, Sanpada',
      gstin: '27AABCS9876S1Z3',
      openingBalance: 0,
      currentBalance: 38200,
      creditLimit: 100000,
      totalPurchases: 145000,
      totalPaid: 106800,
    });

    const custSantosh = await Customer.create({
      name: 'Santosh Plumber',
      phone: '9833344556',
      address: 'Nerul West, Navi Mumbai',
      openingBalance: 0,
      currentBalance: 4800,
      creditLimit: 15000,
      totalPurchases: 22000,
      totalPaid: 17200,
    });

    console.log('Seeding Products...');
    const productsData = [
      {
        name: 'Asian Paints Apex Ultima White 20L',
        sku: 'PNT-APX-20L',
        barcode: '890103000101',
        category: catPaints._id,
        brand: 'Asian Paints',
        sizeSpec: '20 Litre Bucket',
        unit: uLtr._id,
        purchasePrice: 4600,
        sellingPrice: 5350,
        wholesalePrice: 5100,
        gstRate: 18,
        hsnCode: '3208',
        currentStock: 18,
        minStockAlert: 5,
        preferredSupplier: supAsian._id,
        rackLocation: 'Section P-1',
      },
      {
        name: 'Asian Paints Tractor Emulsion White 10L',
        sku: 'PNT-TRC-10L',
        barcode: '890103000102',
        category: catPaints._id,
        brand: 'Asian Paints',
        sizeSpec: '10 Litre Bucket',
        unit: uLtr._id,
        purchasePrice: 1750,
        sellingPrice: 2150,
        wholesalePrice: 2000,
        gstRate: 18,
        hsnCode: '3208',
        currentStock: 25,
        minStockAlert: 6,
        preferredSupplier: supAsian._id,
        rackLocation: 'Section P-2',
      },
      {
        name: 'Astral CPVC Pipe 1 inch SDR 11 (3 Metre)',
        sku: 'PLM-AST-1IN-3M',
        barcode: '890203000201',
        category: catPlumbing._id,
        brand: 'Astral',
        sizeSpec: '1 inch x 3 Metre',
        unit: uPcs._id,
        purchasePrice: 380,
        sellingPrice: 475,
        wholesalePrice: 440,
        gstRate: 18,
        hsnCode: '3917',
        currentStock: 64,
        minStockAlert: 15,
        preferredSupplier: supAstral._id,
        rackLocation: 'Pipe Yard A',
      },
      {
        name: 'Astral CPVC Elbow 90 Deg 1 inch',
        sku: 'PLM-AST-ELB-1IN',
        barcode: '890203000202',
        category: catPlumbing._id,
        brand: 'Astral',
        sizeSpec: '1 inch',
        unit: uPcs._id,
        purchasePrice: 28,
        sellingPrice: 42,
        wholesalePrice: 36,
        gstRate: 18,
        hsnCode: '3917',
        currentStock: 120,
        minStockAlert: 25,
        preferredSupplier: supAstral._id,
        rackLocation: 'Bin C-12',
      },
      {
        name: 'Astral CPVC Brass FTA 1 x 1/2 inch',
        sku: 'PLM-AST-BFTA-1x12',
        barcode: '890203000203',
        category: catPlumbing._id,
        brand: 'Astral',
        sizeSpec: '1 x 1/2 inch',
        unit: uPcs._id,
        purchasePrice: 135,
        sellingPrice: 185,
        wholesalePrice: 165,
        gstRate: 18,
        hsnCode: '3917',
        currentStock: 45,
        minStockAlert: 10,
        preferredSupplier: supAstral._id,
        rackLocation: 'Bin C-15',
      },
      {
        name: 'Havells Life Line Plus Wire 1.5 sq mm Red (90m)',
        sku: 'ELE-HAV-15R',
        barcode: '890303000301',
        category: catElectrical._id,
        brand: 'Havells',
        sizeSpec: '1.5 sq mm / 90 Mtr',
        unit: uRoll._id,
        purchasePrice: 1420,
        sellingPrice: 1720,
        wholesalePrice: 1620,
        gstRate: 18,
        hsnCode: '8544',
        currentStock: 30,
        minStockAlert: 8,
        preferredSupplier: supHavells._id,
        rackLocation: 'Rack E-1',
      },
      {
        name: 'Havells Life Line Plus Wire 2.5 sq mm Blue (90m)',
        sku: 'ELE-HAV-25B',
        barcode: '890303000302',
        category: catElectrical._id,
        brand: 'Havells',
        sizeSpec: '2.5 sq mm / 90 Mtr',
        unit: uRoll._id,
        purchasePrice: 2280,
        sellingPrice: 2750,
        wholesalePrice: 2580,
        gstRate: 18,
        hsnCode: '8544',
        currentStock: 4, // LOW STOCK
        minStockAlert: 8,
        preferredSupplier: supHavells._id,
        rackLocation: 'Rack E-2',
      },
      {
        name: 'Anchor Roma 6A 1-Way Modular Switch',
        sku: 'ELE-ANC-ROM-6A',
        barcode: '890303000303',
        category: catElectrical._id,
        brand: 'Anchor Panasonic',
        sizeSpec: '6 Ampere 1-Way',
        unit: uPcs._id,
        purchasePrice: 32,
        sellingPrice: 50,
        wholesalePrice: 42,
        gstRate: 18,
        hsnCode: '8536',
        currentStock: 180,
        minStockAlert: 30,
        preferredSupplier: supHavells._id,
        rackLocation: 'Bin D-04',
      },
      {
        name: 'Philips Stellar 9W Cool Daylight LED Bulb B22',
        sku: 'ELE-PHI-9W-LED',
        barcode: '890303000304',
        category: catElectrical._id,
        brand: 'Philips',
        sizeSpec: '9W B22 Base',
        unit: uPcs._id,
        purchasePrice: 75,
        sellingPrice: 110,
        wholesalePrice: 95,
        gstRate: 12,
        hsnCode: '8539',
        currentStock: 50,
        minStockAlert: 15,
        preferredSupplier: supHavells._id,
        rackLocation: 'Shelf L-1',
      },
      {
        name: 'Godrej Nav-Tal 7 Levers Brass Padlock',
        sku: 'HRD-GDJ-NAV7',
        barcode: '890403000401',
        category: catFasteners._id,
        brand: 'Godrej',
        sizeSpec: '7 Levers / 3 Keys',
        unit: uPcs._id,
        purchasePrice: 490,
        sellingPrice: 650,
        wholesalePrice: 590,
        gstRate: 18,
        hsnCode: '8301',
        currentStock: 14,
        minStockAlert: 5,
        preferredSupplier: supGodrej._id,
        rackLocation: 'Glass Showcase 1',
      },
      {
        name: 'Drywall Screws 1.5 inch Black Phosphated',
        sku: 'FST-SCW-15IN',
        barcode: '890403000402',
        category: catFasteners._id,
        brand: 'Star Fasteners',
        sizeSpec: '1.5 inch (1000 Pcs Box)',
        unit: uBox._id,
        purchasePrice: 280,
        sellingPrice: 380,
        wholesalePrice: 340,
        gstRate: 18,
        hsnCode: '7318',
        currentStock: 22,
        minStockAlert: 5,
        rackLocation: 'Shelf S-3',
      },
      {
        name: 'Fevicol Marine Waterproof Wood Adhesive 1Kg',
        sku: 'ADH-FEV-MAR-1K',
        barcode: '890503000501',
        category: catAdhesives._id,
        brand: 'Pidilite Fevicol',
        sizeSpec: '1 Kg Tub',
        unit: uKg._id,
        purchasePrice: 240,
        sellingPrice: 310,
        wholesalePrice: 280,
        gstRate: 18,
        hsnCode: '3506',
        currentStock: 28,
        minStockAlert: 8,
        rackLocation: 'Shelf A-1',
      },
      {
        name: 'M-Seal Phataphat Epoxy Putty 25g',
        sku: 'ADH-MSL-25G',
        barcode: '890503000502',
        category: catAdhesives._id,
        brand: 'Pidilite M-Seal',
        sizeSpec: '25g Packet',
        unit: uPkt._id,
        purchasePrice: 14,
        sellingPrice: 20,
        wholesalePrice: 17,
        gstRate: 18,
        hsnCode: '3506',
        currentStock: 0, // OUT OF STOCK
        minStockAlert: 20,
        rackLocation: 'Front Counter',
      },
      {
        name: 'Bosch GSB 500W Impact Hammer Drill Kit',
        sku: 'TLS-BOS-GSB500',
        barcode: '890603000601',
        category: catTools._id,
        brand: 'Bosch',
        sizeSpec: '500 Watt with Case & 100 Acc',
        unit: uSet._id,
        purchasePrice: 3200,
        sellingPrice: 4100,
        wholesalePrice: 3800,
        gstRate: 18,
        hsnCode: '8467',
        currentStock: 6,
        minStockAlert: 2,
        rackLocation: 'Display Rack T-1',
      },
      {
        name: 'Taparia 8 inch Universal Combination Pliers',
        sku: 'TLS-TAP-PLR-8',
        barcode: '890603000602',
        category: catTools._id,
        brand: 'Taparia',
        sizeSpec: '8 inch (200mm)',
        unit: uPcs._id,
        purchasePrice: 220,
        sellingPrice: 295,
        wholesalePrice: 265,
        gstRate: 18,
        hsnCode: '8203',
        currentStock: 16,
        minStockAlert: 4,
        rackLocation: 'Tool Board 2',
      },
      {
        name: 'UltraTech Super PPC Cement 50Kg Bag',
        sku: 'BLD-ULT-CEM-50K',
        barcode: '890703000701',
        category: catBuilding._id,
        brand: 'UltraTech',
        sizeSpec: '50 Kg Paper/HDPE Bag',
        unit: uBag._id,
        purchasePrice: 340,
        sellingPrice: 395,
        wholesalePrice: 375,
        gstRate: 28,
        hsnCode: '2523',
        currentStock: 95,
        minStockAlert: 20,
        rackLocation: 'Godown Bay 1',
      },
      {
        name: 'Birla White Wall Care Putty 20Kg Bag',
        sku: 'BLD-BRL-PUT-20K',
        barcode: '890703000702',
        category: catBuilding._id,
        brand: 'Birla White',
        sizeSpec: '20 Kg Bag',
        unit: uBag._id,
        purchasePrice: 560,
        sellingPrice: 680,
        wholesalePrice: 630,
        gstRate: 18,
        hsnCode: '3214',
        currentStock: 35,
        minStockAlert: 10,
        rackLocation: 'Godown Bay 2',
      },
      {
        name: 'Teflon PTFE Thread Seal Tape 12mm x 10m',
        sku: 'PLM-TEF-12MM',
        barcode: '890203000204',
        category: catPlumbing._id,
        brand: 'Sealpro',
        sizeSpec: '12mm x 10 Metre',
        unit: uRoll._id,
        purchasePrice: 8,
        sellingPrice: 15,
        wholesalePrice: 12,
        gstRate: 18,
        hsnCode: '3920',
        currentStock: 150,
        minStockAlert: 30,
        rackLocation: 'Front Counter Drawer',
      },
    ];

    const insertedProducts = [];
    for (const p of productsData) {
      const prod = await Product.create(p);
      insertedProducts.push(prod);

      // Record opening stock movement
      if (prod.currentStock > 0) {
        await StockMovement.create({
          product: prod._id,
          movementType: 'OPENING',
          quantity: prod.currentStock,
          previousStock: 0,
          newStock: prod.currentStock,
          unitCost: prod.purchasePrice,
          referenceDocument: 'SEED-OPENING',
          referenceModel: 'Opening',
          reason: 'Initial system stock initialization',
          user: admin._id,
        });
      }
    }

    console.log('Seeding Realistic Past Sales & Invoices...');
    // Create 4 realistic past invoices across today and yesterday
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // Invoice 1: Yesterday to Ramesh Contractor
    const sale1 = await Sale.create({
      invoiceNumber: 'INV-26-1001',
      invoiceDate: yesterday,
      customer: custRamesh._id,
      customerName: custRamesh.name,
      customerPhone: custRamesh.phone,
      customerGstin: custRamesh.gstin,
      items: [
        {
          product: insertedProducts[0]._id, // Apex Ultima 20L
          productName: insertedProducts[0].name,
          sku: insertedProducts[0].sku,
          hsnCode: '3208',
          unit: 'LTR',
          quantity: 2,
          unitPrice: 5350,
          purchasePrice: 4600,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 9067.8,
          cgst: 816.1,
          sgst: 816.1,
          igst: 0,
          total: 10700,
        },
        {
          product: insertedProducts[16]._id, // Birla Putty 20Kg
          productName: insertedProducts[16].name,
          sku: insertedProducts[16].sku,
          hsnCode: '3214',
          unit: 'BAG',
          quantity: 4,
          unitPrice: 680,
          purchasePrice: 560,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 2305.08,
          cgst: 207.46,
          sgst: 207.46,
          igst: 0,
          total: 2720,
        },
      ],
      subtotal: 13420,
      totalDiscount: 0,
      taxableTotal: 11372.88,
      totalCgst: 1023.56,
      totalSgst: 1023.56,
      totalIgst: 0,
      roundOff: 0,
      grandTotal: 13420,
      paymentStatus: 'PARTIAL',
      payments: [
        { method: 'UPI', amount: 8000, referenceNo: 'UPI-77492019', receivedAt: yesterday },
      ],
      amountReceived: 8000,
      balanceDue: 5420, // Balance due recorded to Ramesh
      isInterstate: false,
      status: 'COMPLETED',
      createdBy: cashier._id,
      notes: 'Delivered to site Kopar Khairane',
    });

    // Invoice 2: Today morning to Walk-in Cash Customer
    const sale2 = await Sale.create({
      invoiceNumber: 'INV-26-1002',
      invoiceDate: today,
      customer: null,
      customerName: 'Walk-in Customer (Sunil)',
      customerPhone: '9892011223',
      items: [
        {
          product: insertedProducts[9]._id, // Godrej Padlock
          productName: insertedProducts[9].name,
          sku: insertedProducts[9].sku,
          hsnCode: '8301',
          unit: 'PCS',
          quantity: 1,
          unitPrice: 650,
          purchasePrice: 490,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 550.85,
          cgst: 49.58,
          sgst: 49.58,
          igst: 0,
          total: 650,
        },
        {
          product: insertedProducts[11]._id, // Fevicol Marine 1Kg
          productName: insertedProducts[11].name,
          sku: insertedProducts[11].sku,
          hsnCode: '3506',
          unit: 'KG',
          quantity: 1,
          unitPrice: 310,
          purchasePrice: 240,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 262.71,
          cgst: 23.64,
          sgst: 23.64,
          igst: 0,
          total: 310,
        },
      ],
      subtotal: 960,
      totalDiscount: 0,
      taxableTotal: 813.56,
      totalCgst: 73.22,
      totalSgst: 73.22,
      totalIgst: 0,
      roundOff: 0,
      grandTotal: 960,
      paymentStatus: 'PAID',
      payments: [
        { method: 'CASH', amount: 960, referenceNo: '', receivedAt: today },
      ],
      amountReceived: 960,
      balanceDue: 0,
      isInterstate: false,
      status: 'COMPLETED',
      createdBy: cashier._id,
    });

    // Invoice 3: Today to Santosh Plumber
    const sale3 = await Sale.create({
      invoiceNumber: 'INV-26-1003',
      invoiceDate: today,
      customer: custSantosh._id,
      customerName: custSantosh.name,
      customerPhone: custSantosh.phone,
      items: [
        {
          product: insertedProducts[2]._id, // Astral CPVC Pipe
          productName: insertedProducts[2].name,
          sku: insertedProducts[2].sku,
          hsnCode: '3917',
          unit: 'PCS',
          quantity: 6,
          unitPrice: 475,
          purchasePrice: 380,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 2415.25,
          cgst: 217.37,
          sgst: 217.37,
          igst: 0,
          total: 2850,
        },
        {
          product: insertedProducts[3]._id, // Astral Elbow
          productName: insertedProducts[3].name,
          sku: insertedProducts[3].sku,
          hsnCode: '3917',
          unit: 'PCS',
          quantity: 10,
          unitPrice: 42,
          purchasePrice: 28,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 355.93,
          cgst: 32.03,
          sgst: 32.03,
          igst: 0,
          total: 420,
        },
        {
          product: insertedProducts[17]._id, // Teflon Tape
          productName: insertedProducts[17].name,
          sku: insertedProducts[17].sku,
          hsnCode: '3920',
          unit: 'ROLL',
          quantity: 5,
          unitPrice: 15,
          purchasePrice: 8,
          discountPercent: 0,
          discountAmount: 0,
          taxRate: 18,
          taxType: 'INCLUSIVE',
          taxableAmount: 63.56,
          cgst: 5.72,
          sgst: 5.72,
          igst: 0,
          total: 75,
        },
      ],
      subtotal: 3345,
      totalDiscount: 45,
      taxableTotal: 2796.61,
      totalCgst: 251.69,
      totalSgst: 251.69,
      totalIgst: 0,
      roundOff: 0,
      grandTotal: 3300,
      paymentStatus: 'PAID',
      payments: [
        { method: 'UPI', amount: 3300, referenceNo: 'UPI-99201948', receivedAt: today },
      ],
      amountReceived: 3300,
      balanceDue: 0,
      isInterstate: false,
      status: 'COMPLETED',
      createdBy: cashier._id,
    });

    console.log('Seeding Expenses & Daily Cash Session...');
    await Expense.create({
      expenseNumber: 'EXP-1001',
      title: 'Shop Electricity Bill (MSEDCL)',
      category: 'ELECTRICITY',
      amount: 4250,
      paymentMethod: 'UPI',
      paidTo: 'MSEDCL Online',
      description: 'Monthly commercial meter bill',
      createdBy: admin._id,
    });

    await Expense.create({
      expenseNumber: 'EXP-1002',
      title: 'Staff Refreshments & Evening Tea',
      category: 'TEA_SNACKS',
      amount: 240,
      paymentMethod: 'CASH',
      paidTo: 'Raju Tea Stall',
      description: 'Daily shop tea and snacks for 4 staff',
      createdBy: cashier._id,
    });

    await Expense.create({
      expenseNumber: 'EXP-1003',
      title: 'Tempo Freight for Cement Delivery',
      category: 'TRANSPORT',
      amount: 800,
      paymentMethod: 'CASH',
      paidTo: 'Bablu Tempo Service',
      description: 'Freight for 50 bags UltraTech',
      createdBy: storekeeper._id,
    });

    // Create Active Cash Session
    await CashSession.create({
      sessionDate: today,
      openedBy: cashier._id,
      openingCash: 5000,
      cashSalesTotal: 960,
      cashReceivedPayments: 0,
      cashPaidExpenses: 1040, // 240 + 800
      cashPaidSupplierPayments: 0,
      expectedCash: 4920, // 5000 + 960 - 1040
      status: 'OPEN',
      notes: 'Morning counter opened with ₹5,000 float',
    });

    console.log('Database seeded successfully!');
    console.log('--------------------------------------------------');
    console.log('Default Accounts:');
    console.log('Owner/Admin:   admin / admin123');
    console.log('Cashier/POS:   cashier / cashier123');
    console.log('Storekeeper:   storekeeper / store123');
    console.log('--------------------------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
