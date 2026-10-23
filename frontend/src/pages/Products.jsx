import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  Download,
  Upload,
  AlertTriangle,
  Edit2,
  Trash2,
  Layers,
  ArrowUpDown,
  Filter,
  CheckCircle,
  X,
  History,
  AlertCircle,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Products = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  // Add / Edit Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    barcode: '',
    category: '',
    brand: '',
    sizeSpec: '',
    unit: '',
    purchasePrice: '',
    sellingPrice: '',
    wholesalePrice: '',
    gstRate: 18,
    hsnCode: '',
    openingStock: 0,
    minStockAlert: 5,
    preferredSupplier: '',
    rackLocation: '',
  });

  // Stock Movement History Drawer
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historyProduct, setHistoryProduct] = useState(null);
  const [productMovements, setProductMovements] = useState([]);

  // Manual Stock Adjustment / Damage Modal
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [adjustCount, setAdjustCount] = useState(0);
  const [adjustReason, setAdjustReason] = useState('');

  const fetchDropdowns = async () => {
    try {
      const [cats, uns, sups] = await Promise.all([
        api.get('/categories'),
        api.get('/units'),
        api.get('/suppliers'),
      ]);
      if (cats.success) setCategories(cats.data);
      if (uns.success) setUnits(uns.data);
      if (sups.success) setSuppliers(sups.data);
    } catch (e) {
      // quiet error
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: pagination.page,
        limit: 15,
        search,
        category: categoryFilter,
        stockStatus,
      }).toString();

      const res = await api.get(`/products?${query}`);
      if (res.success) {
        setProducts(res.data);
        setPagination(res.pagination);
      }
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [pagination.page, categoryFilter, stockStatus]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchProducts();
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0]?._id || '',
      brand: '',
      sizeSpec: '',
      unit: units[0]?._id || '',
      purchasePrice: '',
      sellingPrice: '',
      wholesalePrice: '',
      gstRate: 18,
      hsnCode: '',
      openingStock: 0,
      minStockAlert: 5,
      preferredSupplier: '',
      rackLocation: '',
    });
    setModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      barcode: p.barcode || '',
      category: p.category?._id || p.category || '',
      brand: p.brand || '',
      sizeSpec: p.sizeSpec || '',
      unit: p.unit?._id || p.unit || '',
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      wholesalePrice: p.wholesalePrice || '',
      gstRate: p.gstRate || 18,
      hsnCode: p.hsnCode || '',
      openingStock: p.currentStock,
      minStockAlert: p.minStockAlert || 5,
      preferredSupplier: p.preferredSupplier?._id || p.preferredSupplier || '',
      rackLocation: p.rackLocation || '',
    });
    setModalOpen(true);
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        const res = await api.put(`/products/${editingProduct._id}`, formData);
        if (res.success) {
          toast.success('Product updated');
          setModalOpen(false);
          fetchProducts();
        }
      } else {
        const res = await api.post('/products', formData);
        if (res.success) {
          toast.success('Product created');
          setModalOpen(false);
          fetchProducts();
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to save product');
    }
  };

  // View Stock History
  const handleOpenHistory = async (p) => {
    setHistoryProduct(p);
    setHistoryDrawerOpen(true);
    try {
      const res = await api.get(`/products/${p._id}`);
      if (res.success) {
        setProductMovements(res.data.movements || []);
      }
    } catch (e) {
      toast.error('Failed to load stock movements');
    }
  };

  // Open Adjustment Modal
  const handleOpenAdjustment = (p) => {
    setAdjustingProduct(p);
    setAdjustCount(p.currentStock);
    setAdjustReason('Physical stock audit count');
    setAdjustmentModalOpen(true);
  };

  // Save Adjustment
  const handleSaveAdjustment = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/inventory/adjust', {
        productId: adjustingProduct._id,
        countedStock: Number(adjustCount),
        reason: adjustReason,
      });
      if (res.success) {
        toast.success('Stock adjusted & movement recorded');
        setAdjustmentModalOpen(false);
        fetchProducts();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to adjust stock');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    window.open('/api/products/export/csv', '_blank');
    toast.success('Downloading products CSV');
  };

  return (
    <div className="space-y-4">
      
      {/* Top Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Products & Stock Inventory</h1>
          <p className="text-xs text-slate-500">Manage hardware items, prices, GST rates, rack locations & stock ledger</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          {hasRole(['admin', 'storekeeper']) && (
            <button
              onClick={handleOpenCreate}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Product</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU, brand, or barcode..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:bg-white"
          />
        </form>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>

        <select
          value={stockStatus}
          onChange={(e) => setStockStatus(e.target.value)}
          className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
        >
          <option value="">All Stock Levels</option>
          <option value="in_stock">In Stock (&gt; 0)</option>
          <option value="low">Low Stock (≤ Alert Limit)</option>
          <option value="out">Out of Stock (0)</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Product Name & SKU</th>
                <th className="p-3">Category</th>
                <th className="p-3">Size / Unit</th>
                <th className="p-3 text-right">Purchase (₹)</th>
                <th className="p-3 text-right">Selling (₹)</th>
                <th className="p-3 text-center">GST %</th>
                <th className="p-3 text-center">Current Stock</th>
                <th className="p-3">Rack</th>
                <th className="p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No products found matching filters
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.currentStock > 0 && p.currentStock <= p.minStockAlert;
                  const isOut = p.currentStock <= 0;

                  return (
                    <tr key={p._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono text-slate-700">{p.sku}</span>
                          {p.barcode && <span>• Barcode: {p.barcode}</span>}
                          {p.brand && <span>• {p.brand}</span>}
                        </div>
                      </td>
                      <td className="p-3 text-slate-700 font-medium">
                        {p.category?.name || 'General'}
                      </td>
                      <td className="p-3 text-slate-600">
                        {p.sizeSpec || '-'} ({p.unit?.code || 'Pcs'})
                      </td>
                      <td className="p-3 text-right text-slate-600 font-medium">
                        ₹{p.purchasePrice}
                      </td>
                      <td className="p-3 text-right font-black text-slate-900">
                        ₹{p.sellingPrice}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-600">
                        {p.gstRate}%
                      </td>
                      <td className="p-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                            isOut
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {isOut ? 'Out (0)' : `${p.currentStock} ${p.unit?.code || 'Pcs'}`}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 text-[11px] font-mono">
                        {p.rackLocation || '-'}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenHistory(p)}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                            title="Stock Movement Ledger"
                          >
                            <History className="w-3.5 h-3.5" />
                          </button>

                          {hasRole(['admin', 'storekeeper']) && (
                            <>
                              <button
                                onClick={() => handleOpenAdjustment(p)}
                                className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded transition"
                                title="Adjust Stock Count"
                              >
                                <ArrowUpDown className="w-3.5 h-3.5" />
                              </button>

                              <button
                                onClick={() => handleOpenEdit(p)}
                                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition"
                                title="Edit Product"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {pagination.pages > 1 && (
          <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>Total {pagination.total} products</div>
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

      {/* Product Add / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden my-8">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-base">
                {editingProduct ? 'Edit Hardware Product' : 'Add New Hardware Product'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Product Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Astral CPVC Pipe 1 inch SDR 11 (3 Metre)"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">SKU (Unique Code)</label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
                    placeholder="Auto-generated if left blank"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs uppercase font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Brand</label>
                  <input
                    type="text"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    placeholder="e.g. Asian Paints, Astral, Havells, Godrej"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Size / Specification</label>
                  <input
                    type="text"
                    value={formData.sizeSpec}
                    onChange={(e) => setFormData({ ...formData, sizeSpec: e.target.value })}
                    placeholder="e.g. 1 inch, 25mm, 10 Litre, 90 Mtr"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Unit of Measurement *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                    required
                  >
                    {units.map((u) => (
                      <option key={u._id} value={u._id}>{u.name} ({u.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Purchase Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    placeholder="Cost price"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="Retail MRP/price"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                    required
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Wholesale Price (₹)</label>
                  <input
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                    placeholder="Contractor rate"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST Rate (%)</label>
                  <select
                    value={formData.gstRate}
                    onChange={(e) => setFormData({ ...formData, gstRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5%</option>
                    <option value={12}>12%</option>
                    <option value={18}>18% (Standard Hardware)</option>
                    <option value={28}>28% (Cement / Luxury)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    placeholder="e.g. 7318, 3917, 8544"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono"
                  />
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Opening Stock</label>
                    <input
                      type="number"
                      value={formData.openingStock}
                      onChange={(e) => setFormData({ ...formData, openingStock: e.target.value })}
                      placeholder="Initial quantity on hand"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold"
                      min="0"
                    />
                  </div>
                )}

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Min Stock Alert</label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rack / Shelf Location</label>
                  <input
                    type="text"
                    value={formData.rackLocation}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Rack A-3, Pipe Yard"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-lg shadow-sm"
                >
                  {editingProduct ? 'Update Product' : 'Save Product'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* Stock Movement History Drawer */}
      {historyDrawerOpen && historyProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex justify-end">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm">{historyProduct.name}</h3>
                <p className="text-[11px] text-slate-400">Stock Ledger & Movement History</p>
              </div>
              <button onClick={() => setHistoryDrawerOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between text-xs">
              <div>Current Stock: <b>{historyProduct.currentStock} {historyProduct.unit?.code}</b></div>
              <div>Min Alert: <b>{historyProduct.minStockAlert}</b></div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100 text-xs">
              {productMovements.length === 0 ? (
                <div className="py-12 text-center text-slate-400">No stock movements recorded yet</div>
              ) : (
                productMovements.map((m) => (
                  <div key={m._id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        m.quantity > 0
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {m.movementType} ({m.quantity > 0 ? `+${m.quantity}` : m.quantity})
                      </span>
                      <span className="text-slate-400 text-[10px]">
                        {new Date(m.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>Stock: {m.previousStock} ➔ <b>{m.newStock}</b></span>
                      <span>Ref: <b>{m.referenceDocument || '-'}</b></span>
                    </div>
                    {m.reason && <div className="text-[11px] text-slate-500 italic">{m.reason}</div>}
                    <div className="text-[10px] text-slate-400">By: {m.user?.name || 'Staff'}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      {adjustmentModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Manual Stock Count Adjustment
            </h3>
            <p className="text-xs text-slate-600">
              Adjust stock for <b>{adjustingProduct.name}</b>. A stock movement ledger record will be created automatically.
            </p>

            <form onSubmit={handleSaveAdjustment} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Previous System Stock</label>
                <input
                  type="text"
                  value={adjustingProduct.currentStock}
                  disabled
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-600 font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Actual Counted Stock on Shelf *</label>
                <input
                  type="number"
                  value={adjustCount}
                  onChange={(e) => setAdjustCount(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-sm"
                  required
                  min="0"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reason for Adjustment *</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Monthly physical stock audit"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Count Correction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
