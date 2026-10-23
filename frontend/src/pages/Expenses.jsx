import React, { useState, useEffect } from 'react';
import {
  Coins,
  Plus,
  Trash2,
  Calendar,
  Filter,
  DollarSign,
  TrendingDown,
  X,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Expenses = () => {
  const { hasRole } = useAuth();
  const [expenses, setExpenses] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // New Expense Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'TEA_SNACKS',
    amount: '',
    paymentMethod: 'CASH',
    paidTo: '',
    description: '',
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const query = categoryFilter ? `?category=${categoryFilter}` : '';
      const res = await api.get(`/expenses${query}`);
      if (res.success) setExpenses(res.data);
    } catch (e) {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [categoryFilter]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/expenses', {
        ...formData,
        amount: Number(formData.amount),
      });
      if (res.success) {
        toast.success('Expense recorded');
        setModalOpen(false);
        setFormData({ title: '', category: 'TEA_SNACKS', amount: '', paymentMethod: 'CASH', paidTo: '', description: '' });
        fetchExpenses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to record expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      const res = await api.delete(`/expenses/${id}`);
      if (res.success) {
        toast.success('Expense deleted');
        fetchExpenses();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete expense');
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  const categoryLabels = {
    RENT: 'Shop Rent',
    ELECTRICITY: 'Electricity Bill',
    SALARY: 'Staff Salary',
    TRANSPORT: 'Transport & Freight',
    TEA_SNACKS: 'Tea & Refreshments',
    MAINTENANCE: 'Repairs & Maintenance',
    PACKAGING: 'Packing Materials',
    OTHER: 'Miscellaneous',
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Shop Daily Expenses</h1>
          <p className="text-xs text-slate-500">
            Total recorded expenses:{' '}
            <b className="text-slate-900 text-sm">₹{totalExpenseAmount.toLocaleString('en-IN')}</b>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700"
          >
            <option value="">All Categories</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* Expense Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Ref #</th>
                <th className="p-3">Date</th>
                <th className="p-3">Title / Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Paid To</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-right">Amount (₹)</th>
                <th className="p-3 text-center">Handled By</th>
                {hasRole(['admin']) && <th className="p-3 text-center"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No expense records found
                  </td>
                </tr>
              ) : (
                expenses.map((exp) => (
                  <tr key={exp._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">{exp.expenseNumber}</td>
                    <td className="p-3 text-slate-500">{new Date(exp.expenseDate).toLocaleDateString('en-IN')}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{exp.title}</div>
                      {exp.description && <div className="text-[10px] text-slate-500">{exp.description}</div>}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px] font-bold">
                        {categoryLabels[exp.category] || exp.category}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600 font-medium">{exp.paidTo || '-'}</td>
                    <td className="p-3 font-bold text-slate-700">{exp.paymentMethod}</td>
                    <td className="p-3 text-right font-black text-slate-900">₹{exp.amount}</td>
                    <td className="p-3 text-center text-slate-500">{exp.createdBy?.name || 'Staff'}</td>
                    {hasRole(['admin']) && (
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleDeleteExpense(exp._id)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Expense Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Record Shop Expense</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Title / Item *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g. Tea & Samosa for staff, Tempo freight"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Expense Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-black text-sm"
                  required
                  min="1"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                >
                  <option value="CASH">Cash (Deducts from Register)</option>
                  <option value="UPI">UPI / GPay / PhonePe</option>
                  <option value="BANK_TRANSFER">Bank Transfer / Net Banking</option>
                  <option value="CARD">Debit / Credit Card</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Paid To (Vendor/Person)</label>
                <input
                  type="text"
                  value={formData.paidTo}
                  onChange={(e) => setFormData({ ...formData, paidTo: e.target.value })}
                  placeholder="e.g. Raju Chaiwala, Electric Company"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Notes / Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Optional details"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
