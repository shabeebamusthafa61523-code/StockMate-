import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { LogIn, Shield, Store, UserCheck, KeyRound, ArrowRight } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    setSubmitting(true);
    await login(username, password);
    setSubmitting(false);
  };

  const fillQuickLogin = (u, p) => {
    setUsername(u);
    setPassword(p);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        
        {/* Top Header Card with StockMate Logo */}
        <div className="bg-white border-b border-slate-100 p-6 text-center">
          <img src="/logo.png" alt="StockMate" className="h-28 mx-auto object-contain drop-shadow-xs" />
          <p className="text-xs text-slate-500 font-medium mt-1">Retail POS, Stock & GST Billing System</p>
        </div>

        {/* Login Form */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. admin, cashier, storekeeper"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900 focus:bg-white transition"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold text-sm rounded-lg shadow-sm transition"
            >
              {submitting ? 'Authenticating...' : 'Sign In to Shop Portal'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 mb-2.5 text-center">
              Quick Role Login (Click to populate):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => fillQuickLogin('admin', 'admin123')}
                className="p-2 text-left bg-slate-50 hover:bg-indigo-50 hover:border-indigo-300 border border-slate-200 rounded-lg transition"
              >
                <div className="text-[11px] font-bold text-indigo-900">Admin</div>
                <div className="text-[10px] text-slate-500">Owner Access</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin('cashier', 'cashier123')}
                className="p-2 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-lg transition"
              >
                <div className="text-[11px] font-bold text-emerald-900">Cashier</div>
                <div className="text-[10px] text-slate-500">Fast POS/Bills</div>
              </button>

              <button
                type="button"
                onClick={() => fillQuickLogin('storekeeper', 'store123')}
                className="p-2 text-left bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 rounded-lg transition"
              >
                <div className="text-[11px] font-bold text-amber-900">Storekeeper</div>
                <div className="text-[10px] text-slate-500">Stock & POs</div>
              </button>
            </div>
          </div>

        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500">
          GST Ready • Thermal & A4 Print • WhatsApp Share
        </div>

      </div>
    </div>
  );
};
