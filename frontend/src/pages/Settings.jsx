import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Store,
  Users,
  ShieldCheck,
  Plus,
  Save,
  KeyRound,
  History,
  X,
  CheckCircle2,
  Edit2,
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('shop'); // 'shop', 'users', 'audit'
  
  // Shop Settings
  const [settings, setSettings] = useState({
    shopName: '',
    tagline: '',
    address: '',
    phone: '',
    email: '',
    gstin: '',
    pan: '',
    state: '',
    stateCode: '27',
    invoicePrefix: 'INV-',
    nextInvoiceNumber: 1001,
    defaultTaxType: 'INCLUSIVE',
    defaultGstRate: 18,
    printLayout: 'A4',
    thermalWidth: '80mm',
    invoiceFooterNotes: '',
    upiId: '',
    bankDetails: { bankName: '', accountNo: '', ifsc: '', branch: '', accountHolder: '' },
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Users Management
  const [usersList, setUsersList] = useState([]);
  const [newUserModal, setNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({ name: '', username: '', password: '', role: 'cashier', phone: '' });
  const [editUserModal, setEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', role: 'cashier', phone: '', password: '', isActive: true });

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await api.get('/settings');
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (e) {
      toast.error('Failed to load shop settings');
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users');
      if (res.success) setUsersList(res.data);
    } catch (e) {
      // quiet error
    }
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const res = await api.get('/settings/audit-logs');
      if (res.success) setAuditLogs(res.data);
    } catch (e) {
      // quiet error
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchSettings();
    if (user?.role === 'admin') {
      fetchUsers();
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      const res = await api.put('/settings', settings);
      if (res.success) {
        toast.success('Shop settings updated successfully');
        setSettings(res.data);
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth/users', newUserForm);
      if (res.success) {
        toast.success(`User ${res.data.username} created`);
        setNewUserModal(false);
        setNewUserForm({ name: '', username: '', password: '', role: 'cashier', phone: '' });
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to create user');
    }
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setEditUserForm({
      name: u.name,
      email: u.email || '',
      role: u.role,
      phone: u.phone || '',
      password: '',
      isActive: u.isActive,
    });
    setEditUserModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: editUserForm.name,
        email: editUserForm.email,
        role: editUserForm.role,
        phone: editUserForm.phone,
        isActive: editUserForm.isActive,
      };
      if (editUserForm.password && editUserForm.password.trim()) {
        if (editUserForm.password.trim().length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        payload.password = editUserForm.password.trim();
      }
      const res = await api.put(`/auth/users/${editingUser._id}`, payload);
      if (res.success) {
        toast.success(`User ${editingUser.username} updated successfully`);
        setEditUserModal(false);
        setEditingUser(null);
        fetchUsers();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to update user');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      const res = await api.put(`/auth/users/${targetUser._id}`, {
        isActive: !targetUser.isActive,
      });
      if (res.success) {
        toast.success(`User ${targetUser.username} ${res.data.isActive ? 'activated' : 'deactivated'}`);
        fetchUsers();
      }
    } catch (err) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h1 className="text-xl font-black text-slate-900 tracking-tight">System Settings & Administration</h1>
        <p className="text-xs text-slate-500">Configure business identity, print defaults, user permissions & audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-xl">
        <button
          onClick={() => setActiveTab('shop')}
          className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
            activeTab === 'shop'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Shop Profile & Invoices
        </button>

        {user?.role === 'admin' && (
          <>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              User Management ({usersList.length})
            </button>

            <button
              onClick={() => setActiveTab('audit')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                activeTab === 'audit'
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Audit Trail Logs
            </button>
          </>
        )}
      </div>

      {/* Tab 1: Shop Profile Settings */}
      {activeTab === 'shop' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSaveSettings} className="space-y-6 text-xs max-w-4xl">
            
            {/* Identity & Logo Branding */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3 pb-1 border-b border-slate-100 flex items-center justify-between">
                <span>Brand Identity & Logo</span>
                <span className="text-[11px] font-normal text-slate-500">StockMate Active Branding</span>
              </h3>

              <div className="flex items-center gap-6 p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4">
                <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-xs">
                  <img src="/logo-horizontal.png" alt="StockMate Logo" className="h-14 object-contain" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">StockMate Official Logo</span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-[10px] font-bold">Transparent Active</span>
                  </div>
                  <p className="text-slate-500 text-xs">
                    Displayed across login, top navigation bar, browser tabs, thermal receipts, and A4 tax invoices.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shop / Firm Name *</label>
                  <input
                    type="text"
                    value={settings.shopName || ''}
                    onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settings.tagline || ''}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Shop Address</label>
                  <input
                    type="text"
                    value={settings.address || ''}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone || ''}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* GST & Tax Identity */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3 pb-1 border-b border-slate-100">
                GSTIN & Invoice Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
                  <input
                    type="text"
                    value={settings.gstin || ''}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={settings.pan || ''}
                    onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">GST State Code</label>
                  <input
                    type="text"
                    value={settings.stateCode || ''}
                    onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Invoice Prefix</label>
                  <input
                    type="text"
                    value={settings.invoicePrefix || ''}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Next Invoice Sequence Number</label>
                  <input
                    type="number"
                    value={settings.nextInvoiceNumber || 1001}
                    onChange={(e) => setSettings({ ...settings, nextInvoiceNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Default Print Format</label>
                  <select
                    value={settings.printLayout || 'A4'}
                    onChange={(e) => setSettings({ ...settings, printLayout: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  >
                    <option value="A4">A4 Standard Format</option>
                    <option value="THERMAL">80mm Thermal Receipt</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Bank Details & UPI */}
            <div>
              <h3 className="font-bold text-sm text-slate-900 mb-3 pb-1 border-b border-slate-100">
                Payment Info & Bank Details (Printed on Invoices)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Shop UPI ID (for instant QR/reminders)</label>
                  <input
                    type="text"
                    value={settings.upiId || ''}
                    onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.bankName || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, bankName: e.target.value },
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Number</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.accountNo || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, accountNo: e.target.value },
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    value={settings.bankDetails?.ifsc || ''}
                    onChange={(e) => setSettings({
                      ...settings,
                      bankDetails: { ...settings.bankDetails, ifsc: e.target.value.toUpperCase() },
                    })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono uppercase"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Invoice Footer Terms & Return Policy</label>
                  <textarea
                    rows="3"
                    value={settings.invoiceFooterNotes || ''}
                    onChange={(e) => setSettings({ ...settings, invoiceFooterNotes: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSettings}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm transition"
              >
                <Save className="w-4 h-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Tab 2: User Management */}
      {activeTab === 'users' && user?.role === 'admin' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-sm text-slate-900">Store Staff Accounts</h3>
              <p className="text-xs text-slate-500">Manage Cashier, Storekeeper & Admin credentials and active status</p>
            </div>
            <button
              onClick={() => setNewUserModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-lg shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" /> Add Staff User
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Staff Name</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Role</th>
                  <th className="p-3">Phone</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersList.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3 font-bold text-slate-900">{u.name}</td>
                    <td className="p-3 font-mono text-slate-700">{u.username}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase border bg-slate-100 text-slate-700">
                        {u.role}
                      </span>
                    </td>
                    <td className="p-3 text-slate-600">{u.phone || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        u.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                      }`}>
                        {u.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenEditUser(u)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[10px] font-bold border border-slate-300 transition"
                          title="Edit User Details & Password"
                        >
                          <Edit2 className="w-3 h-3 text-slate-600" />
                          <span>Edit</span>
                        </button>

                        {u.username !== 'admin' && (
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2.5 py-1 rounded text-[10px] font-bold border transition ${
                              u.isActive
                                ? 'text-red-700 hover:bg-red-50 border-red-200'
                                : 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                            }`}
                          >
                            {u.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Audit Trail Logs */}
      {activeTab === 'audit' && user?.role === 'admin' && (
        <div className="bg-white rounded-b-xl border border-t-0 border-slate-200 shadow-xs p-6 space-y-4">
          <div className="pb-2 border-b border-slate-200">
            <h3 className="font-bold text-sm text-slate-900">Security Audit Trail</h3>
            <p className="text-xs text-slate-500">Immutable record of logins, product updates, sales, and cancellations</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">User</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Entity</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-400">
                      {loadingAudit ? 'Loading audit records...' : 'No audit records found'}
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3 text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 font-bold text-slate-800">{log.userName || log.user?.name || 'System'}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded font-mono font-bold text-[10px]">
                          {log.action}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 font-medium">{log.entity}</td>
                      <td className="p-3 font-mono text-[11px] text-slate-500 max-w-xs truncate">
                        {JSON.stringify(log.details || {})}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {newUserModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Add Staff Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={newUserForm.name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                  placeholder="e.g. Amit Verma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Login Username *</label>
                <input
                  type="text"
                  value={newUserForm.username}
                  onChange={(e) => setNewUserForm({ ...newUserForm, username: e.target.value.toLowerCase() })}
                  placeholder="e.g. amit2"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono lowercase"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Permission *</label>
                <select
                  value={newUserForm.role}
                  onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                >
                  <option value="cashier">Cashier (POS Billing, Invoices, Khata)</option>
                  <option value="storekeeper">Storekeeper (Inventory, Purchases, Dues)</option>
                  <option value="admin">Admin / Owner (Full System Access)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={newUserForm.phone}
                  onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setNewUserModal(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModal && editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h3 className="font-bold text-base text-slate-900">Edit Staff Account</h3>
                <p className="text-[11px] text-slate-500 font-mono">Username: @{editingUser.username}</p>
              </div>
              <button
                onClick={() => setEditUserModal(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={editUserForm.name}
                  onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })}
                  placeholder="e.g. Amit Verma"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-medium"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Role Permission *</label>
                <select
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  disabled={editingUser.username === 'admin'}
                >
                  <option value="cashier">Cashier (POS Billing, Invoices, Khata)</option>
                  <option value="storekeeper">Storekeeper (Inventory, Purchases, Dues)</option>
                  <option value="admin">Admin / Owner (Full System Access)</option>
                </select>
                {editingUser.username === 'admin' && (
                  <p className="text-[10px] text-slate-400 mt-0.5">Primary owner role cannot be downgraded</p>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={editUserForm.phone}
                  onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })}
                  placeholder="10 digit mobile"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })}
                  placeholder="staff@store.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Reset Password</label>
                <input
                  type="password"
                  value={editUserForm.password}
                  onChange={(e) => setEditUserForm({ ...editUserForm, password: e.target.value })}
                  placeholder="Leave blank to keep existing password"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Only enter if you wish to reset this user's password (min 6 characters)</p>
              </div>

              {editingUser.username !== 'admin' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Account Status</label>
                  <select
                    value={editUserForm.isActive ? 'true' : 'false'}
                    onChange={(e) => setEditUserForm({ ...editUserForm, isActive: e.target.value === 'true' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg font-bold"
                  >
                    <option value="true">Active (Can Login)</option>
                    <option value="false">Disabled / Suspended</option>
                  </select>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditUserModal(false)}
                  className="px-3 py-1.5 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
