import React, { useState } from 'react';
import {
  BedDouble,
  Users,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Plus,
  Receipt,
  UtensilsCrossed,
  Sparkles,
  Phone,
  Calendar,
  Layers
} from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';

export default function RoomsGrid({
  rooms,
  settings,
  onOpenCheckIn,
  onSelectRoomForFolio,
  onOpenPOSForRoom,
  onUpdateRoomStatus,
  onOpenAddRoom
}) {
  const [selectedFloor, setSelectedFloor] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const currency = settings?.currency_symbol || '₹';

  // Filter logic
  const filteredRooms = rooms.filter((r) => {
    if (selectedFloor !== 'all' && String(r.floor) !== selectedFloor) return false;
    if (selectedStatus !== 'all' && r.status !== selectedStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRoom = r.room_number.toLowerCase().includes(q);
      const matchType = r.room_type.toLowerCase().includes(q);
      const matchGuest = r.current_guest_name?.toLowerCase().includes(q);
      return matchRoom || matchType || matchGuest;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <BedDouble className="w-6 h-6 text-amber-400" />
              Room Management & Front Desk Grid
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time room occupancy, status toggles, guest folios, and instant check-ins.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenCheckIn}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-amber-500/20 transition flex items-center gap-1.5"
            >
              <span>+ Check-In Guest</span>
            </button>
            <button
              onClick={onOpenAddRoom}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-medium text-xs sm:text-sm transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80">
          {/* Search box */}
          <div className="relative col-span-1 sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by room #, type, or guest name..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/80"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/80"
            >
              <option value="all">All Room Statuses</option>
              <option value="available">Available (Vacant)</option>
              <option value="occupied">Occupied (In-house)</option>
              <option value="cleaning">Cleaning (Housekeeping)</option>
              <option value="reserved">Reserved</option>
            </select>
          </div>

          {/* Floor Filter */}
          <div>
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs sm:text-sm text-white focus:outline-none focus:border-amber-400/80"
            >
              <option value="all">All Floors</option>
              <option value="1">Floor 1</option>
              <option value="2">Floor 2</option>
              <option value="3">Floor 3 (Penthouse)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Room Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRooms.map((room) => {
          const isOccupied = room.status === 'occupied';
          const isAvailable = room.status === 'available';
          const isCleaning = room.status === 'cleaning';
          const isReserved = room.status === 'reserved';

          let cardBorder = 'border-slate-800';
          let statusBadge = 'bg-slate-800 text-slate-300';
          if (isOccupied) {
            cardBorder = 'border-rose-800/50 bg-gradient-to-b from-slate-900 to-rose-950/20';
            statusBadge = 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
          } else if (isAvailable) {
            cardBorder = 'border-emerald-800/50 bg-gradient-to-b from-slate-900 to-emerald-950/20';
            statusBadge = 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
          } else if (isCleaning) {
            cardBorder = 'border-amber-800/50 bg-gradient-to-b from-slate-900 to-amber-950/20';
            statusBadge = 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
          } else if (isReserved) {
            cardBorder = 'border-sky-800/50 bg-gradient-to-b from-slate-900 to-sky-950/20';
            statusBadge = 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
          }

          return (
            <div
              key={room.id}
              className={`rounded-2xl border p-5 shadow-xl transition-all duration-200 flex flex-col justify-between ${cardBorder}`}
            >
              <div>
                {/* Top room header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black text-white tracking-tight">
                        Room {room.room_number}
                      </span>
                      <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                        <Layers className="w-3 h-3 text-amber-400" />
                        Floor {room.floor}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-200 mt-0.5">
                      {room.room_type}
                    </p>
                  </div>

                  {/* Status Dropdown */}
                  <select
                    value={room.status}
                    onChange={(e) => onUpdateRoomStatus(room.id, e.target.value)}
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg focus:outline-none cursor-pointer ${statusBadge}`}
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                {/* Tariff & Capacity */}
                <div className="flex items-center justify-between mt-3 py-2 px-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-400">Tariff: </span>
                    <span className="font-bold text-amber-400 font-mono">
                      {formatCurrency(room.rate_per_night, currency)}
                    </span>
                    <span className="text-[10px] text-slate-400"> / night</span>
                  </div>
                  <div className="text-slate-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>Max {room.capacity} Guests</span>
                  </div>
                </div>

                {/* Features pills */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {room.features && room.features.map((feat, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700/60"
                    >
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Current Guest Folio details if occupied */}
                {isOccupied && (
                  <div className="mt-4 p-3 bg-rose-950/30 border border-rose-900/40 rounded-xl text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Guest:</span>
                      <span className="font-bold text-white">{room.current_guest_name}</span>
                    </div>
                    {room.current_guest_phone && (
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">Phone:</span>
                        <span className="font-mono">{room.current_guest_phone}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-400">Checked In:</span>
                      <span>{formatDate(room.check_in_date)}</span>
                    </div>
                    {room.advance_payment > 0 && (
                      <div className="flex items-center justify-between text-emerald-400">
                        <span>Advance Paid:</span>
                        <span className="font-bold">{formatCurrency(room.advance_payment, currency)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons at bottom of card */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center gap-2">
                {isOccupied ? (
                  <>
                    <button
                      onClick={() => onSelectRoomForFolio(room.current_booking_id)}
                      className="flex-1 py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                    >
                      <Receipt className="w-3.5 h-3.5" />
                      <span>Folio & Checkout</span>
                    </button>
                    <button
                      onClick={() => onOpenPOSForRoom(room)}
                      title="Add Room Service / Dine-in Charge"
                      className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1"
                    >
                      <UtensilsCrossed className="w-3.5 h-3.5" />
                      <span>Order</span>
                    </button>
                  </>
                ) : isAvailable ? (
                  <button
                    onClick={() => onOpenCheckIn(room.id)}
                    className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5"
                  >
                    <span>Check-In Guest</span>
                  </button>
                ) : isCleaning ? (
                  <button
                    onClick={() => onUpdateRoomStatus(room.id, 'available')}
                    className="w-full py-2 px-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Housekeeping Done & Mark Ready</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onUpdateRoomStatus(room.id, 'available')}
                    className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs rounded-xl transition"
                  >
                    Release Reservation
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
