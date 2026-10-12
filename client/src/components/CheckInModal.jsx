import React, { useState, useEffect } from 'react';
import {
  X,
  UserPlus,
  BedDouble,
  User,
  Phone,
  Mail,
  ShieldCheck,
  MapPin,
  Calendar,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { formatCurrency } from '../utils';

export default function CheckInModal({
  isOpen,
  onClose,
  preselectedRoomId,
  rooms,
  settings,
  onCheckInSuccess
}) {
  if (!isOpen) return null;

  const currency = settings?.currency_symbol || '₹';
  const availableRooms = rooms.filter((r) => r.status === 'available' || r.id === preselectedRoomId);

  const [roomId, setRoomId] = useState(preselectedRoomId || (availableRooms[0]?.id || ''));
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [idType, setIdType] = useState('Aadhaar / National ID');
  const [idNumber, setIdNumber] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [advancePayment, setAdvancePayment] = useState('');
  const [notes, setNotes] = useState('');

  // Dates
  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [checkInDate, setCheckInDate] = useState(todayStr);
  const [expectedCheckOutDate, setExpectedCheckOutDate] = useState(tomorrowStr);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected room details
  const selectedRoom = rooms.find((r) => String(r.id) === String(roomId));
  const [roomRate, setRoomRate] = useState(selectedRoom?.rate_per_night || 0);

  useEffect(() => {
    if (selectedRoom) {
      setRoomRate(selectedRoom.rate_per_night);
    }
  }, [selectedRoom]);

  // Calculate estimated nights
  const d1 = new Date(checkInDate);
  const d2 = new Date(expectedCheckOutDate);
  const diffDays = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)));
  const estimatedStayCharge = diffDays * (Number(roomRate) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !roomId) {
      setError('Please provide Guest Name, Phone Number, and select a Room');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/bookings/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          guest_email: guestEmail.trim(),
          id_type: idType,
          id_number: idNumber.trim(),
          address: address.trim(),
          city: city.trim(),
          room_id: Number(roomId),
          check_in_date: new Date(checkInDate).toISOString(),
          expected_check_out_date: new Date(expectedCheckOutDate).toISOString(),
          adults: Number(adults),
          children: Number(children),
          room_rate_per_night: Number(roomRate),
          advance_payment: Number(advancePayment) || 0,
          notes: notes.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to check in');

      onCheckInSuccess();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Guest Registration & Check-In</h2>
            <p className="text-xs text-slate-400">Create guest folio and assign room</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Selection */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Room & Stay Configuration
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Select Available Room *</label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                >
                  <option value="">-- Choose Room --</option>
                  {availableRooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      Room #{r.room_number} - {r.room_type} (Floor {r.floor}) - {formatCurrency(r.rate_per_night, currency)}/nt
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Agreed Rate / Night ({currency}) *</label>
                <input
                  type="number"
                  value={roomRate}
                  onChange={(e) => setRoomRate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Check-In Date</label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Expected Check-Out Date</label>
                <input
                  type="date"
                  value={expectedCheckOutDate}
                  min={checkInDate}
                  onChange={(e) => setExpectedCheckOutDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Estimated Stay Summary */}
            <div className="flex items-center justify-between text-xs text-amber-300/90 pt-1">
              <span>Estimated Duration: <strong>{diffDays} Night(s)</strong></span>
              <span>Estimated Room Charges: <strong>{formatCurrency(estimatedStayCharge, currency)}</strong></span>
            </div>
          </div>

          {/* Guest Personal Information */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Guest Details
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Full Name *</label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    placeholder="e.g. Vikram Malhotra"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Mobile Phone *</label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="tel"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Adults</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={adults}
                    onChange={(e) => setAdults(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 block mb-1">Children</label>
                  <input
                    type="number"
                    min="0"
                    max="6"
                    value={children}
                    onChange={(e) => setChildren(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ID Proof Type</label>
                <select
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                >
                  <option value="Aadhaar / National ID">Aadhaar / National ID</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                  <option value="Voter ID">Voter ID</option>
                  <option value="Corporate ID">Corporate / Govt ID</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">ID Document Number</label>
                <div className="relative">
                  <ShieldCheck className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="text"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    placeholder="e.g. XXXX-XXXX-4567"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">City / Origin</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Mumbai, Bengaluru"
                  className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Advance Deposit Collected ({currency})</label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
                  <input
                    type="number"
                    value={advancePayment}
                    onChange={(e) => setAdvancePayment(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Special Preferences / Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Non-smoking room, extra pillow, late checkout requested..."
                rows="2"
                className="w-full px-3 py-2 bg-slate-950/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Confirm & Check In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
