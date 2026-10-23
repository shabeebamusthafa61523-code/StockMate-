import React, { useState } from 'react';
import { Printer, X, Share2, FileText, CheckCircle2 } from 'lucide-react';
import toast from 'react-hot-toast';

export const InvoicePrintModal = ({ isOpen, onClose, sale, shopSettings = {} }) => {
  const [printMode, setPrintMode] = useState(shopSettings.printLayout || 'A4');

  if (!isOpen || !sale) return null;

  const settings = {
    footerNotes: shopSettings.invoiceFooterNotes || 'Goods once sold will not be taken back without original bill. Warranty by manufacturer.',
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const phone = sale.customerPhone ? sale.customerPhone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;

    const itemsSummary = (sale.items || [])
      .map((item) => `• ${item.productName} (x${item.quantity}) - ₹${item.total}`)
      .join('\n');

    const message = `*INVOICE: ${sale.invoiceNumber}*\n` +
      `-------------------------\n` +
      `Customer: ${sale.customerName || 'Walk-in'}\n` +
      `Date: ${new Date(sale.invoiceDate).toLocaleDateString('en-IN')}\n\n` +
      `*Items:*\n${itemsSummary}\n\n` +
      `*Subtotal:* ₹${sale.subtotal}\n` +
      (sale.totalDiscount > 0 ? `*Discount:* ₹${sale.totalDiscount}\n` : '') +
      `*GST:* ₹${(sale.totalCgst || 0) + (sale.totalSgst || 0) + (sale.totalIgst || 0)}\n` +
      `*Grand Total:* ₹${sale.grandTotal}\n` +
      `*Paid:* ₹${sale.amountReceived || 0}\n` +
      (sale.balanceDue > 0 ? `*Balance Due (Udhar):* ₹${sale.balanceDue}\n` : '') +
      `\nThank you for shopping with us! 🙏`;

    const encoded = encodeURIComponent(message);
    const url = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encoded}` : `https://wa.me/?text=${encoded}`;
    window.open(url, '_blank');
    toast.success('WhatsApp share link opened');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col border border-slate-200">
        
        {/* Modal Header (No Print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-800 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Invoice {sale.invoiceNumber}</h3>
              <p className="text-xs text-slate-500">
                {new Date(sale.invoiceDate).toLocaleString('en-IN')} • Status:{' '}
                <span className={`font-semibold ${sale.paymentStatus === 'PAID' ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {sale.paymentStatus}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Format Toggle */}
            <div className="flex bg-slate-200 p-0.5 rounded-lg text-xs font-semibold">
              <button
                onClick={() => setPrintMode('A4')}
                className={`px-3 py-1.5 rounded-md transition ${printMode === 'A4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                A4 Standard
              </button>
              <button
                onClick={() => setPrintMode('THERMAL')}
                className={`px-3 py-1.5 rounded-md transition ${printMode === 'THERMAL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Thermal (80mm)
              </button>
            </div>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition"
            >
              <Share2 className="w-3.5 h-3.5" />
              WhatsApp
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-xs transition"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100 flex justify-center">
          
          {/* THERMAL 80MM RECEIPT */}
          {printMode === 'THERMAL' && (
            <div className="print-area thermal-receipt bg-white text-black p-4 w-full max-w-[320px] shadow-md border border-slate-300 font-mono text-xs">
              <div className="text-center pb-2 border-b border-dashed border-black">
                <img src="/logo-icon.png" alt="StockMate" className="w-12 h-12 mx-auto mb-1.5 object-contain" />
              </div>

              <div className="py-2 border-b border-dashed border-black text-[11px] leading-tight">
                <div>Invoice: <b>{sale.invoiceNumber}</b></div>
                <div>Date: {new Date(sale.invoiceDate).toLocaleString('en-IN')}</div>
                <div>Cust: {sale.customerName || 'Walk-in'}</div>
                {sale.customerPhone && <div>Phone: {sale.customerPhone}</div>}
              </div>

              <table className="w-full my-2 text-[11px]">
                <thead>
                  <tr className="border-b border-black text-left">
                    <th className="py-1">Item</th>
                    <th className="text-right py-1">Qty</th>
                    <th className="text-right py-1">Rate</th>
                    <th className="text-right py-1">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-dotted border-slate-300">
                      <td className="py-1 pr-1">
                        <div className="font-semibold">{item.productName}</div>
                        <div className="text-[9px] text-slate-600">GST: {item.taxRate}%</div>
                      </td>
                      <td className="text-right align-top py-1">{item.quantity} {item.unit}</td>
                      <td className="text-right align-top py-1">₹{item.unitPrice}</td>
                      <td className="text-right align-top py-1 font-bold">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="border-t border-dashed border-black pt-2 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{sale.subtotal}</span>
                </div>
                {sale.totalDiscount > 0 && (
                  <div className="flex justify-between">
                    <span>Discount:</span>
                    <span>-₹{sale.totalDiscount}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>CGST:</span>
                  <span>₹{sale.totalCgst || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST:</span>
                  <span>₹{sale.totalSgst || 0}</span>
                </div>
                {sale.totalIgst > 0 && (
                  <div className="flex justify-between">
                    <span>IGST:</span>
                    <span>₹{sale.totalIgst}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm border-t border-b border-black py-1 my-1">
                  <span>GRAND TOTAL:</span>
                  <span>₹{sale.grandTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>₹{sale.amountReceived || 0}</span>
                </div>
                {sale.balanceDue > 0 && (
                  <div className="flex justify-between font-bold text-red-600">
                    <span>BALANCE DUE:</span>
                    <span>₹{sale.balanceDue}</span>
                  </div>
                )}
              </div>

              <div className="text-center pt-3 mt-2 border-t border-dashed border-black text-[10px] space-y-1">
                <p>*** THANK YOU! VISIT AGAIN ***</p>
              </div>
            </div>
          )}

          {/* STANDARD A4 TAX INVOICE */}
          {printMode === 'A4' && (
            <div className="print-area a4-invoice bg-white text-slate-800 p-8 w-full max-w-[800px] shadow-md border border-slate-300 font-sans text-xs">
              
              {/* Header Banner */}
              <div className="flex justify-between items-center border-b-2 border-slate-900 pb-4 mb-4">
                <div>
                  <img src="/logo-horizontal.png" alt="StockMate" className="h-14 object-contain" />
                </div>

                <div className="text-right">
                  <div className="inline-block bg-slate-900 text-white font-bold px-3 py-1 rounded text-xs uppercase tracking-wider mb-2">
                    TAX INVOICE
                  </div>
                  <div className="text-sm font-black text-slate-900">{sale.invoiceNumber}</div>
                  <div className="text-xs text-slate-600">Date: {new Date(sale.invoiceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  <div className="text-xs text-slate-600">Time: {new Date(sale.invoiceDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              </div>

              {/* Bill To Info */}
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed To (Customer):</span>
                  <div className="font-bold text-sm text-slate-900 mt-0.5">{sale.customerName || 'Walk-in Customer'}</div>
                  {sale.customerPhone && <div className="text-slate-600">Phone: {sale.customerPhone}</div>}
                  {sale.customerGstin && <div className="text-slate-600 font-medium">GSTIN: {sale.customerGstin}</div>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Details:</span>
                  <div className="font-semibold text-slate-800 mt-0.5">
                    Status: <span className={`uppercase font-bold ${sale.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}`}>{sale.paymentStatus}</span>
                  </div>
                  <div className="text-slate-600">
                    Mode: {(sale.payments || []).map((p) => p.method).join(', ') || 'CASH'}
                  </div>
                  {sale.balanceDue > 0 && (
                    <div className="text-red-600 font-bold mt-1">Outstanding Due: ₹{sale.balanceDue}</div>
                  )}
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-200 text-xs mb-4">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                    <th className="p-2 text-center border-r border-slate-200 w-10">#</th>
                    <th className="p-2 text-left border-r border-slate-200">Item Description</th>
                    <th className="p-2 text-center border-r border-slate-200 w-16">HSN</th>
                    <th className="p-2 text-center border-r border-slate-200 w-16">Qty</th>
                    <th className="p-2 text-right border-r border-slate-200 w-20">Rate</th>
                    <th className="p-2 text-center border-r border-slate-200 w-14">GST %</th>
                    <th className="p-2 text-right border-r border-slate-200 w-20">Taxable</th>
                    <th className="p-2 text-right w-24">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {(sale.items || []).map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-200 hover:bg-slate-50/50">
                      <td className="p-2 text-center border-r border-slate-200 text-slate-500">{idx + 1}</td>
                      <td className="p-2 border-r border-slate-200">
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[10px] text-slate-500">SKU: {item.sku}</div>
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 text-slate-600">{item.hsnCode || '-'}</td>
                      <td className="p-2 text-center border-r border-slate-200 font-medium">{item.quantity} {item.unit}</td>
                      <td className="p-2 text-right border-r border-slate-200">₹{item.unitPrice}</td>
                      <td className="p-2 text-center border-r border-slate-200 font-medium">{item.taxRate}%</td>
                      <td className="p-2 text-right border-r border-slate-200 text-slate-600">₹{item.taxableAmount}</td>
                      <td className="p-2 text-right font-bold text-slate-900">₹{item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals & Tax Calculation Breakdown */}
              <div className="grid grid-cols-2 gap-4 items-start mb-6">
                
                {/* Notes & Terms */}
                <div className="text-[11px] space-y-3">
                  {settings.footerNotes && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[10px] whitespace-pre-line leading-relaxed">
                      <b className="text-slate-800 block mb-1">Terms & Conditions:</b>
                      {settings.footerNotes}
                    </div>
                  )}
                </div>

                {/* Amount Summary */}
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600">
                    <span>Taxable Value:</span>
                    <span>₹{sale.taxableTotal || sale.subtotal}</span>
                  </div>

                  {sale.totalDiscount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-medium">
                      <span>Discount:</span>
                      <span>-₹{sale.totalDiscount}</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span>CGST:</span>
                    <span>₹{sale.totalCgst || 0}</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>SGST:</span>
                    <span>₹{sale.totalSgst || 0}</span>
                  </div>

                  {sale.totalIgst > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>IGST:</span>
                      <span>₹{sale.totalIgst}</span>
                    </div>
                  )}

                  <div className="flex justify-between font-black text-sm text-slate-900 border-t-2 border-slate-900 pt-2 my-1">
                    <span>GRAND TOTAL:</span>
                    <span>₹{sale.grandTotal}</span>
                  </div>

                  <div className="flex justify-between text-slate-700 font-medium">
                    <span>Amount Received:</span>
                    <span>₹{sale.amountReceived || 0}</span>
                  </div>

                  {sale.balanceDue > 0 ? (
                    <div className="flex justify-between font-bold text-red-600 border-t border-slate-200 pt-1">
                      <span>Balance Due (Udhar):</span>
                      <span>₹{sale.balanceDue}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-end gap-1 text-emerald-700 font-bold text-xs pt-1">
                      <CheckCircle2 className="w-4 h-4" /> Fully Paid
                    </div>
                  )}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 pt-6 border-t border-slate-300 text-xs">
                <div className="text-slate-500">
                  Customer Signature
                </div>
                <div className="text-right">
                  <div className="h-12"></div>
                  <p className="font-bold text-slate-800">Authorized Signatory</p>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
};
