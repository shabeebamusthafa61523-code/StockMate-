# StockMate - Smart Inventory Solution & Hardware POS System

A complete, production-oriented Hardware Retail Shop Management & POS System built with the **MERN** stack (Node.js, Express, MongoDB with Mongoose, React, Vite, Tailwind CSS).

---

## 🌟 Key Features

### 1. Point of Sale (POS) & Billing
- **Keyboard-Optimized Checkout**: Hotkeys `F2` (Focus product/barcode search), `F4` (Proceed to pay), `Esc` (Cancel/clear).
- **Barcode & SKU Scanning**: Automatic instant matching and cart insertion.
- **GST Tax Engine**: Configurable **GST Inclusive** and **GST Exclusive** modes with automatic split of CGST + SGST (or IGST for interstate customers).
- **Hardware Units**: Support for `Piece`, `Box`, `Packet`, `Kilogram`, `Metre`, `Foot`, `Litre`, `Bag`, `Roll`, `Set`.
- **Flexible Payments**: Cash, UPI / QR, Card, Bank Transfer, and Credit (Udhar Khata) with split-payment capabilities.
- **Dual Invoice Printing**:
  - **Thermal 80mm Mode**: High-density monochrome slip for thermal receipt printers.
  - **Standard A4 Tax Invoice**: Full GST invoice with HSN codes, company details, GSTIN, bank details, and authorized signature.
- **One-Click WhatsApp Sharing**: Instant invoice sharing link formatted for WhatsApp messaging.

### 2. Product Inventory & Stock Movements
- Complete hardware attributes: SKU, barcode, category, brand, size/specification, units, purchase price, selling price, wholesale price, GST slab, HSN code, current stock, min-stock alerts, rack location.
- **Strict Stock Movement Audit**: Every transaction (Sale, Purchase, Return, Damage, Adjustment, Opening) is immutably logged with before/after stock, reference document, and handling user.
- **Atomic Stock Deductions & Restorations**: Validated on the server prior to order confirmation.
- CSV import and export.

### 3. Customer Khata & Credit Management
- Full customer ledger tracking sales invoices, payments, and sales returns.
- Credit limits and live balance tracking.
- Partial payment collections with instant cash session integration.
- Formatted WhatsApp payment reminder messages.

### 4. Supplier & Purchase Orders
- Supplier directory with GSTIN and payable balances.
- Purchase invoices with multiple items, supplier invoice numbers, and automated inventory restocking.
- Purchase returns for damaged goods.

### 5. Daily Cash Counter & Reconciliation
- Cash opening float, cash sales, cash collections, cash expenses, and supplier payouts.
- Live expected drawer cash calculation.
- End-of-day cash reconciliation with difference (surplus/shortage) auditing.

### 6. Reports & GST Tax Summaries
- **Sales & Gross Profit Report**: COGS, Gross Profit, and Gross Margin % calculations.
- **GSTR-1 Tax Summary**: Rate-wise (0%, 5%, 12%, 18%, 28%) taxable value and CGST/SGST/IGST breakdown, separated into B2B and B2C.
- **Stock Valuation**: Total stock value at cost vs retail price with unrealized profit.
- **Receivables & Payables**: Customer Khata dues vs Supplier payables.

### 7. User Roles & RBAC
- **Admin / Owner**: Complete access to dashboard, products, reports, users, settings, and audit logs.
- **Cashier**: POS billing, invoices, customers, cash counter, and shop expenses.
- **Storekeeper**: Inventory, products, stock movements, purchases, and suppliers.

---

## 🚀 Quick Start & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally on `mongodb://127.0.0.1:27017`)

### 1. Start MongoDB
Ensure MongoDB service or `mongod` is running on port `27017`.

### 2. Backend Setup
```bash
cd backend
npm install
node seeder.js     # Seeds initial products, users, categories, units, and past sales
node server.js     # Starts server on http://127.0.0.1:5050
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev        # Starts Vite dev server on http://localhost:3000
```

Open your browser at `http://localhost:3000`.

---

## 🔑 Default Login Credentials

| Role | Username | Password | Purpose |
| :--- | :--- | :--- | :--- |
| **Admin / Owner** | `admin` | `admin123` | Full control, reports, settings, staff management |
| **Cashier** | `cashier` | `cashier123` | Counter billing, invoice printing, payments |
| **Storekeeper** | `storekeeper` | `store123` | Stock in, purchase bills, stock count adjustments |

*(Quick login buttons are available directly on the login screen for one-click testing.)*

---

## 🛠️ Technology Stack
- **Backend**: Node.js, Express.js, MongoDB, Mongoose, JWT, bcryptjs, express-rate-limit.
- **Frontend**: React (v19), Vite, Tailwind CSS (v4), Recharts, Lucide React, react-hot-toast.
