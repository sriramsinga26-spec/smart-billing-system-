import React, { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  DollarSign,
  Calendar,
  Filter,
  ArrowDownToLine,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { formatCurrency, formatDateTime, formatDate } from '../utils';

export default function InvoiceArchive({
  settings,
  onSelectInvoiceToView
}) {
  const currency = settings?.currency_symbol || '₹';
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('all');

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true);
        const res = await fetch('/api/invoices');
        const data = await res.json();
        setInvoices(data);
      } catch (err) {
        console.error('Failed to fetch invoices:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter((inv) => {
    if (paymentFilter !== 'all' && inv.payment_method !== paymentFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = inv.invoice_number?.toLowerCase().includes(q);
      const matchGuest = inv.guest_name?.toLowerCase().includes(q);
      const matchRoom = inv.room_number?.toLowerCase().includes(q);
      return matchNo || matchGuest || matchRoom;
    }
    return true;
  });

  const totalCollected = filteredInvoices.reduce((sum, inv) => sum + (inv.grand_total || 0), 0);
  const avgBill = filteredInvoices.length > 0 ? Math.round(totalCollected / filteredInvoices.length) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Stats Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-amber-400" />
              Tax Invoice History & Audit Archive
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Comprehensive record of all settled bills, room folios, GST accounts, and reprints.
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">Total Billed:</span>{' '}
              <strong className="text-emerald-400 font-mono text-sm">{formatCurrency(totalCollected, currency)}</strong>
            </div>
            <div className="bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800">
              <span className="text-slate-400">Avg Bill:</span>{' '}
              <strong className="text-amber-400 font-mono text-sm">{formatCurrency(avgBill, currency)}</strong>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-800">
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Invoice # (e.g. INV-2026-0001), guest name, or room..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Payment Methods</option>
              <option value="upi_qr">UPI / QR Code</option>
              <option value="card">Card POS</option>
              <option value="cash">Cash Settlement</option>
            </select>
          </div>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-slate-400 text-sm">
            Loading invoice archive...
          </div>
        ) : filteredInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice No</th>
                  <th className="py-3 px-4 font-semibold">Guest Particulars</th>
                  <th className="py-3 px-4 font-semibold">Room & Duration</th>
                  <th className="py-3 px-4 font-semibold">Bill Date</th>
                  <th className="py-3 px-4 font-semibold">Subtotal</th>
                  <th className="py-3 px-4 font-semibold">Taxes (GST)</th>
                  <th className="py-3 px-4 font-semibold">Grand Total</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400 whitespace-nowrap">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-white">{inv.guest_name}</p>
                      {inv.guest_phone && (
                        <p className="text-[11px] text-slate-400 font-mono">{inv.guest_phone}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-mono font-semibold text-slate-200">
                        Room #{inv.room_number}
                      </span>
                      <p className="text-[10px] text-slate-400">{inv.total_nights} Night(s) Stay</p>
                    </td>
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      {formatDate(inv.bill_date)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {formatCurrency(inv.subtotal, currency)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {formatCurrency((inv.cgst_amount || 0) + (inv.sgst_amount || 0), currency)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm whitespace-nowrap">
                      {formatCurrency(inv.grand_total, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onSelectInvoiceToView(inv.id)}
                        className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-semibold text-xs transition inline-flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            No matching invoices found in history.
          </div>
        )}
      </div>
    </div>
  );
}
