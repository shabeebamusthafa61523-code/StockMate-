import React, { useState, useEffect } from 'react';
import {
  Wallet,
  Coins,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  AlertTriangle,
  History,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const CashRegister = () => {
  const [currentSession, setCurrentSession] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Open Session Modal
  const [openModal, setOpenModal] = useState(false);
  const [openingFloat, setOpeningFloat] = useState(5000);

  // Close Session Modal
  const [closeModal, setCloseModal] = useState(false);
  const [actualCash, setActualCash] = useState(0);
  const [closeNotes, setCloseNotes] = useState('');
  const [closing, setClosing] = useState(false);

  const fetchSessionData = async () => {
    setLoading(true);
    try {
      const [currRes, histRes] = await Promise.all([
        api.get('/cash/current'),
        api.get('/cash/history'),
      ]);
      if (currRes.success) setCurrentSession(currRes.data);
      if (histRes.success) setHistory(histRes.data);
    } catch (e) {
      toast.error('Failed to load cash register session');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessionData();
  }, []);

  // Open New Cash Session
  const handleOpenSession = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/cash/open', { openingCash: Number(openingFloat) });
      if (res.success) {
        toast.success('Daily cash session opened');
        setOpenModal(false);
        fetchSessionData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to open cash session');
    }
  };

  // Close & Reconcile Session
  const handleCloseSession = async (e) => {
    e.preventDefault();
    setClosing(true);
    try {
      const res = await api.post('/cash/close', {
        actualCash: Number(actualCash),
        notes: closeNotes,
      });
      if (res.success) {
        toast.success('Cash session reconciled and closed');
        setCloseModal(false);
        fetchSessionData();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to close session');
    } finally {
      setClosing(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Daily Cash Register & Reconciliation</h1>
          <p className="text-xs text-slate-500">Track physical counter cash drawer float, receipts, payouts and end-of-day tally</p>
        </div>

        <div className="flex items-center gap-2">
          {currentSession?.status === 'OPEN' ? (
            <button
              onClick={() => {
                setActualCash(currentSession.expectedCash || currentSession.openingCash);
                setCloseModal(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close & Reconcile Register</span>
            </button>
          ) : (
            <button
              onClick={() => setOpenModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Open Cash Session</span>
            </button>
          )}

          <button
            onClick={fetchSessionData}
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Active Cash Drawer Status */}
      {currentSession?.status === 'OPEN' ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-base font-bold text-slate-900">Active Register Session</h2>
                </div>
                <p className="text-xs text-slate-500">
                  Opened on {new Date(currentSession.sessionDate).toLocaleDateString('en-IN')} by {currentSession.openedBy?.name || 'Staff'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Expected Cash in Drawer:</span>
              <div className="text-3xl font-black text-slate-900">
                ₹{currentSession.expectedCash?.toLocaleString('en-IN') || 0}
              </div>
            </div>
          </div>

          {/* Breakdown KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <span className="text-slate-500 font-medium">Opening Float:</span>
              <div className="text-lg font-bold text-slate-800 mt-1">₹{currentSession.openingCash}</div>
            </div>

            <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-lg">
              <span className="text-emerald-700 font-medium">+ Cash Sales:</span>
              <div className="text-lg font-bold text-emerald-800 mt-1">₹{currentSession.cashSalesTotal}</div>
            </div>

            <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg">
              <span className="text-blue-700 font-medium">+ Udhar Recoveries:</span>
              <div className="text-lg font-bold text-blue-800 mt-1">₹{currentSession.cashReceivedPayments}</div>
            </div>

            <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
              <span className="text-amber-700 font-medium">- Cash Expenses:</span>
              <div className="text-lg font-bold text-amber-800 mt-1">₹{currentSession.cashPaidExpenses}</div>
            </div>

            <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-lg">
              <span className="text-purple-700 font-medium">- Supplier Payouts:</span>
              <div className="text-lg font-bold text-purple-800 mt-1">₹{currentSession.cashPaidSupplierPayments}</div>
            </div>

          </div>
        </div>
      ) : (
        <div className="bg-amber-50/70 border border-amber-300 rounded-xl p-8 text-center text-amber-900">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-600 mb-2" />
          <h2 className="text-base font-bold">No Cash Session Currently Open</h2>
          <p className="text-xs text-amber-700 mt-1 mb-4">
            Start the day by opening the cash register with an initial float (petty cash).
          </p>
          <button
            onClick={() => setOpenModal(true)}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold shadow-xs transition"
          >
            Open Today's Session
          </button>
        </div>
      )}

      {/* Session History Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Past Register Reconciliations</h2>
          <span className="text-xs text-slate-500">Last 30 Sessions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="p-3">Session Date</th>
                <th className="p-3">Opened By</th>
                <th className="p-3 text-right">Opening Float (₹)</th>
                <th className="p-3 text-right">Cash In (₹)</th>
                <th className="p-3 text-right">Cash Out (₹)</th>
                <th className="p-3 text-right">Expected (₹)</th>
                <th className="p-3 text-right">Actual Counted (₹)</th>
                <th className="p-3 text-center">Variance (₹)</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.map((s) => (
                <tr key={s._id} className="hover:bg-slate-50/70 transition">
                  <td className="p-3 font-bold text-slate-900">
                    {new Date(s.sessionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="p-3 text-slate-700">{s.openedBy?.name || 'Staff'}</td>
                  <td className="p-3 text-right font-medium">₹{s.openingCash}</td>
                  <td className="p-3 text-right text-emerald-700 font-bold">
                    +₹{s.cashSalesTotal + (s.cashReceivedPayments || 0)}
                  </td>
                  <td className="p-3 text-right text-red-600 font-bold">
                    -₹{(s.cashPaidExpenses || 0) + (s.cashPaidSupplierPayments || 0)}
                  </td>
                  <td className="p-3 text-right font-bold text-slate-800">₹{s.expectedCash}</td>
                  <td className="p-3 text-right font-black text-slate-900">
                    {s.actualCash !== null ? `₹${s.actualCash}` : '-'}
                  </td>
                  <td className="p-3 text-center">
                    {s.status === 'CLOSED' ? (
                      s.difference === 0 ? (
                        <span className="text-emerald-600 font-bold">Exact (₹0)</span>
                      ) : s.difference > 0 ? (
                        <span className="text-blue-600 font-bold">+₹{s.difference} (Surplus)</span>
                      ) : (
                        <span className="text-red-600 font-bold">-₹{Math.abs(s.difference)} (Shortage)</span>
                      )
                    ) : (
                      <span className="text-slate-400 font-medium">In Progress</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      s.status === 'CLOSED'
                        ? 'bg-slate-100 text-slate-700 border-slate-300'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {s.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Open Session Modal */}
      {openModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Open Daily Cash Counter</h3>
            <p className="text-xs text-slate-600">Enter the starting float / change placed in the physical drawer this morning.</p>

            <form onSubmit={handleOpenSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Opening Cash Float (₹) *</label>
                <input
                  type="number"
                  value={openingFloat}
                  onChange={(e) => setOpeningFloat(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-lg font-black text-slate-900"
                  required
                  min="0"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  Start Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Close & Reconcile Modal */}
      {closeModal && currentSession && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 p-6 space-y-4">
            <h3 className="font-bold text-base text-slate-900">Close & Reconcile Register</h3>
            
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
              <div className="flex justify-between">
                <span>Expected Drawer Total:</span>
                <span className="font-black text-slate-900">₹{currentSession.expectedCash}</span>
              </div>
            </div>

            <form onSubmit={handleCloseSession} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Physical Cash Counted in Drawer (₹) *</label>
                <input
                  type="number"
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-lg font-black text-slate-900"
                  required
                  min="0"
                />
              </div>

              {/* Variance display */}
              {(() => {
                const diff = Number(actualCash) - (currentSession.expectedCash || 0);
                return (
                  <div className="flex justify-between font-bold text-xs pt-1">
                    <span>Reconciliation Difference:</span>
                    <span className={diff === 0 ? 'text-emerald-600' : diff > 0 ? 'text-blue-600' : 'text-red-600'}>
                      {diff === 0 ? 'Exact Match (₹0)' : diff > 0 ? `+₹${diff} (Surplus)` : `-₹${Math.abs(diff)} (Shortage)`}
                    </span>
                  </div>
                );
              })()}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Closing Notes / Discrepancy Reason</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="e.g. Counter counted & matched"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setCloseModal(false)}
                  className="px-3 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={closing}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
                >
                  {closing ? 'Reconciling...' : 'Confirm & Close Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
