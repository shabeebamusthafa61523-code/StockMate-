import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Calendar,
  Download,
  Printer,
  TrendingUp,
  Percent,
  Receipt,
  Package,
  CreditCard,
  Building2,
  RefreshCw,
} from 'lucide-react';
import { api } from '../services/api';
import toast from 'react-hot-toast';

export const Reports = () => {
  const [activeReport, setActiveReport] = useState('profit'); // 'profit', 'gst', 'valuation', 'balances'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let endpoint = '';
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      if (activeReport === 'profit') {
        endpoint = `/reports/sales-profit?${params.toString()}`;
      } else if (activeReport === 'gst') {
        endpoint = `/reports/gst-summary?${params.toString()}`;
      } else if (activeReport === 'valuation') {
        endpoint = `/reports/stock-valuation`;
      } else if (activeReport === 'balances') {
        endpoint = `/reports/balances`;
      }

      const res = await api.get(endpoint);
      if (res.success) {
        setReportData(res.data);
      }
    } catch (e) {
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [activeReport]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      
      {/* Top Header */}
      <div className="no-print bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Business Reports & GST Filing</h1>
          <p className="text-xs text-slate-500">Live analytical calculations from database transactions</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Tabs & Date Filters */}
      <div className="no-print bg-white p-3 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Navigation Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-lg text-xs font-bold gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveReport('profit')}
            className={`px-3 py-1.5 rounded-md transition ${activeReport === 'profit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Sales & Gross Profit
          </button>
          <button
            onClick={() => setActiveReport('gst')}
            className={`px-3 py-1.5 rounded-md transition ${activeReport === 'gst' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            GST Tax Summary (GSTR-1)
          </button>
          <button
            onClick={() => setActiveReport('valuation')}
            className={`px-3 py-1.5 rounded-md transition ${activeReport === 'valuation' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Stock Valuation
          </button>
          <button
            onClick={() => setActiveReport('balances')}
            className={`px-3 py-1.5 rounded-md transition ${activeReport === 'balances' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'}`}
          >
            Receivables & Payables
          </button>
        </div>

        {/* Date Filter (Applicable to Sales & GST) */}
        {(activeReport === 'profit' || activeReport === 'gst') && (
          <div className="flex items-center gap-2 text-xs">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg"
            />
            <button
              onClick={fetchReport}
              className="px-3 py-1.5 bg-slate-900 text-white font-bold rounded-lg shadow-xs"
            >
              Filter
            </button>
          </div>
        )}

      </div>

      {/* REPORT CONTENT VIEW */}
      {loading ? (
        <div className="bg-white p-12 text-center rounded-xl border border-slate-200">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto text-slate-400 mb-2" />
          <p className="text-xs text-slate-500">Calculating report metrics...</p>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 1. SALES & GROSS PROFIT REPORT */}
          {activeReport === 'profit' && reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Sales Revenue</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{reportData.totalRevenue?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{reportData.totalInvoices} Invoices</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Cost of Goods (COGS)</span>
                  <div className="text-2xl font-black text-slate-700 mt-1">₹{reportData.totalCostOfGoodsSold?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Purchase cost baseline</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Gross Profit</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">₹{reportData.grossProfit?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Net of discounts & GST</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Gross Margin %</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">{reportData.grossMarginPercent}%</div>
                  <div className="text-[11px] text-slate-500 mt-1">Average markup yield</div>
                </div>
              </div>

              {/* Invoices Breakdown Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 font-bold text-slate-800 text-xs">
                  Transaction Invoices in Period
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">Invoice #</th>
                        <th className="p-3">Date</th>
                        <th className="p-3">Customer</th>
                        <th className="p-3 text-right">Taxable (₹)</th>
                        <th className="p-3 text-right">GST (₹)</th>
                        <th className="p-3 text-right">Grand Total (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportData.sales || []).map((s) => (
                        <tr key={s._id}>
                          <td className="p-3 font-bold text-slate-900">{s.invoiceNumber}</td>
                          <td className="p-3 text-slate-500">{new Date(s.invoiceDate).toLocaleDateString('en-IN')}</td>
                          <td className="p-3 font-medium text-slate-800">{s.customerName}</td>
                          <td className="p-3 text-right text-slate-600">₹{s.taxableTotal}</td>
                          <td className="p-3 text-right text-slate-600">₹{(s.totalCgst || 0) + (s.totalSgst || 0) + (s.totalIgst || 0)}</td>
                          <td className="p-3 text-right font-black text-slate-900">₹{s.grandTotal}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. GST TAX SUMMARY REPORT */}
          {activeReport === 'gst' && reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">B2B Registered Sales (With GSTIN)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{reportData.b2bTotal?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{reportData.b2bCount} invoices with customer GSTIN</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">B2C Retail Consumer Sales</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">₹{reportData.b2cTotal?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{reportData.b2cCount} walk-in / unregistered retail bills</div>
                </div>
              </div>

              {/* Rate-Wise GST Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3 border-b border-slate-200 font-bold text-slate-800 text-xs">
                  Rate-Wise Tax Breakdown (CGST, SGST, IGST)
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">GST Slab Rate</th>
                        <th className="p-3 text-right">Taxable Value (₹)</th>
                        <th className="p-3 text-right">CGST (₹)</th>
                        <th className="p-3 text-right">SGST (₹)</th>
                        <th className="p-3 text-right">IGST (₹)</th>
                        <th className="p-3 text-right">Total Tax Liability (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportData.rateWise || []).map((rw) => (
                        <tr key={rw.rate} className="hover:bg-slate-50/70 transition">
                          <td className="p-3 font-bold text-slate-900">{rw.rate}% GST</td>
                          <td className="p-3 text-right font-medium text-slate-700">₹{rw.taxable.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-slate-600">₹{rw.cgst.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-slate-600">₹{rw.sgst.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right text-slate-600">₹{rw.igst.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-black text-slate-900">₹{rw.totalTax.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 3. STOCK VALUATION REPORT */}
          {activeReport === 'valuation' && reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Total Items</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{reportData.totalProducts}</div>
                  <div className="text-[11px] text-slate-500 mt-1">{reportData.totalStockUnits} total stock units</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Valuation at Cost</span>
                  <div className="text-2xl font-black text-slate-800 mt-1">₹{reportData.totalPurchaseValue?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Purchase price basis</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Valuation at Retail</span>
                  <div className="text-2xl font-black text-indigo-700 mt-1">₹{reportData.totalSellingValue?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Selling price basis</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Unrealized Gross Margin</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">₹{reportData.potentialProfit?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-emerald-700 mt-1 font-semibold">Potential markup</div>
                </div>
              </div>

              {/* Item-wise Valuation Table */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
                      <tr>
                        <th className="p-3">Product Name & SKU</th>
                        <th className="p-3">Category</th>
                        <th className="p-3 text-center">In Stock</th>
                        <th className="p-3 text-right">Purchase Price (₹)</th>
                        <th className="p-3 text-right">Stock Cost Value (₹)</th>
                        <th className="p-3 text-right">Retail Value (₹)</th>
                        <th className="p-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {(reportData.items || []).map((it) => (
                        <tr key={it._id} className="hover:bg-slate-50/70 transition">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{it.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">{it.sku}</div>
                          </td>
                          <td className="p-3 text-slate-600 font-medium">{it.category}</td>
                          <td className="p-3 text-center font-bold text-slate-800">{it.currentStock} {it.unit}</td>
                          <td className="p-3 text-right text-slate-600">₹{it.purchasePrice}</td>
                          <td className="p-3 text-right font-bold text-slate-900">₹{it.purchaseValue.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-bold text-indigo-900">₹{it.sellingValue.toLocaleString('en-IN')}</td>
                          <td className="p-3 text-right font-black text-emerald-700">{it.marginPercent}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. BALANCES REPORT */}
          {activeReport === 'balances' && reportData && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-amber-700 uppercase">Customer Receivables (Udhar)</span>
                  <div className="text-2xl font-black text-amber-800 mt-1">₹{reportData.totalCustomerReceivable?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Money to collect from customers</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-purple-700 uppercase">Supplier Payables</span>
                  <div className="text-2xl font-black text-purple-800 mt-1">₹{reportData.totalSupplierPayable?.toLocaleString('en-IN')}</div>
                  <div className="text-[11px] text-slate-500 mt-1">Money to pay to stock suppliers</div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs font-bold text-slate-500 uppercase">Net Working Capital Balance</span>
                  <div className={`text-2xl font-black mt-1 ${reportData.netOutstanding >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    ₹{reportData.netOutstanding?.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Receivables minus Payables</div>
                </div>
              </div>

              {/* Lists */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                
                {/* Customers with Due */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-xs">
                    Customer Due List (Udhar)
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                    {(reportData.customers || []).map((c) => (
                      <div key={c._id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[10px] text-slate-500">{c.phone}</div>
                        </div>
                        <div className="text-right font-black text-amber-700">
                          ₹{c.currentBalance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suppliers with Due */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-xs">
                    Supplier Payable List
                  </div>
                  <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
                    {(reportData.suppliers || []).map((s) => (
                      <div key={s._id} className="p-3 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-slate-900">{s.businessName}</div>
                          <div className="text-[10px] text-slate-500">{s.phone}</div>
                        </div>
                        <div className="text-right font-black text-purple-800">
                          ₹{s.currentBalance.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
