import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { BillingPOS } from './pages/BillingPOS';
import { Invoices } from './pages/Invoices';
import { Products } from './pages/Products';
import { StockMovements } from './pages/StockMovements';
import { Purchases } from './pages/Purchases';
import { Customers } from './pages/Customers';
import { CashRegister } from './pages/CashRegister';
import { Expenses } from './pages/Expenses';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';

const AppContent = () => {
  const { isAuthenticated, loading } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-900 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Loading StockMate...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <Layout activePage={activePage} setActivePage={setActivePage}>
      {activePage === 'dashboard' && <Dashboard setActivePage={setActivePage} />}
      {activePage === 'pos' && <BillingPOS />}
      {activePage === 'invoices' && <Invoices />}
      {activePage === 'products' && <Products />}
      {activePage === 'stock-movements' && <StockMovements />}
      {activePage === 'purchases' && <Purchases />}
      {activePage === 'customers' && <Customers />}
      {activePage === 'cash-register' && <CashRegister />}
      {activePage === 'expenses' && <Expenses />}
      {activePage === 'reports' && <Reports />}
      {activePage === 'settings' && <Settings />}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0f172a',
            color: '#ffffff',
            fontSize: '12px',
            borderRadius: '8px',
            fontWeight: '600',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#ffffff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#ffffff',
            },
          },
        }}
      />
      <AppContent />
    </AuthProvider>
  );
}
