import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  X,
  Trash2,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Purchases = () => {
  const { hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState('purchases'); // 'purchases' or 'suppliers'
  const [purchases, setPurchases] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Purchase Modal
  const [purchaseModalOpen, setPurchaseModalOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [supplierInvoiceNo, setSupplierInvoiceNo] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState([
    { productId: '', quantity: 1, purchasePrice: 0, taxRate: 18 },
  ]);
  const [amountPaid, setAmountPaid] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CREDIT');
  const [purchaseNotes, setPurchaseNotes] = useState('');
  const [savingPurchase, setSavingPurchase] = useState(false);

  // New Supplier Modal
  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    businessName: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    openingBalance: 0,
  });

  // Supplier Settlement Payment Modal
  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [settleSupplier, setSettleSupplier] = useState(null);
  const [settleAmount, setSettleAmount] = useState(0);
  const [settleMethod, setSettleMethod] = useState('BANK_TRANSFER');
  const [settleRef, setSettleRef] = useState('');

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, prRes] = await Promise.all([
        api.get('/purchases?limit=50'),
        api.get('/suppliers'),
        api.get('/products?limit=100'),
      ]);
      if (pRes.success) setPurchases(pRes.data);
      if (sRes.success) setSuppliers(sRes.data);
      if (prRes.success) setProducts(prRes.data);
    } catch (e) {
      toast.error('Failed to load purchase data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPurchases();
  }, []);

  // Update item in purchase builder
  const handleItemProductChange = (idx, prodId) => {
    const prod = products.find((p) => p._id === prodId);
    const updated = [...purchaseItems];
    updated[idx].productId = prodId;
    if (prod) {
      updated[idx].purchasePrice = prod.purchasePrice;
      updated[idx].taxRate = prod.gstRate || 18;
    }
    setPurchaseItems(updated);
  };

  const calculatePurchaseGrandTotal = () => {
    let sub = 0;
    let tax = 0;
    purchaseItems.forEach((item) => {
      const line = Number(item.quantity || 0) * Number(item.purchasePrice || 0);
      const lineTax = (line * Number(item.taxRate || 0)) / 100;
      sub += line;
      tax += lineTax;
    });
    return Math.round(sub + tax);
  };

  const grandTotal = calculatePurchaseGrandTotal();

  // Submit New Purchase
  const handleSavePurchase = async (e) => {
    e.preventDefault();
    if (!supplierId) {
      toast.error('Please select a supplier');
      return;
    }
    const validItems = purchaseItems.filter((i) => i.productId && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one item');
      return;
    }

    setSavingPurchase(true);
    try {
      const res = await api.post('/purchases', {
        supplierId,
        supplierInvoiceNo,
        purchaseDate,
        items: validItems,
        amountPaid: Number(amountPaid),
        paymentMethod,
        status: 'RECEIVED',
        notes: purchaseNotes,
      });

      if (res.success) {
        toast.success(`Purchase ${res.data.purchaseNumber} recorded & inventory stocked`);
        setPurchaseModalOpen(false);
        // Reset form
        setSupplierId('');
        setSupplierInvoiceNo('');
        setPurchaseItems([{ productId: '', quantity: 1, purchasePrice: 0, taxRate: 18 }]);
        setAmountPaid(0);
        fetchPurchases();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record purchase');
    } finally {
      setSavingPurchase(false);
    }
  };

  // Submit New Supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/suppliers', supplierForm);
      if (res.success) {
        toast.success(`Supplier ${res.data.businessName} saved`);
        setSupplierModalOpen(false);
        setSupplierForm({ businessName: '', name: '', phone: '', email: '', address: '', gstin: '', openingBalance: 0 });
        fetchPurchases();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create supplier');
    }
  };

  // Settle Supplier Payment
  const handleSettleSupplier = async (e) => {
    e.preventDefault();
    if (!settleAmount || settleAmount <= 0) {
      toast.error('Please enter a valid payment amount');
      return;
    }
    try {
      const res = await api.post('/payments', {
        partyType: 'SUPPLIER',
        supplierId: settleSupplier._id,
        amount: Number(settleAmount),
        paymentMethod: settleMethod,
        referenceNo: settleRef,
        notes: `Paid to supplier ${settleSupplier.businessName}`,
      });
      if (res.success) {
        toast.success(`Payment of ₹${settleAmount} recorded`);
        setSettleModalOpen(false);
        fetchPurchases();
      }
    } catch (err) {
      toast.error(err.message || 'Payment recording failed');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Purchases & Suppliers</h1>
          <p className="text-xs text-slate-500">Record supplier purchase bills, stock-ins, payments & dues</p>
        </div>

        <div className="flex items-center gap-2">
          {hasRole(['admin', 'storekeeper']) && (
            <>
              <button
                onClick={() => setSupplierModalOpen(true)}
                className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
              >
                + New Supplier
              </button>

              <button
                onClick={() => {
                  setSupplierId(suppliers[0]?._id || '');
                  setPurchaseItems([{ productId: products[0]?._id || '', quantity: 1, purchasePrice: products[0]?.purchasePrice || 0, taxRate: 18 }]);
                  setPurchaseModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Purchase Invoice</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'purchases'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Purchase Bills ({purchases.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'suppliers'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Suppliers & Payables ({suppliers.length})
        </button>
      </div>

      {/* Tab 1: Purchases Table */}
      {activeTab === 'purchases' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">PO #</th>
                  <th className="p-3">Supplier Invoice #</th>
                  <th className="p-3">Supplier Name</th>
                  <th className="p-3">Purchase Date</th>
                  <th className="p-3 text-right">Total Tax (₹)</th>
                  <th className="p-3 text-right">Grand Total (₹)</th>
                  <th className="p-3 text-right">Paid (₹)</th>
                  <th className="p-3 text-right">Due (₹)</th>
                  <th className="p-3 text-center">Payment Status</th>
                  <th className="p-3 text-center">Goods Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-12 text-center text-slate-400">
                      No purchase orders recorded yet
                    </td>
                  </tr>
                ) : (
                  purchases.map((po) => (
                    <tr key={po._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 font-bold text-slate-900">{po.purchaseNumber}</td>
                      <td className="p-3 font-mono text-slate-700">{po.supplierInvoiceNo || '-'}</td>
                      <td className="p-3 font-bold text-slate-800">{po.supplierName}</td>
                      <td className="p-3 text-slate-500">{new Date(po.purchaseDate).toLocaleDateString('en-IN')}</td>
                      <td className="p-3 text-right text-slate-600">₹{po.totalTax}</td>
                      <td className="p-3 text-right font-black text-slate-900">₹{po.grandTotal.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right text-emerald-700 font-semibold">₹{po.amountPaid || 0}</td>
                      <td className="p-3 text-right font-bold text-red-600">
                        {po.balanceDue > 0 ? `₹${po.balanceDue}` : '-'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          po.paymentStatus === 'PAID'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {po.paymentStatus}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-bold uppercase">
                          {po.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Suppliers Table */}
      {activeTab === 'suppliers' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Business Name</th>
                  <th className="p-3">Contact Person</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">GSTIN</th>
                  <th className="p-3 text-right">Outstanding Due (₹)</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {suppliers.map((s) => (
                  <tr key={s._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900">{s.businessName}</td>
                    <td className="p-3 text-slate-700">{s.name}</td>
                    <td className="p-3 text-slate-600">{s.phone}</td>
                    <td className="p-3 font-mono text-slate-600">{s.gstin || '-'}</td>
                    <td className="p-3 text-right font-black text-amber-700">
                      ₹{s.currentBalance?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="p-3 text-center">
                      {s.currentBalance > 0 && hasRole(['admin', 'storekeeper']) && (
                        <button
                          onClick={() => {
                            setSettleSupplier(s);
                            setSettleAmount(s.currentBalance);
                            setSettleModalOpen(true);
                          }}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[11px] font-bold shadow-xs transition"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {purchaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">Record Purchase Invoice (Stock In)</h3>
              <button onClick={() => setPurchaseModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier *</label>
                  <select
                    value={supplierId}
                    onChange={(e) => setSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                    required
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s._id} value={s._id}>{s.businessName}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Supplier Bill/Invoice No *</label>
                  <input
                    type="text"
                    value={supplierInvoiceNo}
                    onChange={(e) => setSupplierInvoiceNo(e.target.value)}
                    placeholder="e.g. AP-99482"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Date</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* Items Table Builder */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="p-2.5 bg-slate-50 font-bold text-slate-700 flex justify-between items-center border-b border-slate-200">
                  <span>Purchased Items & Rates</span>
                  <button
                    type="button"
                    onClick={() => setPurchaseItems([...purchaseItems, { productId: '', quantity: 1, purchasePrice: 0, taxRate: 18 }])}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800"
                  >
                    + Add Item Line
                  </button>
                </div>

                <div className="p-3 space-y-2">
                  {purchaseItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemProductChange(idx, e.target.value)}
                        className="flex-2 px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs font-medium"
                        required
                      >
                        <option value="">Select Product...</option>
                        {products.map((p) => (
                          <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                        ))}
                      </select>

                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].quantity = Number(e.target.value);
                          setPurchaseItems(updated);
                        }}
                        placeholder="Qty"
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded text-center text-xs font-bold"
                        min="1"
                        required
                      />

                      <input
                        type="number"
                        value={item.purchasePrice}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].purchasePrice = Number(e.target.value);
                          setPurchaseItems(updated);
                        }}
                        placeholder="Cost Rate"
                        className="w-24 px-2 py-1.5 border border-slate-300 rounded text-right text-xs font-bold"
                        min="0"
                        required
                      />

                      <select
                        value={item.taxRate}
                        onChange={(e) => {
                          const updated = [...purchaseItems];
                          updated[idx].taxRate = Number(e.target.value);
                          setPurchaseItems(updated);
                        }}
                        className="w-20 px-2 py-1.5 border border-slate-300 rounded text-xs"
                      >
                        <option value={0}>0%</option>
                        <option value={5}>5%</option>
                        <option value={12}>12%</option>
                        <option value={18}>18%</option>
                        <option value={28}>28%</option>
                      </select>

                      {purchaseItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPurchaseItems(purchaseItems.filter((_, i) => i !== idx))}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals & Payment */}
              <div className="grid grid-cols-2 gap-4 items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="space-y-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Amount Paid to Supplier Now</label>
                    <input
                      type="number"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="CREDIT">Credit (Udhar from Supplier)</option>
                      <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                      <option value="UPI">UPI Payment</option>
                      <option value="CASH">Cash</option>
                      <option value="CHEQUE">Cheque</option>
                    </select>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500">Invoice Total:</div>
                  <div className="text-2xl font-black text-slate-900">₹{grandTotal.toLocaleString('en-IN')}</div>
                  <div className="text-xs text-red-600 font-bold">
                    Balance Due to Supplier: ₹{Math.max(0, grandTotal - Number(amountPaid))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPurchaseModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPurchase}
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  {savingPurchase ? 'Saving...' : 'Confirm & Receive Stock'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* New Supplier Modal */}
      {supplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-3">
            <h3 className="font-bold text-base text-slate-900">Add Supplier</h3>
            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Company / Business Name *</label>
                <input
                  type="text"
                  value={supplierForm.businessName}
                  onChange={(e) => setSupplierForm({ ...supplierForm, businessName: e.target.value })}
                  placeholder="e.g. Asian Paints Depot"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Contact Person Name *</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="e.g. Vikas Shah"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="10 digit phone"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN</label>
                <input
                  type="text"
                  value={supplierForm.gstin}
                  onChange={(e) => setSupplierForm({ ...supplierForm, gstin: e.target.value.toUpperCase() })}
                  placeholder="15-character GSTIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSupplierModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Settle Supplier Payment Modal */}
      {settleModalOpen && settleSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-3">
            <h3 className="font-bold text-base text-slate-900">Record Payment to {settleSupplier.businessName}</h3>
            <p className="text-xs text-slate-600">Current Outstanding: <b>₹{settleSupplier.currentBalance}</b></p>

            <form onSubmit={handleSettleSupplier} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  value={settleAmount}
                  onChange={(e) => setSettleAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-sm"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={settleMethod}
                  onChange={(e) => setSettleMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="BANK_TRANSFER">Bank Transfer (NEFT/RTGS)</option>
                  <option value="UPI">UPI Payment</option>
                  <option value="CHEQUE">Cheque</option>
                  <option value="CASH">Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">UTR / Cheque / Ref No.</label>
                <input
                  type="text"
                  value={settleRef}
                  onChange={(e) => setSettleRef(e.target.value)}
                  placeholder="e.g. UTR-99482918"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setSettleModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
