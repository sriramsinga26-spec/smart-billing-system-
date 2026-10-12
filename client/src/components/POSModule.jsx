import React, { useState, useEffect } from 'react';
import {
  UtensilsCrossed,
  Search,
  Plus,
  Minus,
  Trash2,
  Coffee,
  CheckCircle2,
  DollarSign,
  Receipt,
  BedDouble,
  ShoppingBag,
  Sparkles,
  CreditCard,
  QrCode
} from 'lucide-react';
import { formatCurrency } from '../utils';

export default function POSModule({
  rooms,
  settings,
  preselectedRoom,
  onOrderCompleted
}) {
  const currency = settings?.currency_symbol || '₹';
  const occupiedRooms = rooms.filter((r) => r.status === 'occupied');

  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingMenu, setLoadingMenu] = useState(true);

  // Cart state
  const [cart, setCart] = useState([]);
  const [billingType, setBillingType] = useState(preselectedRoom ? 'room' : (occupiedRooms.length > 0 ? 'room' : 'walkin'));
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoom?.id || (occupiedRooms[0]?.id || ''));
  const [tableNumber, setTableNumber] = useState('Table 1');
  const [paymentMethod, setPaymentMethod] = useState('upi_qr');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [orderSuccessMessage, setOrderSuccessMessage] = useState('');

  // Fetch menu
  useEffect(() => {
    async function fetchMenu() {
      try {
        setLoadingMenu(true);
        const res = await fetch('/api/pos/menu');
        const data = await res.json();
        setMenuItems(data);

        const uniqueCats = ['All', ...new Set(data.map((item) => item.category))];
        setCategories(uniqueCats);
      } catch (err) {
        console.error('Failed to load menu:', err);
      } finally {
        setLoadingMenu(false);
      }
    }
    fetchMenu();
  }, []);

  // Filter items
  const filteredItems = menuItems.filter((item) => {
    if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  // Cart operations
  function addToCart(item) {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) => (i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function updateQuantity(id, delta) {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  }

  function removeFromCart(id) {
    setCart((prev) => prev.filter((i) => i.id !== id));
  }

  function clearCart() {
    setCart([]);
  }

  // Cart Totals
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST
  const totalAmount = subtotal + taxAmount;

  // Selected room object
  const activeRoom = rooms.find((r) => String(r.id) === String(selectedRoomId));

  async function handlePlaceOrder() {
    if (cart.length === 0) return;

    if (billingType === 'room' && !activeRoom?.current_booking_id) {
      alert('Please select an occupied room with an active guest booking.');
      return;
    }

    setOrderSubmitting(true);
    setOrderSuccessMessage('');

    try {
      const payload = {
        order_type: billingType === 'room' ? 'room_service' : 'restaurant_dine_in',
        items: cart,
        booking_id: billingType === 'room' ? activeRoom.current_booking_id : null,
        room_id: billingType === 'room' ? activeRoom.id : null,
        table_number: billingType === 'walkin' ? tableNumber : null,
        payment_method: billingType === 'walkin' ? paymentMethod : null,
        is_paid_instantly: billingType === 'walkin'
      };

      const res = await fetch('/api/pos/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to place order');

      const successText = billingType === 'room'
        ? `Order #${data.orderId} of ${formatCurrency(totalAmount, currency)} successfully charged to Room ${activeRoom.room_number} (${activeRoom.current_guest_name}'s folio)!`
        : `Dining Bill #${data.orderId} of ${formatCurrency(totalAmount, currency)} collected via ${paymentMethod.toUpperCase()}!`;

      setOrderSuccessMessage(successText);
      setCart([]);
      if (onOrderCompleted) onOrderCompleted();
    } catch (err) {
      alert('Order failed: ' + err.message);
    } finally {
      setOrderSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <UtensilsCrossed className="w-6 h-6 text-amber-400" />
              Fine Dining, Room Service & POS Engine
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Instant kitchen tickets, direct folio room charges, and walk-in dining billing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Total catalog:</span>
            <span className="text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
              {menuItems.length} Items & Services
            </span>
          </div>
        </div>

        {/* Success Alert */}
        {orderSuccessMessage && (
          <div className="mt-4 p-3.5 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{orderSuccessMessage}</span>
            </div>
            <button
              onClick={() => setOrderSuccessMessage('')}
              className="text-emerald-400 hover:text-white font-bold ml-2"
            >
              ×
            </button>
          </div>
        )}

        {/* Categories Bar */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Left catalog, Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Menu Catalog */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search dishes, drinks, laundry, rollaway beds..."
              className="w-full pl-9 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
            />
          </div>

          {loadingMenu ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              Loading hotel menu items...
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {filteredItems.map((item) => {
                const inCartItem = cart.find((c) => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 shadow-md hover:border-slate-700 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-sm text-white leading-tight">
                          {item.name}
                        </h4>
                        <span className="font-mono font-bold text-amber-400 text-sm whitespace-nowrap">
                          {formatCurrency(item.price, currency)}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold inline-block mt-0.5">
                        {item.category}
                      </span>
                      {item.description && (
                        <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between">
                      {inCartItem ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center justify-center text-slate-200 transition"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="font-bold text-sm text-amber-400 px-1 font-mono">
                            {inCartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="w-7 h-7 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg flex items-center justify-center transition"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => addToCart(item)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-amber-500 hover:text-slate-950 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}

                      {inCartItem && (
                        <span className="text-xs font-mono font-bold text-emerald-400">
                          {formatCurrency(item.price * inCartItem.quantity, currency)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right 1 Col: Live Order & Folio Charge Cart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl flex flex-col justify-between sticky top-24 max-h-[calc(100vh-7rem)]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-base text-white">Current Order / KOT</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Destination Toggle: Bill to Room vs Walk-in Dine-in */}
            <div className="mt-4 p-1 bg-slate-950 rounded-xl grid grid-cols-2 gap-1 border border-slate-800">
              <button
                onClick={() => setBillingType('room')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  billingType === 'room'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Room Service
              </button>
              <button
                onClick={() => setBillingType('walkin')}
                className={`py-1.5 text-xs font-semibold rounded-lg transition ${
                  billingType === 'walkin'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Walk-In Dining
              </button>
            </div>

            {/* Details for Room vs Walk-in */}
            <div className="mt-3">
              {billingType === 'room' ? (
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Select Occupied Room to Bill:
                  </label>
                  {occupiedRooms.length > 0 ? (
                    <select
                      value={selectedRoomId}
                      onChange={(e) => setSelectedRoomId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      {occupiedRooms.map((r) => (
                        <option key={r.id} value={r.id}>
                          Room #{r.room_number} ({r.current_guest_name})
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-400 p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      No occupied rooms currently. Check-in a guest first or select Walk-in.
                    </p>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Table / Token:
                    </label>
                    <input
                      type="text"
                      value={tableNumber}
                      onChange={(e) => setTableNumber(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400 font-medium block mb-1">
                      Payment Mode:
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="upi_qr">UPI / QR Code</option>
                      <option value="card">Card POS</option>
                      <option value="cash">Cash</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Cart Items List */}
            <div className="mt-4 space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs">
                  Cart is empty. Click + on any dish or amenity to add.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex-1 mr-2">
                      <p className="font-semibold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {formatCurrency(item.price, currency)} × {item.quantity}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-mono font-bold text-white px-1">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="w-5 h-5 bg-slate-800 rounded flex items-center justify-center text-slate-300 hover:bg-slate-700"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="text-slate-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Cart Summary & Order Trigger */}
          <div className="mt-4 pt-3 border-t border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal:</span>
              <span className="font-mono">{formatCurrency(subtotal, currency)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>GST (5% F&B):</span>
              <span className="font-mono">{formatCurrency(taxAmount, currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-slate-800">
              <span>Grand Total:</span>
              <span className="font-mono text-emerald-400">
                {formatCurrency(totalAmount, currency)}
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={cart.length === 0 || orderSubmitting}
              className="w-full mt-2 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
              <span>
                {orderSubmitting
                  ? 'Processing...'
                  : billingType === 'room'
                  ? 'Charge to Room Folio'
                  : 'Place Order & Collect Bill'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
