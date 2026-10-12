import React from 'react';
import {
  BedDouble,
  DollarSign,
  Users,
  UtensilsCrossed,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
  Clock,
  Printer,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatDateTime } from '../utils';

export default function Dashboard({
  dashboardStats,
  rooms,
  settings,
  setActiveTab,
  onOpenCheckIn,
  onSelectRoomForFolio,
  onSelectInvoiceToView,
  onUpdateRoomStatus
}) {
  const roomsData = dashboardStats?.rooms || {};
  const financials = dashboardStats?.financials || {};
  const currency = settings?.currency_symbol || '₹';

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 md:p-8 border border-slate-700/60 shadow-xl">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              Front Desk & Operations Command
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Welcome to {settings?.hotel_name || 'The Grand Aurelia'}
            </h1>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Live guest folios, real-time room occupancy, dining POS, and automated GST billing engine.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenCheckIn}
              className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <span>+ New Guest Check-In</span>
            </button>
            <button
              onClick={() => setActiveTab('pos')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-sm rounded-xl border border-slate-600/60 transition-all flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4 text-amber-400" />
              <span>Room Service / POS</span>
            </button>
            <button
              onClick={() => setActiveTab('checkout')}
              className="px-4 py-2.5 bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl border border-emerald-500/60 transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/30"
            >
              <span>Instant Checkout & Bill</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Revenue */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Total Settled Revenue</span>
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {formatCurrency(financials.totalRevenue, currency)}
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-medium">{financials.invoicesCount || 0} Invoices</span> generated & paid
            </p>
          </div>
        </div>

        {/* Card 2: Occupancy Rate */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Room Occupancy</span>
            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <BedDouble className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {roomsData.occupancyRate || 0}%
              </h3>
              <span className="text-xs text-slate-400">({roomsData.occupied || 0} / {roomsData.total || 0} Occupied)</span>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${roomsData.occupancyRate || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Card 3: Active Stays */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Active In-House Guests</span>
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-2xl font-bold text-white tracking-tight">
              {financials.activeBookings || 0} Guests
            </h3>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
              <span className="text-emerald-400 font-semibold">{roomsData.available || 0} rooms</span> ready for check-in
            </p>
          </div>
        </div>

        {/* Card 4: Housekeeping & Status */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Room Status Overview</span>
            <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2 text-xs">
            <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg text-emerald-300">
              <span className="font-bold">{roomsData.available || 0}</span> Available
            </div>
            <div className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg text-amber-300">
              <span className="font-bold">{roomsData.cleaning || 0}</span> Cleaning
            </div>
            <div className="bg-sky-500/10 border border-sky-500/20 px-2.5 py-1.5 rounded-lg text-sky-300">
              <span className="font-bold">{roomsData.reserved || 0}</span> Reserved
            </div>
          </div>
        </div>
      </div>

      {/* Live Room Matrix Quick Peek */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-amber-400" />
              Live Room Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Click any room to view folio, add room service, change status or check-in.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('rooms')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
          >
            <span>View Full Room Manager</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
          {rooms.map((room) => {
            const isOccupied = room.status === 'occupied';
            const isAvailable = room.status === 'available';
            const isCleaning = room.status === 'cleaning';
            const isReserved = room.status === 'reserved';

            let statusBg = 'bg-slate-800/80 border-slate-700/60';
            let statusBadge = 'bg-slate-700 text-slate-300';
            if (isOccupied) {
              statusBg = 'bg-rose-950/30 border-rose-800/40 hover:border-rose-600/70';
              statusBadge = 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
            } else if (isAvailable) {
              statusBg = 'bg-emerald-950/30 border-emerald-800/40 hover:border-emerald-600/70';
              statusBadge = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
            } else if (isCleaning) {
              statusBg = 'bg-amber-950/30 border-amber-800/40 hover:border-amber-600/70';
              statusBadge = 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
            } else if (isReserved) {
              statusBg = 'bg-sky-950/30 border-sky-800/40 hover:border-sky-600/70';
              statusBadge = 'bg-sky-500/20 text-sky-300 border border-sky-500/30';
            }

            return (
              <div
                key={room.id}
                onClick={() => {
                  if (isOccupied && room.current_booking_id) {
                    onSelectRoomForFolio(room.current_booking_id);
                  } else if (isAvailable) {
                    onOpenCheckIn(room.id);
                  } else if (isCleaning) {
                    onUpdateRoomStatus(room.id, 'available');
                  }
                }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none group relative ${statusBg}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-base font-black text-white group-hover:text-amber-400 transition font-mono">
                    #{room.room_number}
                  </span>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize ${statusBadge}`}>
                    {room.status}
                  </span>
                </div>

                <p className="text-xs font-medium text-slate-300 truncate">
                  {room.room_type}
                </p>

                <div className="mt-2 text-xs text-slate-400">
                  {isOccupied ? (
                    <div>
                      <p className="text-rose-200 font-semibold truncate flex items-center gap-1">
                        <Users className="w-3 h-3 text-rose-400 shrink-0" />
                        {room.current_guest_name}
                      </p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click for Folio</p>
                    </div>
                  ) : isAvailable ? (
                    <div>
                      <span className="text-emerald-400 font-semibold">{formatCurrency(room.rate_per_night, currency)}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">Click to Check-in</p>
                    </div>
                  ) : isCleaning ? (
                    <div>
                      <span className="text-amber-300 text-[11px]">Housekeeping</span>
                      <p className="text-[10px] text-amber-400/80 mt-0.5">Click to Mark Clean</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sky-300 text-[11px]">Reserved</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Settled Invoices Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Printer className="w-5 h-5 text-amber-400" />
              Recent Settled Invoices
            </h2>
            <p className="text-xs text-slate-400">Official tax invoices generated at checkout</p>
          </div>
          <button
            onClick={() => setActiveTab('invoices')}
            className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition"
          >
            <span>View All Invoices</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {dashboardStats?.recentInvoices && dashboardStats.recentInvoices.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4 font-semibold">Invoice No</th>
                  <th className="py-3 px-4 font-semibold">Guest</th>
                  <th className="py-3 px-4 font-semibold">Room</th>
                  <th className="py-3 px-4 font-semibold">Date & Time</th>
                  <th className="py-3 px-4 font-semibold">Grand Total</th>
                  <th className="py-3 px-4 font-semibold">Payment</th>
                  <th className="py-3 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {dashboardStats.recentInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3 px-4 font-medium text-white">
                      {inv.guest_name}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      Room #{inv.room_number}
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      {formatDateTime(inv.bill_date)}
                    </td>
                    <td className="py-3 px-4 font-bold text-emerald-400">
                      {formatCurrency(inv.grand_total, currency)}
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                        {inv.payment_method}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectInvoiceToView(inv.id)}
                        className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-md font-medium text-xs transition inline-flex items-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print Bill</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 text-xs">
            No invoices generated yet.
          </div>
        )}
      </div>
    </div>
  );
}
