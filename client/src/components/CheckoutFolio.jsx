import React, { useState, useEffect } from 'react';
import {
  Receipt,
  BedDouble,
  User,
  Calendar,
  CreditCard,
  QrCode,
  DollarSign,
  UtensilsCrossed,
  Sparkles,
  Percent,
  CheckCircle2,
  AlertCircle,
  FileText,
  Printer,
  ChevronDown,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate, formatDateTime } from '../utils';

export default function CheckoutFolio({
  rooms,
  settings,
  preselectedBookingId,
  onCheckoutSuccess
}) {
  const currency = settings?.currency_symbol || '₹';
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied' && r.current_booking_id);

  const [selectedBookingId, setSelectedBookingId] = useState(
    preselectedBookingId || occupiedRooms[0]?.current_booking_id || ''
  );

  const [folioData, setFolioData] = useState(null);
  const [loadingFolio, setLoadingFolio] = useState(false);
  const [error, setError] = useState('');

  // Discount & Payment inputs
  const [discountType, setDiscountType] = useState('percent'); // 'percent' or 'amount'
  const [discountValue, setDiscountValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('upi_qr');
  const [paymentRef, setPaymentRef] = useState('');
  const [cashGiven, setCashGiven] = useState('');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (preselectedBookingId) {
      setSelectedBookingId(preselectedBookingId);
    } else if (!selectedBookingId && occupiedRooms.length > 0) {
      setSelectedBookingId(occupiedRooms[0].current_booking_id);
    }
  }, [preselectedBookingId, occupiedRooms]);

  // Fetch live folio
  useEffect(() => {
    if (!selectedBookingId) {
      setFolioData(null);
      return;
    }

    async function loadFolio() {
      try {
        setLoadingFolio(true);
        setError('');
        const res = await fetch(`/api/bookings/${selectedBookingId}/folio`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to calculate folio');
        setFolioData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingFolio(false);
      }
    }

    loadFolio();
  }, [selectedBookingId]);

  if (occupiedRooms.length === 0) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-2xl">
        <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-white">No In-House Guests Currently</h2>
        <p className="text-sm text-slate-400 mt-2">
          All rooms are currently vacant or in housekeeping. Check in a guest from the Rooms tab or Dashboard to begin billing.
        </p>
      </div>
    );
  }

  // Real-time calculations with discount
  const rawSubtotal = folioData?.subtotal || 0;
  let finalDiscount = 0;
  if (discountType === 'percent') {
    finalDiscount = Math.round((rawSubtotal * ((Number(discountValue) || 0) / 100)) * 100) / 100;
  } else {
    finalDiscount = Number(discountValue) || 0;
  }
  const taxableAmount = Math.max(0, rawSubtotal - finalDiscount);

  const cgstRate = settings?.default_cgst_rate || 6.0;
  const sgstRate = settings?.default_sgst_rate || 6.0;
  const cgstAmount = Math.round((taxableAmount * (cgstRate / 100)) * 100) / 100;
  const sgstAmount = Math.round((taxableAmount * (sgstRate / 100)) * 100) / 100;
  const calculatedGrandTotal = Math.round((taxableAmount + cgstAmount + sgstAmount) * 100) / 100;
  const advancePaid = folioData?.advancePaid || 0;
  const balancePayable = Math.max(0, Math.round((calculatedGrandTotal - advancePaid) * 100) / 100);

  // Cash change calculation
  const cashGivenNum = Number(cashGiven) || 0;
  const changeToReturn = cashGivenNum > balancePayable ? Math.round((cashGivenNum - balancePayable) * 100) / 100 : 0;

  async function handleCompleteCheckout() {
    if (!selectedBookingId) return;

    setCheckingOut(true);
    try {
      const res = await fetch(`/api/bookings/${selectedBookingId}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          discount_percent: discountType === 'percent' ? Number(discountValue) : 0,
          discount_amount: finalDiscount,
          payment_method: paymentMethod,
          payment_reference: paymentRef || (paymentMethod === 'upi_qr' ? 'UPI-APP-' + Date.now().toString().slice(-6) : ''),
          notes: checkoutNotes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Checkout failed');

      onCheckoutSuccess(data.invoice);
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setCheckingOut(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Room Picker */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-400" />
              Smart Checkout & Guest Folio Billing
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Automated night count, dining orders consolidation, GST calculation & printable tax invoices.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Select Guest / Room:</span>
            <select
              value={selectedBookingId}
              onChange={(e) => setSelectedBookingId(e.target.value)}
              className="px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold text-white focus:outline-none focus:border-amber-400"
            >
              {occupiedRooms.map((r) => (
                <option key={r.current_booking_id} value={r.current_booking_id}>
                  Room #{r.room_number} - {r.current_guest_name} ({r.room_type})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loadingFolio ? (
        <div className="text-center py-16 text-slate-400 text-sm">
          Calculating running guest bill & stay charges...
        </div>
      ) : error ? (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
          {error}
        </div>
      ) : folioData ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Itemized Folio Charges */}
          <div className="lg:col-span-2 space-y-6">
            {/* Guest & Stay Profile Bar */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Guest Name
                </span>
                <span className="font-bold text-white text-sm">
                  {folioData.booking.guest_name}
                </span>
                <span className="text-xs text-slate-400 block font-mono">
                  {folioData.booking.guest_phone}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Room Assigned
                </span>
                <span className="font-bold text-amber-400 text-sm font-mono">
                  Room #{folioData.booking.room_number}
                </span>
                <span className="text-xs text-slate-400 block">
                  {folioData.booking.room_type}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Check-In Details
                </span>
                <span className="font-semibold text-slate-200 text-xs">
                  {formatDate(folioData.booking.check_in_date)}
                </span>
                <span className="text-[11px] text-slate-400 block">
                  Nights: <strong className="text-amber-400">{folioData.nightsStayed} Night(s)</strong>
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">
                  Advance Paid
                </span>
                <span className="font-bold text-emerald-400 text-sm font-mono">
                  {formatCurrency(folioData.advancePaid, currency)}
                </span>
                <span className="text-[11px] text-slate-400 block">Deposit on record</span>
              </div>
            </div>

            {/* Folio Breakdown Tables */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="font-bold text-base text-white flex items-center gap-2 pb-3 border-b border-slate-800">
                <FileText className="w-5 h-5 text-amber-400" />
                Itemized Folio Breakdown
              </h3>

              {/* 1. Room Tariff Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>1. Accommodation & Room Tariff</span>
                  <span>Charges</span>
                </div>
                <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-white">
                      {folioData.booking.room_type} (Room #{folioData.booking.room_number})
                    </p>
                    <p className="text-slate-400 text-[11px]">
                      {folioData.nightsStayed} night(s) stayed × {formatCurrency(folioData.booking.room_rate_per_night, currency)}/night
                    </p>
                  </div>
                  <span className="font-mono font-bold text-sm text-white">
                    {formatCurrency(folioData.roomChargesTotal, currency)}
                  </span>
                </div>
              </div>

              {/* 2. Dining & Room Service Orders */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>2. Room Service & Food Orders</span>
                  <span>{formatCurrency(folioData.foodAndDiningTotal, currency)}</span>
                </div>

                {folioData.orders && folioData.orders.filter(o => o.order_type === 'room_service' || o.order_type === 'restaurant_dine_in').length > 0 ? (
                  <div className="space-y-2">
                    {folioData.orders
                      .filter(o => o.order_type === 'room_service' || o.order_type === 'restaurant_dine_in')
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-amber-400">{ord.id}</span>
                              <span className="text-[10px] text-slate-400">{formatDateTime(ord.created_at)}</span>
                            </div>
                            <p className="text-slate-300 mt-1">
                              {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-white whitespace-nowrap ml-4">
                            {formatCurrency(ord.total_amount, currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded-lg">
                    No dining or room service charges on this folio.
                  </p>
                )}
              </div>

              {/* 3. Laundry & Other Amenities */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  <span>3. Laundry & Extra Hotel Services</span>
                  <span>{formatCurrency(folioData.otherServicesTotal, currency)}</span>
                </div>

                {folioData.orders && folioData.orders.filter(o => o.order_type === 'laundry' || o.order_type === 'amenities').length > 0 ? (
                  <div className="space-y-2">
                    {folioData.orders
                      .filter(o => o.order_type === 'laundry' || o.order_type === 'amenities')
                      .map((ord) => (
                        <div
                          key={ord.id}
                          className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start justify-between text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-sky-400">{ord.id}</span>
                              <span className="text-[10px] text-slate-400">{formatDateTime(ord.created_at)}</span>
                            </div>
                            <p className="text-slate-300 mt-1">
                              {ord.items.map((i) => `${i.name} (×${i.quantity})`).join(', ')}
                            </p>
                          </div>
                          <span className="font-mono font-bold text-white whitespace-nowrap ml-4">
                            {formatCurrency(ord.total_amount, currency)}
                          </span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic p-2 bg-slate-950/40 rounded-lg">
                    No extra service or laundry charges.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Settlement, Taxes & Payment Panel */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-5 h-fit sticky top-24">
            <h3 className="font-bold text-base text-white pb-3 border-b border-slate-800 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" />
              Bill Settlement & Tax Engine
            </h3>

            {/* Discount Form */}
            <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Apply Discount</span>
                <div className="flex gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setDiscountType('percent')}
                    className={`px-2 py-0.5 rounded ${
                      discountType === 'percent' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    %
                  </button>
                  <button
                    type="button"
                    onClick={() => setDiscountType('amount')}
                    className={`px-2 py-0.5 rounded ${
                      discountType === 'amount' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {currency}
                  </button>
                </div>
              </div>

              <input
                type="number"
                min="0"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percent' ? 'Enter % (e.g. 5)' : 'Enter Flat Amount'}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
              />
              {finalDiscount > 0 && (
                <p className="text-[11px] text-emerald-400 text-right">
                  - {formatCurrency(finalDiscount, currency)} Discount
                </p>
              )}
            </div>

            {/* Financial Summary */}
            <div className="space-y-2 text-xs border-b border-slate-800 pb-4">
              <div className="flex justify-between text-slate-400">
                <span>Gross Subtotal:</span>
                <span className="font-mono text-slate-200">{formatCurrency(rawSubtotal, currency)}</span>
              </div>

              {finalDiscount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount Applied:</span>
                  <span className="font-mono">- {formatCurrency(finalDiscount, currency)}</span>
                </div>
              )}

              <div className="flex justify-between text-slate-400">
                <span>Taxable Value:</span>
                <span className="font-mono text-slate-200">{formatCurrency(taxableAmount, currency)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>CGST ({cgstRate}%):</span>
                <span className="font-mono text-slate-200">{formatCurrency(cgstAmount, currency)}</span>
              </div>

              <div className="flex justify-between text-slate-400">
                <span>SGST ({sgstRate}%):</span>
                <span className="font-mono text-slate-200">{formatCurrency(sgstAmount, currency)}</span>
              </div>

              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Grand Total:</span>
                <span className="font-mono text-white">{formatCurrency(calculatedGrandTotal, currency)}</span>
              </div>

              <div className="flex justify-between text-xs text-slate-400">
                <span>Less: Advance Deposit:</span>
                <span className="font-mono text-emerald-400">- {formatCurrency(advancePaid, currency)}</span>
              </div>
            </div>

            {/* Net Balance Payable Callout */}
            <div className="p-4 bg-gradient-to-tr from-emerald-950/60 to-slate-950 border border-emerald-500/40 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Net Balance Payable
                </span>
                <span className="text-xl font-black font-mono text-emerald-400">
                  {formatCurrency(balancePayable, currency)}
                </span>
              </div>
            </div>

            {/* Payment Method Selector */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Payment Mode:
              </label>
              <div className="grid grid-cols-3 gap-1.5 text-xs">
                {[
                  { id: 'upi_qr', label: 'UPI / QR' },
                  { id: 'card', label: 'Card POS' },
                  { id: 'cash', label: 'Cash' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPaymentMethod(m.id)}
                    className={`py-2 px-2 text-center rounded-lg font-semibold transition border ${
                      paymentMethod === m.id
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Dynamic Payment UI */}
              {paymentMethod === 'upi_qr' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-semibold">
                    <QrCode className="w-4 h-4" />
                    <span>Scan & Pay via any UPI App</span>
                  </div>

                  {/* Clean SVG QR Code */}
                  <div className="inline-block p-2 bg-white rounded-lg shadow-md mx-auto">
                    <svg viewBox="0 0 100 100" className="w-32 h-32">
                      {/* Stylized QR Matrix Pattern */}
                      <rect x="0" y="0" width="100" height="100" fill="white" />
                      {/* Top Left Marker */}
                      <rect x="10" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="14" y="14" width="17" height="17" fill="white" />
                      <rect x="18" y="18" width="9" height="9" fill="#0f172a" />
                      {/* Top Right Marker */}
                      <rect x="65" y="10" width="25" height="25" fill="#0f172a" />
                      <rect x="69" y="14" width="17" height="17" fill="white" />
                      <rect x="73" y="18" width="9" height="9" fill="#0f172a" />
                      {/* Bottom Left Marker */}
                      <rect x="10" y="65" width="25" height="25" fill="#0f172a" />
                      <rect x="14" y="69" width="17" height="17" fill="white" />
                      <rect x="18" y="73" width="9" height="9" fill="#0f172a" />
                      {/* Center Dots */}
                      <rect x="42" y="12" width="6" height="6" fill="#0f172a" />
                      <rect x="52" y="18" width="6" height="6" fill="#0f172a" />
                      <rect x="42" y="42" width="16" height="16" fill="#d97706" rx="2" />
                      <rect x="12" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="24" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="65" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="78" y="45" width="6" height="6" fill="#0f172a" />
                      <rect x="45" y="68" width="6" height="6" fill="#0f172a" />
                      <rect x="55" y="78" width="6" height="6" fill="#0f172a" />
                      <rect x="70" y="68" width="8" height="8" fill="#0f172a" />
                      <rect x="82" y="80" width="6" height="6" fill="#0f172a" />
                    </svg>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    UPI ID: grandaurelia@icici
                  </p>
                  <p className="text-xs font-bold text-emerald-400 font-mono">
                    Amount: {formatCurrency(balancePayable, currency)}
                  </p>
                </div>
              )}

              {paymentMethod === 'cash' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Cash Tendered by Guest ({currency}):</label>
                    <input
                      type="number"
                      value={cashGiven}
                      onChange={(e) => setCashGiven(e.target.value)}
                      placeholder={String(balancePayable)}
                      className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  {cashGivenNum > 0 && (
                    <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-slate-800">
                      <span className="text-slate-400">Change to Return:</span>
                      <span className="font-mono text-emerald-400 font-bold">
                        {formatCurrency(changeToReturn, currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                  <label className="text-slate-400 block mb-1">Card Approval / Transaction Ref:</label>
                  <input
                    type="text"
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    placeholder="e.g. POS-AUTH-882103"
                    className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}
            </div>

            {/* Check-Out & Generate Invoice Button */}
            <button
              onClick={handleCompleteCheckout}
              disabled={checkingOut}
              className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-sm rounded-xl shadow-xl shadow-emerald-500/25 transition disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>
                {checkingOut ? 'Generating Invoice...' : 'Settle Bill & Print Tax Invoice'}
              </span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
