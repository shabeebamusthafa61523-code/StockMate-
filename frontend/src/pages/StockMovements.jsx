import React, { useState, useEffect } from 'react';
import {
  Layers,
  Filter,
  Search,
  Plus,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  RefreshCw,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const StockMovements = () => {
  const { hasRole } = useAuth();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [movementType, setMovementType] = useState('');
  const [productId, setProductId] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Damage Modal
  const [damageModalOpen, setDamageModalOpen] = useState(false);
  const [damageForm, setDamageForm] = useState({ productId: '', quantity: '', reason: '' });
  const [recordingDamage, setRecordingDamage] = useState(false);

  const fetchDropdowns = async () => {
    try {
      const res = await api.get('/products?limit=100');
      if (res.success) setProducts(res.data);
    } catch (e) {
      // quiet error
    }
  };

  const fetchMovements = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 20,
        movementType,
        productId,
      }).toString();

      const res = await api.get(`/inventory/movements?${query}`);
      if (res.success) {
        setMovements(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load stock movements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchMovements();
  }, [pagination.page, movementType, productId]);

  const handleRecordDamage = async (e) => {
    e.preventDefault();
    if (!damageForm.productId || !damageForm.quantity) {
      toast.error('Please select product and enter quantity');
      return;
    }
    setRecordingDamage(true);
    try {
      const res = await api.post('/inventory/damage', {
        productId: damageForm.productId,
        quantity: Number(damageForm.quantity),
        reason: damageForm.reason || 'Damaged in transit / shop',
      });
      if (res.success) {
        toast.success('Damaged stock recorded and deducted');
        setDamageModalOpen(false);
        setDamageForm({ productId: '', quantity: '', reason: '' });
        fetchMovements();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record damage');
    } finally {
      setRecordingDamage(false);
    }
  };

  const movementTypeColors = {
    SALE: 'bg-red-50 text-red-700 border-red-200',
    PURCHASE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SALE_RETURN: 'bg-blue-50 text-blue-700 border-blue-200',
    PURCHASE_RETURN: 'bg-amber-50 text-amber-700 border-amber-200',
    DAMAGE: 'bg-rose-50 text-rose-700 border-rose-200',
    ADJUSTMENT: 'bg-purple-50 text-purple-700 border-purple-200',
    OPENING: 'bg-slate-100 text-slate-700 border-slate-300',
  };

  return (
    <div className="space-y-4">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Stock Movement Ledger</h1>
          <p className="text-xs text-slate-500">Immutable audit log of all inventory inflows, outflows, and adjustments</p>
        </div>

        <div className="flex items-center gap-2">
          {hasRole(['admin', 'storekeeper']) && (
            <button
              onClick={() => {
                setDamageForm({ productId: products[0]?._id || '', quantity: '', reason: '' });
                setDamageModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Record Damage / Loss</span>
            </button>
          )}

          <button
            onClick={fetchMovements}
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
        <select
          value={movementType}
          onChange={(e) => setMovementType(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
        >
          <option value="">All Movement Types</option>
          <option value="SALE">Sale (Outflow)</option>
          <option value="PURCHASE">Purchase (Inflow)</option>
          <option value="SALE_RETURN">Sales Return (Inflow)</option>
          <option value="PURCHASE_RETURN">Purchase Return (Outflow)</option>
          <option value="DAMAGE">Damaged / Expired</option>
          <option value="ADJUSTMENT">Manual Adjustment</option>
          <option value="OPENING">Opening Stock</option>
        </select>

        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
        >
          <option value="">All Products</option>
          {products.map((p) => (
            <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
          ))}
        </select>
      </div>

      {/* Movement Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Date & Time</th>
                <th className="p-3">Product Name</th>
                <th className="p-3 text-center">Type</th>
                <th className="p-3 text-right">Quantity</th>
                <th className="p-3 text-center">Stock Change</th>
                <th className="p-3">Ref Document</th>
                <th className="p-3">Reason / Details</th>
                <th className="p-3">Handled By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movements.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No stock movements recorded matching filters
                  </td>
                </tr>
              ) : (
                movements.map((m) => (
                  <tr key={m._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 text-slate-500 whitespace-nowrap">
                      {new Date(m.createdAt).toLocaleDateString('en-IN')},{' '}
                      {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{m.product?.name || 'Deleted Product'}</div>
                      <div className="text-[10px] text-slate-500">SKU: {m.product?.sku || '-'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${movementTypeColors[m.movementType] || 'bg-slate-100 text-slate-700'}`}>
                        {m.movementType}
                      </span>
                    </td>
                    <td className={`p-3 text-right font-black ${m.quantity > 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                      {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                    </td>
                    <td className="p-3 text-center text-slate-600 font-medium">
                      {m.previousStock} ➔ <b className="text-slate-900">{m.newStock}</b>
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-800">
                      {m.referenceDocument || '-'}
                    </td>
                    <td className="p-3 text-slate-600 max-w-[200px] truncate" title={m.reason}>
                      {m.reason || '-'}
                    </td>
                    <td className="p-3 text-slate-500 font-medium">
                      {m.user?.name || 'System'}
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
            <div>Total {pagination.total} movements</div>
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

      {/* Record Damage Modal */}
      {damageModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Record Damaged / Broken Stock</h3>
              </div>
              <button onClick={() => setDamageModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleRecordDamage} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Product *</label>
                <select
                  value={damageForm.productId}
                  onChange={(e) => setDamageForm({ ...damageForm, productId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-800"
                  required
                >
                  <option value="">Select product...</option>
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} (Stock: {p.currentStock} {p.unit?.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Quantity Damaged *</label>
                <input
                  type="number"
                  value={damageForm.quantity}
                  onChange={(e) => setDamageForm({ ...damageForm, quantity: e.target.value })}
                  placeholder="e.g. 2"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason / Cause</label>
                <input
                  type="text"
                  value={damageForm.reason}
                  onChange={(e) => setDamageForm({ ...damageForm, reason: e.target.value })}
                  placeholder="e.g. Paint can leaked during unloading, tile cracked"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setDamageModalOpen(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={recordingDamage}
                  className="px-4 py-2 bg-red-600 text-white font-bold rounded-lg shadow-xs"
                >
                  {recordingDamage ? 'Deducting...' : 'Confirm & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
