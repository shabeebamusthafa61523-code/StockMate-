import React, { useState, useEffect } from 'react';
import {
  Search,
  Printer,
  Share2,
  XCircle,
  RotateCcw,
  Eye,
  Calendar,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { api } from '../services/api';
import { InvoicePrintModal } from '../components/InvoicePrintModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Invoices = () => {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [status, setStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Selected invoice for Print / View
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [shopSettings, setShopSettings] = useState({});
  const [printModalOpen, setPrintModalOpen] = useState(false);

  // Cancellation Modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancellingInvoice, setCancellingInvoice] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  // Sales Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returningInvoice, setReturningInvoice] = useState(null);
  const [returnQuantities, setReturnQuantities] = useState({});
  const [returnReason, setReturnReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('CASH');
  const [processingReturn, setProcessingReturn] = useState(false);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 15,
        search,
        paymentStatus,
        status,
      }).toString();

      const [res, settingsRes] = await Promise.all([
        api.get(`/sales?${query}`),
        api.get('/settings'),
      ]);

      if (res.success) {
        setInvoices(res.data);
        setPagination(res.pagination);
      }
      if (settingsRes.success) setShopSettings(settingsRes.data);
    } catch (err) {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [pagination.page, paymentStatus, status]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchInvoices();
  };

  const openInvoicePrint = (sale) => {
    setSelectedInvoice(sale);
    setPrintModalOpen(true);
  };

  // Process Cancellation
  const handleConfirmCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error('Please enter a cancellation reason');
      return;
    }
    setCancelling(true);
    try {
      const res = await api.put(`/sales/${cancellingInvoice._id}/cancel`, { reason: cancelReason });
      if (res.success) {
        toast.success(`Invoice ${cancellingInvoice.invoiceNumber} cancelled and stock restored`);
        setCancelModalOpen(false);
        setCancellingInvoice(null);
        setCancelReason('');
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to cancel invoice');
    } finally {
      setCancelling(false);
    }
  };

  // Open Return Modal
  const handleOpenReturnModal = (sale) => {
    setReturningInvoice(sale);
    const initialQty = {};
    (sale.items || []).forEach((item) => {
      initialQty[item.product] = 0;
    });
    setReturnQuantities(initialQty);
    setReturnReason('');
    setReturnModalOpen(true);
  };

  // Submit Sales Return
  const handleSubmitReturn = async () => {
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({
        productId,
        quantity: Number(quantity),
      }));

    if (itemsToReturn.length === 0) {
      toast.error('Select at least one item with quantity greater than 0');
      return;
    }

    setProcessingReturn(true);
    try {
      const res = await api.post(`/sales/${returningInvoice._id}/return`, {
        items: itemsToReturn,
        refundMethod,
        reason: returnReason || 'Customer return',
      });

      if (res.success) {
        toast.success(`Sales return processed (${res.data.returnNumber})`);
        setReturnModalOpen(false);
        setReturningInvoice(null);
        fetchInvoices();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to process return');
    } finally {
      setProcessingReturn(false);
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Header & Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Invoice History & Returns</h1>
            <p className="text-xs text-slate-500">Search past bills, re-print slips, share on WhatsApp, or process returns</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice #, customer name, or phone..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:bg-white"
            />
          </form>

          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Payments</option>
            <option value="PAID">Fully Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="CREDIT">Udhar (Credit)</option>
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Items</th>
                <th className="p-3 text-right">Grand Total (₹)</th>
                <th className="p-3 text-right">Received (₹)</th>
                <th className="p-3 text-right">Due (₹)</th>
                <th className="p-3 text-center">Payment</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-12 text-center text-slate-400">
                    No invoices matching your search
                  </td>
                </tr>
              ) : (
                invoices.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900">{sale.invoiceNumber}</td>
                    <td className="p-3 text-slate-500">
                      {new Date(sale.invoiceDate).toLocaleDateString('en-IN')},{' '}
                      {new Date(sale.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-800">{sale.customerName || 'Walk-in'}</div>
                      {sale.customerPhone && <div className="text-[10px] text-slate-500">{sale.customerPhone}</div>}
                    </td>
                    <td className="p-3 text-slate-600 font-medium">
                      {sale.items?.length || 0} items
                    </td>
                    <td className="p-3 text-right font-black text-slate-900">
                      ₹{sale.grandTotal.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3 text-right text-emerald-700 font-semibold">
                      ₹{sale.amountReceived || 0}
                    </td>
                    <td className="p-3 text-right font-bold text-red-600">
                      {sale.balanceDue > 0 ? `₹${sale.balanceDue}` : '-'}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        sale.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        sale.status === 'COMPLETED'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : sale.status === 'CANCELLED'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {sale.status}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => openInvoicePrint(sale)}
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                          title="Print / View Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {sale.status === 'COMPLETED' && hasRole(['admin', 'cashier']) && (
                          <>
                            <button
                              onClick={() => handleOpenReturnModal(sale)}
                              className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                              title="Process Return"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setCancellingInvoice(sale);
                                setCancelModalOpen(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                              title="Cancel Invoice"
                            >
                              <XCircle className="w-3.5 h-3.5" />
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

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>Total {pagination.total} invoices</div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.page <= 1}
                onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold disabled:opacity-50"
              >
                Previous
              </button>
              <span>Page {pagination.page} of {pagination.pages}</span>
              <button
                disabled={pagination.page >= pagination.pages}
                onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded font-semibold disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Cancel Confirmation Modal */}
      {cancelModalOpen && cancellingInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <AlertCircle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900">Cancel Invoice {cancellingInvoice.invoiceNumber}?</h3>
            </div>
            <p className="text-xs text-slate-600">
              Cancelling this invoice will automatically <b>restore all item quantities</b> back into product stock and reverse any customer balance ledger entries.
            </p>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Cancellation Reason *</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Customer cancelled order, incorrect items added"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                autoFocus
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Keep Invoice
              </button>
              <button
                onClick={handleConfirmCancel}
                disabled={cancelling}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                {cancelling ? 'Reversing...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Return Modal */}
      {returnModalOpen && returningInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 p-6 space-y-4">
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Process Return for {returningInvoice.invoiceNumber}
                </h3>
                <p className="text-xs text-slate-500">Customer: {returningInvoice.customerName}</p>
              </div>
              <button onClick={() => setReturnModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="overflow-x-auto max-h-60 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 uppercase font-bold">
                  <tr>
                    <th className="p-2">Product</th>
                    <th className="p-2 text-center">Billed Qty</th>
                    <th className="p-2 text-right">Unit Rate</th>
                    <th className="p-2 text-center">Return Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(returningInvoice.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="p-2 font-bold text-slate-800">{item.productName}</td>
                      <td className="p-2 text-center font-medium">{item.quantity} {item.unit}</td>
                      <td className="p-2 text-right">₹{item.unitPrice}</td>
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          value={returnQuantities[item.product] || 0}
                          onChange={(e) => {
                            const val = Math.min(item.quantity, Math.max(0, Number(e.target.value)));
                            setReturnQuantities({ ...returnQuantities, [item.product]: val });
                          }}
                          className="w-16 py-1 text-center font-bold border border-slate-300 rounded"
                          min="0"
                          max={item.quantity}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Refund Method</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="CASH">Cash Refund</option>
                  <option value="CREDIT_ADJUSTMENT">Adjust to Customer Khata (Credit)</option>
                  <option value="UPI">UPI Refund</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Return</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Excess paint unused, wrong pipe size"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                onClick={() => setReturnModalOpen(false)}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitReturn}
                disabled={processingReturn}
                className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
              >
                {processingReturn ? 'Processing...' : 'Confirm Return & Restock'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Print Modal */}
      <InvoicePrintModal
        isOpen={printModalOpen}
        onClose={() => setPrintModalOpen(false)}
        sale={selectedInvoice}
        shopSettings={shopSettings}
      />

    </div>
  );
};
