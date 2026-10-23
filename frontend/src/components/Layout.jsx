import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  Layers,
  Truck,
  Users,
  Wallet,
  Coins,
  FileBarChart,
  Settings,
  Menu,
  X,
  LogOut,
  Bell,
  Search,
  PlusCircle,
  Clock,
  ChevronRight,
  ShieldAlert,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Layout = ({ children, activePage, setActivePage }) => {
  const { user, logout, hasRole } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cashSession, setCashSession] = useState(null);

  // Fetch active cash session for topbar indicator
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await api.get('/cash/current');
        if (res.success) {
          setCashSession(res.data);
        }
      } catch (e) {
        // quiet error
      }
    };
    fetchSession();
    const interval = setInterval(fetchSession, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'cashier', 'storekeeper'] },
    { id: 'pos', label: 'POS Billing', icon: ShoppingCart, roles: ['admin', 'cashier'], badge: 'F2' },
    { id: 'invoices', label: 'Invoices & Bills', icon: Receipt, roles: ['admin', 'cashier'] },
    { id: 'products', label: 'Products & Stock', icon: Package, roles: ['admin', 'storekeeper', 'cashier'] },
    { id: 'stock-movements', label: 'Stock Movements', icon: Layers, roles: ['admin', 'storekeeper'] },
    { id: 'purchases', label: 'Purchases & Stock In', icon: Truck, roles: ['admin', 'storekeeper'] },
    { id: 'customers', label: 'Customers & Udhar', icon: Users, roles: ['admin', 'cashier'] },
    { id: 'cash-register', label: 'Daily Cash Register', icon: Wallet, roles: ['admin', 'cashier'] },
    { id: 'expenses', label: 'Shop Expenses', icon: Coins, roles: ['admin', 'cashier'] },
    { id: 'reports', label: 'Reports & GST', icon: FileBarChart, roles: ['admin'] },
    { id: 'settings', label: 'Settings & Users', icon: Settings, roles: ['admin'] },
  ];

  const visibleNavItems = navItems.filter((item) => hasRole(item.roles));

  const roleColors = {
    admin: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    cashier: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    storekeeper: 'bg-amber-100 text-amber-800 border-amber-200',
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      
      {/* Top Header */}
      <header className="no-print h-16 bg-white border-b border-slate-200 sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2.5">
            <img src="/logo-icon.png" alt="StockMate" className="w-8 h-8 object-contain" />
            <div>
              <div className="flex items-center gap-1 leading-none">
                <span className="font-black text-base text-[#0d2a54] tracking-tight">Stock</span>
                <span className="font-black text-base text-[#f27405] tracking-tight">Mate</span>
              </div>
              <span className="text-[9px] text-slate-500 font-medium block tracking-tight mt-0.5">
                Smart Inventory. Better Business.
              </span>
            </div>
          </div>
        </div>

        {/* Topbar Center & Right Actions */}
        <div className="flex items-center gap-3">
          
          {/* Quick Action: New Bill */}
          {hasRole(['admin', 'cashier']) && (
            <button
              onClick={() => setActivePage('pos')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>New Bill (F2)</span>
            </button>
          )}

          {/* Cash Register Session Pill */}
          {hasRole(['admin', 'cashier']) && (
            <button
              onClick={() => setActivePage('cash-register')}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border transition ${
                cashSession?.status === 'OPEN'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${cashSession?.status === 'OPEN' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>Cash Register: {cashSession?.status === 'OPEN' ? `₹${cashSession.expectedCash || cashSession.openingCash} Active` : 'Closed'}</span>
            </button>
          )}

          {/* User Profile & Role */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-semibold text-xs uppercase shadow-xs">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-900 leading-tight">{user?.name}</div>
              <div className="flex items-center gap-1">
                <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded border ${roleColors[user?.role] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                  {user?.role}
                </span>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition ml-1"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Desktop Collapsible Sidebar */}
        <aside
          className={`no-print hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-200 ease-in-out ${
            sidebarCollapsed ? 'w-18' : 'w-60'
          }`}
        >
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!sidebarCollapsed && <span className="flex-1 text-left truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Sidebar Footer info */}
          {!sidebarCollapsed && (
            <div className="p-3 border-t border-slate-200 text-[11px] text-slate-400">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <img src="/logo-icon.png" alt="StockMate" className="w-4 h-4 object-contain" />
                <span>StockMate POS</span>
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">Smart Inventory. Better Business.</div>
            </div>
          )}
        </aside>

        {/* Mobile Slide-out Menu */}
        {mobileMenuOpen && (
          <div className="no-print fixed inset-0 z-40 md:hidden bg-slate-900/50 backdrop-blur-xs flex">
            <div className="w-64 bg-white h-full p-4 flex flex-col shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-slate-900">Menu</span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto py-3 space-y-1">
                {visibleNavItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activePage === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActivePage(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold transition ${
                        isActive
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-xs">
                <span className="font-medium text-slate-600">{user?.name}</span>
                <button onClick={logout} className="text-red-600 font-bold flex items-center gap-1">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </button>
              </div>
            </div>

            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
};
