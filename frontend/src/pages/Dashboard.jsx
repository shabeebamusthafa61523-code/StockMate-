import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Receipt,
  AlertTriangle,
  PackageCheck,
  PackageX,
  CreditCard,
  Building2,
  PlusCircle,
  ShoppingCart,
  Users,
  Truck,
  ArrowUpRight,
  RefreshCw,
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Dashboard = ({ setActivePage }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [chartPeriod, setChartPeriod] = useState('daily'); // 'daily', 'weekly', 'monthly'

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/dashboard/stats?chartPeriod=${chartPeriod}`);
      if (res.success) {
        setStats(res.data);
      }
    } catch (error) {
      toast.error('Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [chartPeriod]);

  const metrics = stats?.metrics || {
    todaySales: 0,
    todayInvoicesCount: 0,
    todayGrossProfit: 0,
    totalProducts: 0,
    lowStockProducts: 0,
    outOfStockProducts: 0,
    customerOutstanding: 0,
    supplierOutstanding: 0,
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header Bar & Quick Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Shop Dashboard</h1>
          <p className="text-xs text-slate-500">Live hardware retail performance & inventory overview</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActivePage('pos')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-xs transition"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>New Bill (POS)</span>
          </button>

          <button
            onClick={() => setActivePage('products')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => setActivePage('purchases')}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            <Truck className="w-3.5 h-3.5 text-slate-500" />
            <span>Record Purchase</span>
          </button>

          <button
            onClick={fetchStats}
            className="p-2 text-slate-500 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition"
            title="Refresh Data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Today's Sales */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Sales</span>
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{metrics.todaySales.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            <b>{metrics.todayInvoicesCount}</b> bills generated today
          </div>
        </div>

        {/* Est. Gross Profit */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Profit</span>
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600">₹{metrics.todayGrossProfit.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Estimated gross margin
          </div>
        </div>

        {/* Customer Udhar Khata (Receivable) */}
        <div
          onClick={() => setActivePage('customers')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Customer Due</span>
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-md">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-700">₹{metrics.customerOutstanding.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Outstanding Udhar</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Supplier Payable */}
        <div
          onClick={() => setActivePage('purchases')}
          className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs hover:border-slate-400 cursor-pointer transition"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Supplier Due</span>
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">₹{metrics.supplierOutstanding.toLocaleString('en-IN')}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Purchases to settle</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

      </div>

      {/* Secondary Stock KPI Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div
          onClick={() => setActivePage('products')}
          className="bg-white px-4 py-3 rounded-lg border border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-100 text-slate-700 rounded-lg">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs text-slate-500">Active Products</div>
              <div className="text-base font-bold text-slate-900">{metrics.totalProducts} items in catalog</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActivePage('products')}
          className={`px-4 py-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
            metrics.lowStockProducts > 0
              ? 'bg-amber-50/70 border-amber-300 text-amber-900'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${metrics.lowStockProducts > 0 ? 'bg-amber-200 text-amber-900' : 'bg-slate-100 text-slate-700'}`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">Low Stock Alert</div>
              <div className="text-base font-bold">{metrics.lowStockProducts} products below threshold</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActivePage('products')}
          className={`px-4 py-3 rounded-lg border flex items-center justify-between cursor-pointer transition ${
            metrics.outOfStockProducts > 0
              ? 'bg-red-50/70 border-red-300 text-red-900'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${metrics.outOfStockProducts > 0 ? 'bg-red-200 text-red-900' : 'bg-slate-100 text-slate-700'}`}>
              <PackageX className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-semibold">Out of Stock</div>
              <div className="text-base font-bold">{metrics.outOfStockProducts} products need reorder</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Section: Sales Chart & Top Selling Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sales Chart (2 Cols) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Revenue Trend</h2>
              <p className="text-xs text-slate-500">Sales value over chosen period</p>
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setChartPeriod('daily')}
                className={`px-3 py-1 rounded-md transition ${chartPeriod === 'daily' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                7 Days
              </button>
              <button
                onClick={() => setChartPeriod('weekly')}
                className={`px-3 py-1 rounded-md transition ${chartPeriod === 'weekly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                4 Weeks
              </button>
              <button
                onClick={() => setChartPeriod('monthly')}
                className={`px-3 py-1 rounded-md transition ${chartPeriod === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                6 Months
              </button>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.chartData || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0f172a" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#0f172a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={{ stroke: '#cbd5e1' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(val) => [`₹${val}`, 'Sales']}
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#0f172a" strokeWidth={2} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Leaderboard (1 Col) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Top Selling</h2>
              <p className="text-xs text-slate-500">Highest revenue items (30d)</p>
            </div>
          </div>

          <div className="flex-1 divide-y divide-slate-100">
            {(stats?.topProducts || []).length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">No sales data yet</div>
            ) : (
              (stats?.topProducts || []).map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-400">SKU: {item.sku} • {item.totalQty} sold</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-slate-900">₹{item.totalRevenue.toLocaleString('en-IN')}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* Recent Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Recent Invoices</h2>
            <p className="text-xs text-slate-500">Latest retail transactions</p>
          </div>
          <button
            onClick={() => setActivePage('invoices')}
            className="text-xs font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1"
          >
            View All Invoices <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Date & Time</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Payment</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(stats?.recentSales || []).length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-400">No invoices generated yet</td>
                </tr>
              ) : (
                (stats?.recentSales || []).map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition">
                    <td className="px-5 py-3 font-bold text-slate-900">{sale.invoiceNumber}</td>
                    <td className="px-5 py-3 text-slate-500">
                      {new Date(sale.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })},{' '}
                      {new Date(sale.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">{sale.customerName || 'Walk-in'}</td>
                    <td className="px-5 py-3 font-bold text-slate-900">₹{sale.grandTotal.toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        sale.paymentStatus === 'PAID'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {sale.paymentStatus}
                      </span>
                    </td>
                    <td className="px-5 py-3">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
