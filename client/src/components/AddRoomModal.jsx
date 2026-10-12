import React, { useState } from 'react';
import { X, BedDouble, Plus, Layers, DollarSign, Users } from 'lucide-react';

export default function AddRoomModal({
  isOpen,
  onClose,
  settings,
  onRoomAdded
}) {
  if (!isOpen) return null;

  const currency = settings?.currency_symbol || '₹';
  const [roomNumber, setRoomNumber] = useState('');
  const [roomType, setRoomType] = useState('Deluxe King');
  const [floor, setFloor] = useState(1);
  const [ratePerNight, setRatePerNight] = useState(4500);
  const [capacity, setCapacity] = useState(2);
  const [features, setFeatures] = useState('AC, King Bed, Wi-Fi, Smart TV');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    if (!roomNumber.trim() || !ratePerNight) {
      setError('Room number and rate are required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const featArray = features.split(',').map((f) => f.trim()).filter(Boolean);
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          room_number: roomNumber.trim(),
          room_type: roomType,
          floor: Number(floor),
          rate_per_night: Number(ratePerNight),
          capacity: Number(capacity),
          features: featArray
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add room');

      onRoomAdded();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <BedDouble className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Add New Hotel Room</h2>
            <p className="text-xs text-slate-400">Expand room inventory & set base tariff</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-xl text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Room Number *</label>
            <input
              type="text"
              value={roomNumber}
              onChange={(e) => setRoomNumber(e.target.value)}
              placeholder="e.g. 401 or 305"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Room Type</label>
              <select
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Standard Queen">Standard Queen</option>
                <option value="Deluxe King">Deluxe King</option>
                <option value="Deluxe Twin">Deluxe Twin</option>
                <option value="Executive Club">Executive Club</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Presidential Penthouse">Presidential Penthouse</option>
              </select>
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Floor Number</label>
              <input
                type="number"
                min="1"
                max="50"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Base Rate / Night ({currency}) *</label>
              <input
                type="number"
                value={ratePerNight}
                onChange={(e) => setRatePerNight(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
                required
              />
            </div>

            <div>
              <label className="text-slate-300 block mb-1 font-semibold">Guest Capacity</label>
              <input
                type="number"
                min="1"
                max="8"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-300 block mb-1 font-semibold">Amenities & Features (Comma separated)</label>
            <input
              type="text"
              value={features}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder="King Bed, Balcony, AC, Jacuzzi"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-400 hover:text-white transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg transition"
            >
              {loading ? 'Adding...' : 'Add Room to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
