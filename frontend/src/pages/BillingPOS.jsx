import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CheckCircle,
  CreditCard,
  User,
  Phone,
  Tag,
  Printer,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import toast from 'react-hot-toast';

export const BillingPOS = () => {
  // Search & Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Cart Items
  const [cart, setCart] = useState([]);
  const [taxMode, setTaxMode] = useState('INCLUSIVE'); // 'INCLUSIVE' or 'EXCLUSIVE'
  const [isInterstate, setIsInterstate] = useState(false);
  const [overallDiscount, setOverallDiscount] = useState(0);
  const [roundOff, setRoundOff] = useState(0);
  const [notes, setNotes] = useState('');

  // Customer
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerDropdownOpen, setCustomerDropdownOpen] = useState(false);
  const [newCustomerModal, setNewCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({ name: '', phone: '', address: '', gstin: '' });

  // Payment Modal
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentSplits, setPaymentSplits] = useState([{ method: 'CASH', amount: 0, referenceNo: '' }]);
  const [submittingSale, setSubmittingSale] = useState(false);

  // Completed Invoice for Printing
  const [completedSale, setCompletedSale] = useState(null);
  const [shopSettings, setShopSettings] = useState({});
  const [printModalOpen, setPrintModalOpen] = useState(false);

  const searchInputRef = useRef(null);

  // Load shop settings and customer list
  useEffect(() => {
    const initData = async () => {
      try {
        const [settingsRes, custRes] = await Promise.all([
          api.get('/settings'),
          api.get('/customers'),
        ]);
        if (settingsRes.success) setShopSettings(settingsRes.data);
        if (custRes.success) setCustomers(custRes.data);
      } catch (e) {
        // quiet error
      }
    };
    initData();
  }, []);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        if (cart.length > 0 && !checkoutModalOpen) {
          handleOpenCheckout();
        }
      } else if (e.key === 'Escape') {
        setSearchResults([]);
        setCheckoutModalOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, checkoutModalOpen]);

  // Product Search with Debounce & Barcode direct hit
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(searchQuery)}&limit=8`);
        if (res.success) {
          setSearchResults(res.data);
          setSelectedIndex(0);

          // If barcode exact match (e.g. scanner entered code)
          const exactBarcode = res.data.find(
            (p) => p.barcode === searchQuery.trim() || p.sku.toUpperCase() === searchQuery.trim().toUpperCase()
          );
          if (exactBarcode && res.data.length === 1) {
            addToCart(exactBarcode);
            setSearchQuery('');
            setSearchResults([]);
          }
        }
      } catch (err) {
        // error handled
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Add Product to Cart
  const addToCart = (product) => {
    if (product.currentStock <= 0) {
      toast.error(`'${product.name}' is out of stock!`);
      return;
    }

    const existingIndex = cart.findIndex((item) => item.product === product._id);
    if (existingIndex > -1) {
      const existing = cart[existingIndex];
      if (existing.quantity + 1 > product.currentStock) {
        toast.error(`Only ${product.currentStock} units available in stock`);
        return;
      }
      const updated = [...cart];
      updated[existingIndex].quantity += 1;
      setCart(updated);
    } else {
      setCart([
        ...cart,
        {
          product: product._id,
          productName: product.name,
          sku: product.sku,
          brand: product.brand,
          unit: product.unit?.code || 'Pcs',
          unitPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          gstRate: product.gstRate || 18,
          hsnCode: product.hsnCode || '',
          quantity: 1,
          discountPercent: 0,
          currentStock: product.currentStock,
        },
      ]);
    }

    toast.success(`Added ${product.name}`, { duration: 1000 });
  };

  // Update Cart Item Quantity
  const updateQuantity = (index, newQty) => {
    const val = Number(newQty);
    if (val <= 0) {
      removeFromCart(index);
      return;
    }
    const item = cart[index];
    if (val > item.currentStock) {
      toast.error(`Only ${item.currentStock} units available in stock`);
      return;
    }
    const updated = [...cart];
    updated[index].quantity = val;
    setCart(updated);
  };

  // Update Cart Item Price (e.g. customized wholesale discount)
  const updatePrice = (index, newPrice) => {
    const price = Number(newPrice);
    if (price < 0) return;
    const updated = [...cart];
    updated[index].unitPrice = price;
    setCart(updated);
  };

  // Update Cart Item Discount
  const updateDiscount = (index, newDisc) => {
    const disc = Math.min(100, Math.max(0, Number(newDisc) || 0));
    const updated = [...cart];
    updated[index].discountPercent = disc;
    setCart(updated);
  };

  // Remove Item
  const removeFromCart = (index) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  // Calculate Cart Totals
  const calculateTotals = () => {
    let subtotal = 0;
    let taxableTotal = 0;
    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;
    let totalTax = 0;

    cart.forEach((item) => {
      const lineRaw = item.unitPrice * item.quantity;
      const lineDisc = (lineRaw * item.discountPercent) / 100;
      const lineAfterDisc = Math.max(0, lineRaw - lineDisc);

      let taxable = 0;
      let tax = 0;

      if (taxMode === 'INCLUSIVE') {
        taxable = lineAfterDisc / (1 + item.gstRate / 100);
        tax = lineAfterDisc - taxable;
      } else {
        taxable = lineAfterDisc;
        tax = (taxable * item.gstRate) / 100;
      }

      subtotal += lineRaw;
      taxableTotal += taxable;
      totalTax += tax;

      if (isInterstate) {
        igstTotal += tax;
      } else {
        cgstTotal += tax / 2;
        sgstTotal += tax / 2;
      }
    });

    const calculatedGrand = taxableTotal + totalTax - Number(overallDiscount || 0) + Number(roundOff || 0);
    const finalGrand = Math.max(0, Math.round(calculatedGrand));

    return {
      subtotal: Number(subtotal.toFixed(2)),
      taxableTotal: Number(taxableTotal.toFixed(2)),
      cgstTotal: Number(cgstTotal.toFixed(2)),
      sgstTotal: Number(sgstTotal.toFixed(2)),
      igstTotal: Number(igstTotal.toFixed(2)),
      totalTax: Number(totalTax.toFixed(2)),
      grandTotal: finalGrand,
    };
  };

  const totals = calculateTotals();

  // Open Checkout Modal
  const handleOpenCheckout = () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }
    // Default full payment to CASH
    setPaymentSplits([{ method: 'CASH', amount: totals.grandTotal, referenceNo: '' }]);
    setCheckoutModalOpen(true);
  };

  // Quick Customer Creation
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    if (!newCustomerForm.name || !newCustomerForm.phone) {
      toast.error('Name and Phone are required');
      return;
    }
    try {
      const res = await api.post('/customers', newCustomerForm);
      if (res.success) {
        setCustomers([res.data, ...customers]);
        setSelectedCustomer(res.data);
        setNewCustomerModal(false);
        setNewCustomerForm({ name: '', phone: '', address: '', gstin: '' });
        toast.success(`Customer ${res.data.name} created`);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    }
  };

  // Submit Sale & Checkout
  const handleFinalCheckout = async () => {
    // Check if credit used and customer missing
    const hasCredit = paymentSplits.some((p) => p.method === 'CREDIT') ||
      paymentSplits.reduce((acc, p) => acc + Number(p.amount || 0), 0) < totals.grandTotal;

    if (hasCredit && !selectedCustomer) {
      toast.error('Customer name & phone are required for Credit (Udhar) or balance due sales!');
      return;
    }

    setSubmittingSale(true);
    try {
      const payload = {
        customerId: selectedCustomer ? selectedCustomer._id : null,
        customerName: selectedCustomer ? selectedCustomer.name : 'Walk-in Customer',
        customerPhone: selectedCustomer ? selectedCustomer.phone : '',
        customerGstin: selectedCustomer ? selectedCustomer.gstin : '',
        items: cart.map((item) => ({
          productId: item.product,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          gstRate: item.gstRate,
          taxType: taxMode,
          unit: item.unit,
        })),
        payments: paymentSplits.filter((p) => Number(p.amount) > 0),
        discountTotal: Number(overallDiscount || 0),
        roundOff: Number(roundOff || 0),
        isInterstate,
        notes,
      };

      const res = await api.post('/sales', payload);
      if (res.success) {
        toast.success(`Invoice ${res.data.invoiceNumber} created!`);
        setCompletedSale(res.data);
        setPrintModalOpen(true);
        setCheckoutModalOpen(false);
        // Reset Cart
        setCart([]);
        setSelectedCustomer(null);
        setOverallDiscount(0);
        setNotes('');
      }
    } catch (err) {
      toast.error(err.message || 'Checkout failed');
    } finally {
      setSubmittingSale(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* POS Top Bar */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
        
        {/* Product Search Input with Barcode & Name Lookup */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(searchResults.length - 1, prev + 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(0, prev - 1));
              } else if (e.key === 'Enter' && searchResults[selectedIndex]) {
                e.preventDefault();
                addToCart(searchResults[selectedIndex]);
                setSearchQuery('');
                setSearchResults([]);
              }
            }}
            placeholder="Scan barcode or type product name / SKU (Press F2)..."
            className="w-full pl-9 pr-12 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white font-medium transition"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className="text-[10px] font-mono bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
              F2
            </span>
          </div>

          {/* Autocomplete Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-slate-100 max-h-80 overflow-y-auto">
              {searchResults.map((product, idx) => (
                <div
                  key={product._id}
                  onClick={() => {
                    addToCart(product);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className={`p-3 cursor-pointer flex items-center justify-between transition ${
                    idx === selectedIndex ? 'bg-slate-100' : 'hover:bg-slate-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">{product.name}</div>
                    <div className="text-[10px] text-slate-500">
                      SKU: <span className="font-mono text-slate-700">{product.sku}</span> • Brand: {product.brand || '-'} • Unit: {product.unit?.code}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900">₹{product.sellingPrice}</div>
                    <div className={`text-[10px] font-bold ${product.currentStock > 5 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      Stock: {product.currentStock} {product.unit?.code}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Selector */}
        <div className="flex items-center gap-2">
          <div className="relative min-w-[200px]">
            <button
              onClick={() => setCustomerDropdownOpen(!customerDropdownOpen)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-300 rounded-lg text-slate-800 hover:bg-slate-100 transition"
            >
              <div className="flex items-center gap-1.5 truncate">
                <User className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="truncate">{selectedCustomer ? selectedCustomer.name : 'Walk-in Customer'}</span>
              </div>
              <span className="text-[10px] text-slate-400">▼</span>
            </button>

            {customerDropdownOpen && (
              <div className="absolute right-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2">
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Search customer name/phone..."
                  className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md mb-2 focus:outline-hidden"
                  autoFocus
                />
                <div className="max-h-48 overflow-y-auto space-y-1 text-xs">
                  <div
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerDropdownOpen(false);
                    }}
                    className="p-2 hover:bg-slate-100 rounded cursor-pointer font-bold text-slate-700"
                  >
                    Walk-in Customer (No Khata)
                  </div>
                  {customers
                    .filter((c) =>
                      c.name.toLowerCase().includes(customerSearch.toLowerCase()) || c.phone.includes(customerSearch)
                    )
                    .map((c) => (
                      <div
                        key={c._id}
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerDropdownOpen(false);
                        }}
                        className="p-2 hover:bg-slate-100 rounded cursor-pointer flex justify-between items-center"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.phone}</div>
                        </div>
                        {c.currentBalance > 0 && (
                          <div className="text-[10px] font-bold text-amber-700">Due: ₹{c.currentBalance}</div>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => setNewCustomerModal(true)}
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition"
            title="Create New Customer"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* GST Mode Toggle */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold shrink-0">
          <button
            onClick={() => setTaxMode('INCLUSIVE')}
            className={`px-2.5 py-1.5 rounded-md transition ${taxMode === 'INCLUSIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            GST Incl.
          </button>
          <button
            onClick={() => setTaxMode('EXCLUSIVE')}
            className={`px-2.5 py-1.5 rounded-md transition ${taxMode === 'EXCLUSIVE' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            GST Excl.
          </button>
        </div>

      </div>

      {/* Main Billing Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        
        {/* Cart Items Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-slate-700" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Cart Items ({cart.length})
              </h2>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-[11px] font-semibold text-red-600 hover:text-red-700"
              >
                Clear Cart
              </button>
            )}
          </div>

          {cart.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold">Your billing cart is empty</p>
              <p className="text-xs text-slate-400 mt-1">Scan a barcode or use search bar above (Press F2)</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                  <tr>
                    <th className="p-3">Product</th>
                    <th className="p-3 w-28 text-center">Qty</th>
                    <th className="p-3 w-24 text-right">Price (₹)</th>
                    <th className="p-3 w-20 text-center">Disc %</th>
                    <th className="p-3 w-16 text-center">GST %</th>
                    <th className="p-3 w-24 text-right">Total (₹)</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {cart.map((item, idx) => {
                    const lineRaw = item.unitPrice * item.quantity;
                    const lineDisc = (lineRaw * item.discountPercent) / 100;
                    const lineNet = lineRaw - lineDisc;
                    return (
                      <tr key={idx} className="hover:bg-slate-50/70 transition">
                        <td className="p-3">
                          <div className="font-bold text-slate-900">{item.productName}</div>
                          <div className="text-[10px] text-slate-500">
                            {item.sku} • Stock: {item.currentStock} {item.unit}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => updateQuantity(idx, item.quantity - 1)}
                              className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateQuantity(idx, e.target.value)}
                              className="w-12 py-1 text-center font-bold bg-white border border-slate-300 rounded text-xs"
                              min="1"
                            />
                            <button
                              onClick={() => updateQuantity(idx, item.quantity + 1)}
                              className="w-6 h-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded flex items-center justify-center font-bold"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <input
                            type="number"
                            value={item.unitPrice}
                            onChange={(e) => updatePrice(idx, e.target.value)}
                            className="w-20 py-1 text-right font-bold bg-white border border-slate-300 rounded text-xs px-1"
                          />
                        </td>
                        <td className="p-3 text-center">
                          <input
                            type="number"
                            value={item.discountPercent}
                            onChange={(e) => updateDiscount(idx, e.target.value)}
                            className="w-14 py-1 text-center font-medium bg-white border border-slate-300 rounded text-xs"
                            min="0"
                            max="100"
                          />
                        </td>
                        <td className="p-3 text-center font-semibold text-slate-600">
                          {item.gstRate}%
                        </td>
                        <td className="p-3 text-right font-black text-slate-900">
                          ₹{Math.round(lineNet)}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => removeFromCart(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Checkout Summary Card (1 Col) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 space-y-3">
          <div className="border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">Billing Summary</h3>
            {selectedCustomer && (
              <div className="mt-1 text-xs text-slate-600">
                Billing to: <b>{selectedCustomer.name}</b> ({selectedCustomer.phone})
                {selectedCustomer.currentBalance > 0 && (
                  <span className="text-amber-700 block font-bold text-[10px]">
                    Current Khata Due: ₹{selectedCustomer.currentBalance}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Gross Subtotal:</span>
              <span>₹{totals.subtotal}</span>
            </div>

            <div className="flex justify-between">
              <span>Taxable Value:</span>
              <span>₹{totals.taxableTotal}</span>
            </div>

            <div className="flex justify-between">
              <span>CGST:</span>
              <span>₹{totals.cgstTotal}</span>
            </div>

            <div className="flex justify-between">
              <span>SGST:</span>
              <span>₹{totals.sgstTotal}</span>
            </div>

            {isInterstate && (
              <div className="flex justify-between">
                <span>IGST:</span>
                <span>₹{totals.igstTotal}</span>
              </div>
            )}

            {/* Overall Discount Field */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-700 font-medium">Extra Bill Discount:</span>
              <div className="flex items-center gap-1">
                <span>₹</span>
                <input
                  type="number"
                  value={overallDiscount}
                  onChange={(e) => setOverallDiscount(e.target.value)}
                  className="w-20 px-2 py-0.5 text-right border border-slate-300 rounded text-xs font-bold"
                  min="0"
                />
              </div>
            </div>

            {/* Round off */}
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Round Off:</span>
              <span>₹{roundOff}</span>
            </div>
          </div>

          <div className="border-t-2 border-slate-900 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="text-sm font-bold text-slate-900">GRAND TOTAL:</span>
              <span className="text-2xl font-black text-slate-900">₹{totals.grandTotal.toLocaleString('en-IN')}</span>
            </div>
            <p className="text-[10px] text-slate-400 text-right mt-0.5">All applicable GST included</p>
          </div>

          {/* Checkout Button */}
          <button
            onClick={handleOpenCheckout}
            disabled={cart.length === 0}
            className="w-full flex items-center justify-center gap-2 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold text-sm rounded-xl shadow-sm transition"
          >
            <span>Proceed to Checkout (F4)</span>
          </button>

          <div className="text-[11px] text-slate-400 text-center font-mono">
            Shortcuts: F2 (Search) • F4 (Pay) • Esc (Clear)
          </div>
        </div>

      </div>

      {/* Checkout & Split Payment Modal */}
      {checkoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base">Complete Payment</h3>
                <p className="text-xs text-slate-300">Total Due: ₹{totals.grandTotal.toLocaleString('en-IN')}</p>
              </div>
              <button onClick={() => setCheckoutModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Payment Splits */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Payment Methods & Amounts
                </label>

                {paymentSplits.map((split, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <select
                      value={split.method}
                      onChange={(e) => {
                        const updated = [...paymentSplits];
                        updated[idx].method = e.target.value;
                        setPaymentSplits(updated);
                      }}
                      className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-hidden"
                    >
                      <option value="CASH">Cash</option>
                      <option value="UPI">UPI / GPay / PhonePe</option>
                      <option value="CARD">Debit / Credit Card</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="CREDIT">Udhar / Credit (Khata)</option>
                    </select>

                    <input
                      type="number"
                      value={split.amount}
                      onChange={(e) => {
                        const updated = [...paymentSplits];
                        updated[idx].amount = Number(e.target.value);
                        setPaymentSplits(updated);
                      }}
                      placeholder="Amount"
                      className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-right"
                    />

                    {paymentSplits.length > 1 && (
                      <button
                        onClick={() => setPaymentSplits(paymentSplits.filter((_, i) => i !== idx))}
                        className="p-2 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setPaymentSplits([...paymentSplits, { method: 'UPI', amount: 0, referenceNo: '' }])}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Split Payment Mode
                </button>
              </div>

              {/* Payment Balance Calculation */}
              {(() => {
                const totalPaid = paymentSplits.reduce((acc, p) => acc + (p.method === 'CREDIT' ? 0 : Number(p.amount || 0)), 0);
                const creditAmount = paymentSplits.find((p) => p.method === 'CREDIT')?.amount || 0;
                const remaining = Math.max(0, totals.grandTotal - totalPaid);

                return (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between text-slate-600">
                      <span>Total Invoice:</span>
                      <span>₹{totals.grandTotal}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-emerald-700">
                      <span>Received Now:</span>
                      <span>₹{totalPaid}</span>
                    </div>
                    {remaining > 0 && (
                      <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 pt-1">
                        <span>Balance Due (Udhar Khata):</span>
                        <span>₹{remaining}</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Invoice Notes (Optional)</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Delivered to site, Carpenter discount applied"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCheckoutModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleFinalCheckout}
                  disabled={submittingSale}
                  className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-xs rounded-lg shadow-sm transition"
                >
                  {submittingSale ? 'Generating Bill...' : 'Confirm & Print Invoice'}
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* New Customer Modal */}
      {newCustomerModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6">
            <h3 className="text-base font-bold text-slate-900 mb-3">Add Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newCustomerForm.name}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, name: e.target.value })}
                  placeholder="e.g. Santosh Plumber"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={newCustomerForm.phone}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={newCustomerForm.gstin}
                  onChange={(e) => setNewCustomerForm({ ...newCustomerForm, gstin: e.target.value })}
                  placeholder="e.g. 27AAAAA0000A1Z5"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg uppercase"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewCustomerModal(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Print Modal Popup */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        sale={completedSale}
        shopSettings={shopSettings}
      />

    </div>
  );
};
