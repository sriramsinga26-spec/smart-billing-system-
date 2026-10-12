import React from 'react';
import {
  X,
  Printer,
  Building2,
  CheckCircle2,
  QrCode,
  Download,
  Share2
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate, numberToWords } from '../utils';

export default function PrintInvoiceModal({
  isOpen,
  onClose,
  invoice,
  settings
}) {
  if (!isOpen || !invoice) return null;

  const currency = settings?.currency_symbol || '₹';

  function handlePrint() {
    window.print();
  }

  const items = invoice.itemsBreakdown || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Outer Modal Container */}
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full shadow-2xl relative my-6 flex flex-col max-h-[95vh]">
        {/* Modal Action Header (Hidden in print) */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between print-hide bg-slate-950/70 rounded-t-2xl">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
            <span className="font-bold text-white text-sm">
              Official Tax Invoice Preview — {invoice.invoice_number}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4 stroke-[2.5]" />
              <span>Print Invoice / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Printable Invoice Content */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-slate-900 text-slate-900 flex justify-center">
          {/* Authentic Paper Invoice Layout */}
          <div className="printable-invoice-container bg-white text-slate-900 w-full max-w-3xl p-8 sm:p-10 rounded-xl shadow-2xl border border-slate-200">
            {/* Top Hotel Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between border-b-2 border-slate-900 pb-6 gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 uppercase">
                      {settings?.hotel_name || 'THE GRAND AURELIA HOTEL'}
                    </h1>
                    <p className="text-xs font-semibold text-amber-700 tracking-wider">
                      {settings?.tagline || 'LUXURY STAYS & FINE HOSPITALITY'}
                    </p>
                  </div>
                </div>
                <div className="text-xs text-slate-600 mt-2 space-y-0.5">
                  <p>{settings?.address}</p>
                  <p>
                    <strong>Phone:</strong> {settings?.phone} | <strong>Email:</strong> {settings?.email}
                  </p>
                  {settings?.gstin && (
                    <p className="font-semibold text-slate-800">
                      <strong>GSTIN / Tax ID:</strong> {settings.gstin}
                    </p>
                  )}
                </div>
              </div>

              {/* Invoice Title & Number */}
              <div className="text-right sm:self-start">
                <span className="inline-block px-3 py-1 bg-slate-900 text-amber-400 text-xs font-black uppercase tracking-widest rounded">
                  TAX INVOICE
                </span>
                <p className="font-mono text-base font-bold text-slate-900 mt-2">
                  #{invoice.invoice_number}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Date: {formatDate(invoice.bill_date)}
                </p>
                <p className="text-[10px] text-slate-500">
                  Desk: Front Desk 01
                </p>
              </div>
            </div>

            {/* Guest & Stay Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-200 text-xs">
              {/* Billed To */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 mb-1">
                  Billed To (Guest Details)
                </p>
                <p className="text-sm font-bold text-slate-900">{invoice.guest_name}</p>
                {invoice.guest_phone && (
                  <p className="text-slate-600 font-mono">Mobile: {invoice.guest_phone}</p>
                )}
                {invoice.guest_email && (
                  <p className="text-slate-600">Email: {invoice.guest_email}</p>
                )}
                {invoice.guest_id_info && (
                  <p className="text-slate-600 font-mono">ID Proof: {invoice.guest_id_info}</p>
                )}
              </div>

              {/* Stay Particulars */}
              <div className="space-y-1 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px] text-slate-500 mb-1">
                  Stay Particulars
                </p>
                <div className="flex justify-between">
                  <span className="text-slate-600">Room Number:</span>
                  <span className="font-bold font-mono text-slate-900">Room #{invoice.room_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Room Category:</span>
                  <span className="font-semibold text-slate-900">{invoice.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Arrival / Check-in:</span>
                  <span className="font-mono text-slate-900">{formatDate(invoice.check_in_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Departure / Checkout:</span>
                  <span className="font-mono text-slate-900">{formatDate(invoice.check_out_date)}</span>
                </div>
                <div className="flex justify-between text-slate-900 font-bold pt-1 border-t border-slate-200">
                  <span>Total Nights:</span>
                  <span>{invoice.total_nights} Night(s)</span>
                </div>
              </div>
            </div>

            {/* Itemized Charges Table */}
            <div className="py-6 border-b border-slate-200">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-slate-900 font-bold uppercase tracking-wider">
                    <th className="py-2.5 px-2 w-10">#</th>
                    <th className="py-2.5 px-2">Description of Services / Supplies</th>
                    <th className="py-2.5 px-2">Category</th>
                    <th className="py-2.5 px-2 text-right">Amount ({currency})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2.5 px-2 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="py-2.5 px-2 font-medium">{item.description}</td>
                      <td className="py-2.5 px-2 text-slate-500 text-[11px]">{item.category}</td>
                      <td className="py-2.5 px-2 text-right font-mono font-bold">
                        {formatCurrency(item.amount, '')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation Totals & Tax Table */}
            <div className="py-4 border-b border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs">
              {/* Left notes & In Words */}
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-bold text-slate-500 uppercase">Amount in Words:</p>
                  <p className="font-semibold text-slate-900 italic mt-0.5">
                    {numberToWords(invoice.grand_total)}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-[11px] font-bold text-slate-700 uppercase">Payment Settlement:</p>
                  <div className="flex justify-between text-slate-700 mt-1">
                    <span>Payment Mode:</span>
                    <span className="font-bold uppercase font-mono">{invoice.payment_method}</span>
                  </div>
                  {invoice.payment_reference && (
                    <div className="flex justify-between text-slate-700">
                      <span>Ref / Transaction ID:</span>
                      <span className="font-mono text-[11px]">{invoice.payment_reference}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-emerald-700 font-bold mt-1 pt-1 border-t border-slate-200">
                    <span>Status:</span>
                    <span>PAID IN FULL</span>
                  </div>
                </div>
              </div>

              {/* Right Totals Breakdown */}
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-semibold">{formatCurrency(invoice.subtotal, currency)}</span>
                </div>

                {invoice.discount_amount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-semibold">
                    <span>Discount:</span>
                    <span className="font-mono">- {formatCurrency(invoice.discount_amount, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-700 font-semibold pt-1 border-t border-slate-100">
                  <span>Taxable Value:</span>
                  <span className="font-mono">{formatCurrency(invoice.taxable_amount, currency)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>CGST ({invoice.cgst_percent}%):</span>
                  <span className="font-mono">{formatCurrency(invoice.cgst_amount, currency)}</span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>SGST ({invoice.sgst_percent}%):</span>
                  <span className="font-mono">{formatCurrency(invoice.sgst_amount, currency)}</span>
                </div>

                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t-2 border-slate-900">
                  <span>Grand Total:</span>
                  <span className="font-mono">{formatCurrency(invoice.grand_total, currency)}</span>
                </div>

                {invoice.advance_paid > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Less Advance Received:</span>
                    <span className="font-mono">- {formatCurrency(invoice.advance_paid, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Net Amount Paid:</span>
                  <span className="font-mono">{formatCurrency(invoice.balance_payable, currency)}</span>
                </div>
              </div>
            </div>

            {/* Terms & Signatures */}
            <div className="pt-6 grid grid-cols-2 gap-6 items-end text-xs">
              <div>
                <p className="font-bold text-slate-700 uppercase text-[10px] tracking-wider mb-1">
                  Terms & Conditions
                </p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {settings?.invoice_terms || 'Thank you for choosing us. We hope you enjoyed your stay. Standard check-out time is 11:00 AM.'}
                </p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="p-1 bg-slate-100 border border-slate-200 rounded">
                    <QrCode className="w-10 h-10 text-slate-800" />
                  </div>
                  <div className="text-[9px] text-slate-500">
                    <p className="font-bold text-slate-700">Digital Tax Receipt</p>
                    <p>Scan to verify authenticity</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="inline-block border-t border-slate-900 pt-2 px-8 text-center">
                  <p className="font-bold text-slate-900 text-xs">Authorized Signatory</p>
                  <p className="text-[10px] text-slate-500">Front Desk / Accounts Dept</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
