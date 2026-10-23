import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Plus,
  CreditCard,
  Phone,
  FileText,
  Share2,
  DollarSign,
  ArrowDownLeft,
  X,
  History,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [onlyDue, setOnlyDue] = useState(false);

  // New Customer Modal
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    openingBalance: 0,
    creditLimit: 0,
  });

  // Customer Ledger Drawer
  const [ledgerDrawerOpen, setLedgerDrawerOpen] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState(null);
  const [customerLedger, setCustomerLedger] = useState([]);

  // Collect Payment Modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [payCustomer, setPayCustomer] = useState(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers?hasBalance=${onlyDue}`);
      if (res.success) {
        setCustomers(res.data);
      }
    } catch (e) {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [onlyDue]);

  // Open Customer Ledger
  const handleOpenLedger = async (c) => {
    setCurrentCustomer(c);
    setLedgerDrawerOpen(true);
    try {
      const res = await api.get(`/customers/${c._id}`);
      if (res.success) {
        setCustomerLedger(res.data.ledger || []);
      }
    } catch (e) {
      toast.error('Failed to load ledger transactions');
    }
  };

  // Open Collect Payment
  const handleOpenPayment = (c) => {
    setPayCustomer(c);
    setPayAmount(c.currentBalance);
    setPayMethod('CASH');
    setPayRef('');
    setPayNotes('');
    setPaymentModalOpen(true);
  };

  // Submit Payment Collection
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    if (!payAmount || payAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    setSubmittingPayment(true);
    try {
      const res = await api.post('/payments', {
        partyType: 'CUSTOMER',
        customerId: payCustomer._id,
        amount: Number(payAmount),
        paymentMethod: payMethod,
        referenceNo: payRef,
        notes: payNotes || `Payment collected from ${payCustomer.name}`,
      });

      if (res.success) {
        toast.success(`Payment of ₹${payAmount} collected! Customer balance updated.`);
        setPaymentModalOpen(false);
        fetchCustomers();
        if (ledgerDrawerOpen && currentCustomer?._id === payCustomer._id) {
          handleOpenLedger(payCustomer);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Payment collection failed');
    } finally {
      setSubmittingPayment(false);
    }
  };

  // WhatsApp Reminder Generator
  const handleSendWhatsAppReminder = (c) => {
    const phone = c.phone ? c.phone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const message =
      `Namaste *${c.name}*,\n\n` +
      `This is a friendly payment reminder.\n` +
      `Your current outstanding balance is *₹${c.currentBalance.toLocaleString('en-IN')}*.\n\n` +
      `Kindly arrange payment at your earliest convenience.\n\n` +
      `Thank you for your business! 🙏`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`
      : `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  // Save New Customer
  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/customers', formData);
      if (res.success) {
        toast.success(`Customer ${res.data.name} created`);
        setNewModalOpen(false);
        setFormData({ name: '', phone: '', email: '', address: '', gstin: '', openingBalance: 0, creditLimit: 0 });
        fetchCustomers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create customer');
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      (c.gstin && c.gstin.toLowerCase().includes(search.toLowerCase()))
  );

  const totalOutstanding = customers.reduce((sum, c) => sum + (c.currentBalance || 0), 0);

  return (
    <div className="space-y-4">
      
      {/* Top Header Card */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Customer Khata & Credit (Udhar)</h1>
          <p className="text-xs text-slate-500">
            Total Customer Dues:{' '}
            <b className="text-amber-700 text-sm">₹{totalOutstanding.toLocaleString('en-IN')}</b> across {customers.filter((c) => c.currentBalance > 0).length} accounts
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center gap-2">
        <div className="flex-1 relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by customer name, phone, or GSTIN..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </div>

        <label className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-300 rounded-lg cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={onlyDue}
            onChange={(e) => setOnlyDue(e.target.checked)}
            className="rounded text-slate-900"
          />
          <span>Show Only Customers with Dues</span>
        </label>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Address</th>
                <th className="p-3">GSTIN</th>
                <th className="p-3 text-right">Total Purchases (₹)</th>
                <th className="p-3 text-right">Outstanding Udhar (₹)</th>
                <th className="p-3 text-right">Credit Limit (₹)</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No customers found matching search
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{c.name}</div>
                    </td>
                    <td className="p-3 font-medium text-slate-700">{c.phone}</td>
                    <td className="p-3 text-slate-500 max-w-[150px] truncate">{c.address || '-'}</td>
                    <td className="p-3 font-mono text-slate-600">{c.gstin || '-'}</td>
                    <td className="p-3 text-right font-medium text-slate-700">
                      ₹{c.totalPurchases?.toLocaleString('en-IN') || 0}
                    </td>
                    <td className="p-3 text-right">
                      {c.currentBalance > 0 ? (
                        <span className="font-black text-amber-700 text-sm">
                          ₹{c.currentBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-bold">Clear (₹0)</span>
                      )}
                    </td>
                    <td className="p-3 text-right text-slate-500 font-medium">
                      {c.creditLimit > 0 ? `₹${c.creditLimit.toLocaleString('en-IN')}` : 'No limit'}
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenLedger(c)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="View Ledger Statement"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        {c.currentBalance > 0 && (
                          <>
                            <button
                              onClick={() => handleOpenPayment(c)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs transition"
                              title="Collect Payment"
                            >
                              Collect
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppReminder(c)}
                              className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded transition"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Unified Ledger Drawer */}
      {ledgerDrawerOpen && currentCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{currentCustomer.name}</h3>
                <p className="text-[11px] text-slate-400">Phone: {currentCustomer.phone} • Khata Ledger</p>
              </div>
              <button onClick={() => setLedgerDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50/70 border-b border-amber-200 flex justify-between items-center text-xs text-amber-900">
              <div>
                <span>Current Outstanding Due:</span>
                <div className="text-xl font-black text-amber-800">
                  ₹{currentCustomer.currentBalance.toLocaleString('en-IN')}
                </div>
              </div>
              {currentCustomer.currentBalance > 0 && (
                <button
                  onClick={() => handleOpenPayment(currentCustomer)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold shadow-xs transition"
                >
                  Collect Payment
                </button>
              )}
            </div>

            {/* Ledger Transactions */}
            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 text-xs">
              {customerLedger.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No transactions recorded</div>
              ) : (
                customerLedger.map((item, idx) => (
                  <div key={idx} className="py-2.5 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-900">{item.description}</span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(item.date).toLocaleDateString('en-IN')}
                      </span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <div>
                        {item.debit > 0 && <span className="text-slate-800">Billed: ₹{item.debit}</span>}
                        {item.credit > 0 && <span className="text-emerald-700 font-bold ml-2">Paid: -₹{item.credit}</span>}
                      </div>
                      <span className="font-mono text-[10px] text-slate-500">{item.reference}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {paymentModalOpen && payCustomer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-200 pb-2">
              <h3 className="text-base font-bold text-slate-900">Collect Udhar Payment</h3>
              <p className="text-xs text-slate-600">
                Customer: <b>{payCustomer.name}</b> (Total Due: ₹{payCustomer.currentBalance})
              </p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount Received (₹) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-black text-slate-900"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method *</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800"
                >
                  <option value="CASH">Cash (Adds to Drawer)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">Bank Transfer / NEFT</option>
                  <option value="CHEQUE">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  placeholder="e.g. UPI-99201948 or Cheque 00412"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Receipt Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="e.g. Cleared bill 1001 balance"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPayment}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {submittingPayment ? 'Recording...' : 'Confirm Payment & Update Khata'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Customer</h3>
            <form onSubmit={handleCreateCustomer} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer / Contractor Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ramesh Contractor"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Address / Site Location</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. Sector 19, Kopar Khairane"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">GSTIN (Optional)</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="15-character GSTIN"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Opening Udhar (₹)</label>
                  <input
                    type="number"
                    value={formData.openingBalance}
                    onChange={(e) => setFormData({ ...formData, openingBalance: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Credit Limit (₹)</label>
                  <input
                    type="number"
                    value={formData.creditLimit}
                    onChange={(e) => setFormData({ ...formData, creditLimit: Number(e.target.value) })}
                    placeholder="0 = Unlimited"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
