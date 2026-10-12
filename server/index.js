import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { db, initDatabase } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize DB schema & seed data
initDatabase();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static build from client/dist if available
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientDistPath));

// --- API ENDPOINTS ---

// 1. Dashboard Overview Stats
app.get('/api/dashboard', (req, res) => {
  try {
    const totalRooms = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const occupiedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'occupied'").get().count;
    const availableRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'available'").get().count;
    const cleaningRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'cleaning'").get().count;
    const reservedRooms = db.prepare("SELECT COUNT(*) as count FROM rooms WHERE status = 'reserved'").get().count;

    const occupancyRate = totalRooms > 0 ? Math.round((occupiedRooms / totalRooms) * 100) : 0;

    // Total revenue from all settled invoices
    const revenueStats = db.prepare('SELECT SUM(grand_total) as total_rev, COUNT(*) as inv_count FROM invoices').get();
    const totalRevenue = revenueStats.total_rev || 0;

    // Active bookings
    const activeBookings = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'checked_in'").get().count;

    // Active orders today
    const ordersToday = db.prepare("SELECT COUNT(*) as count, SUM(total_amount) as total FROM orders WHERE date(created_at) = date('now')").get();

    // Recent 5 invoices
    const recentInvoices = db.prepare(`
      SELECT id, invoice_number, guest_name, room_number, grand_total, payment_status, payment_method, bill_date
      FROM invoices
      ORDER BY bill_date DESC
      LIMIT 5
    `).all();

    res.json({
      rooms: {
        total: totalRooms,
        occupied: occupiedRooms,
        available: availableRooms,
        cleaning: cleaningRooms,
        reserved: reservedRooms,
        occupancyRate
      },
      financials: {
        totalRevenue,
        invoicesCount: revenueStats.inv_count,
        ordersTodayCount: ordersToday.count || 0,
        ordersTodayAmount: ordersToday.total || 0,
        activeBookings
      },
      recentInvoices
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Rooms Matrix & Management
app.get('/api/rooms', (req, res) => {
  try {
    const rooms = db.prepare(`
      SELECT 
        r.*,
        b.id as current_booking_id,
        b.check_in_date,
        b.expected_check_out_date,
        b.advance_payment,
        b.room_rate_per_night,
        g.name as current_guest_name,
        g.phone as current_guest_phone,
        g.email as current_guest_email
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.room_id AND b.status = 'checked_in'
      LEFT JOIN guests g ON b.guest_id = g.id
      ORDER BY r.floor ASC, r.room_number ASC
    `).all();

    const formatted = rooms.map(r => ({
      ...r,
      features: r.features_json ? JSON.parse(r.features_json) : []
    }));

    res.json(formatted);
  } catch (error) {
    console.error('Error fetching rooms:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/rooms', (req, res) => {
  try {
    const { room_number, room_type, floor, rate_per_night, capacity, features } = req.body;
    if (!room_number || !room_type || !rate_per_night) {
      return res.status(400).json({ error: 'Missing required room fields' });
    }

    const result = db.prepare(`
      INSERT INTO rooms (room_number, room_type, floor, rate_per_night, capacity, status, features_json)
      VALUES (?, ?, ?, ?, ?, 'available', ?)
    `).run(
      room_number,
      room_type,
      floor || 1,
      rate_per_night,
      capacity || 2,
      JSON.stringify(features || ['AC', 'Smart TV', 'Wi-Fi'])
    );

    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/rooms/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    db.prepare('UPDATE rooms SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Guest Check-In & Reservations
app.post('/api/bookings/check-in', (req, res) => {
  try {
    const {
      guest_name,
      guest_phone,
      guest_email,
      id_type,
      id_number,
      address,
      city,
      room_id,
      check_in_date,
      expected_check_out_date,
      adults,
      children,
      room_rate_per_night,
      advance_payment,
      notes
    } = req.body;

    if (!guest_name || !guest_phone || !room_id) {
      return res.status(400).json({ error: 'Guest name, phone, and room are required' });
    }

    // Insert or find guest
    let guest = db.prepare('SELECT id FROM guests WHERE phone = ?').get(guest_phone);
    let guestId = guest ? guest.id : null;

    if (!guestId) {
      const gRes = db.prepare(`
        INSERT INTO guests (name, phone, email, id_type, id_number, address, city)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        guest_name,
        guest_phone,
        guest_email || '',
        id_type || 'Aadhaar / National ID',
        id_number || '',
        address || '',
        city || ''
      );
      guestId = gRes.lastInsertRowid;
    }

    const bookingId = 'BK-' + Date.now().toString().slice(-6);
    const checkinTime = check_in_date || new Date().toISOString();
    const expectedCheckoutTime = expected_check_out_date || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    db.prepare(`
      INSERT INTO bookings (
        id, guest_id, room_id, check_in_date, expected_check_out_date,
        adults, children, room_rate_per_night, advance_payment, status, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'checked_in', ?)
    `).run(
      bookingId,
      guestId,
      room_id,
      checkinTime,
      expectedCheckoutTime,
      adults || 1,
      children || 0,
      room_rate_per_night,
      advance_payment || 0,
      notes || ''
    );

    // Update room status to occupied
    db.prepare("UPDATE rooms SET status = 'occupied' WHERE id = ?").run(room_id);

    res.json({ success: true, bookingId });
  } catch (error) {
    console.error('Checkin error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 4. Live Running Folio / Bill Calculation
app.get('/api/bookings/:id/folio', (req, res) => {
  try {
    const { id } = req.params;
    const booking = db.prepare(`
      SELECT 
        b.*,
        r.room_number,
        r.room_type,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        g.id_type as guest_id_type,
        g.id_number as guest_id_number,
        g.address as guest_address
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN guests g ON b.guest_id = g.id
      WHERE b.id = ?
    `).get(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Fetch hotel settings for tax rates
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    // Calculate nights stayed
    const checkIn = new Date(booking.check_in_date);
    const now = new Date();
    const diffTime = Math.max(0, now.getTime() - checkIn.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) diffDays = 1;

    const roomChargesTotal = diffDays * booking.room_rate_per_night;

    // Fetch all orders attached to this booking
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE booking_id = ? AND status != 'cancelled'
      ORDER BY created_at ASC
    `).all(id);

    let foodAndDiningTotal = 0;
    let otherServicesTotal = 0;
    const formattedOrders = orders.map(o => {
      const items = JSON.parse(o.items_json);
      if (o.order_type === 'room_service' || o.order_type === 'restaurant_dine_in') {
        foodAndDiningTotal += o.total_amount;
      } else {
        otherServicesTotal += o.total_amount;
      }
      return {
        ...o,
        items
      };
    });

    const subtotal = roomChargesTotal + foodAndDiningTotal + otherServicesTotal;
    
    // Tax calculations
    const cgstRate = settings.default_cgst_rate || 6.0;
    const sgstRate = settings.default_sgst_rate || 6.0;
    const cgstAmount = Math.round((subtotal * (cgstRate / 100)) * 100) / 100;
    const sgstAmount = Math.round((subtotal * (sgstRate / 100)) * 100) / 100;
    const totalTax = cgstAmount + sgstAmount;

    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;
    const advancePaid = booking.advance_payment || 0;
    const balancePayable = Math.max(0, Math.round((grandTotal - advancePaid) * 100) / 100);

    res.json({
      booking,
      nightsStayed: diffDays,
      roomChargesTotal,
      foodAndDiningTotal,
      otherServicesTotal,
      orders: formattedOrders,
      subtotal,
      taxes: {
        cgstRate,
        cgstAmount,
        sgstRate,
        sgstAmount,
        totalTax
      },
      advancePaid,
      grandTotal,
      balancePayable,
      settings
    });
  } catch (error) {
    console.error('Folio error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 5. Check-Out & Official Invoice Generation
app.post('/api/bookings/:id/checkout', (req, res) => {
  try {
    const { id } = req.params;
    const {
      discount_percent = 0,
      discount_amount = 0,
      payment_method = 'upi_qr',
      payment_reference = '',
      notes = ''
    } = req.body;

    const booking = db.prepare(`
      SELECT 
        b.*,
        r.room_number,
        r.room_type,
        g.id as guest_id,
        g.name as guest_name,
        g.phone as guest_phone,
        g.email as guest_email,
        g.id_type as guest_id_type,
        g.id_number as guest_id_number,
        g.address as guest_address
      FROM bookings b
      JOIN rooms r ON b.room_id = r.id
      JOIN guests g ON b.guest_id = g.id
      WHERE b.id = ?
    `).get(id);

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();

    // Nights stayed
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date();
    const diffTime = Math.max(0, checkOut.getTime() - checkIn.getTime());
    let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) diffDays = 1;

    const roomChargesTotal = diffDays * booking.room_rate_per_night;

    // Food & services
    const orders = db.prepare("SELECT * FROM orders WHERE booking_id = ? AND status != 'cancelled'").all(booking.id);
    let foodTotal = 0;
    let otherTotal = 0;
    const itemizedBreakdown = [
      {
        description: `${booking.room_type} (Room ${booking.room_number}) - ${diffDays} Night(s) @ ${settings.currency_symbol}${booking.room_rate_per_night}/night`,
        category: 'Room Tariff',
        amount: roomChargesTotal
      }
    ];

    for (const o of orders) {
      const items = JSON.parse(o.items_json);
      if (o.order_type === 'room_service' || o.order_type === 'restaurant_dine_in') {
        foodTotal += o.total_amount;
        itemizedBreakdown.push({
          description: `Dining Order #${o.id} (${items.map(i => `${i.name} × ${i.quantity}`).join(', ')})`,
          category: 'Food & Dining',
          amount: o.total_amount
        });
      } else {
        otherTotal += o.total_amount;
        itemizedBreakdown.push({
          description: `Service Order #${o.id} (${items.map(i => `${i.name} × ${i.quantity}`).join(', ')})`,
          category: 'Hotel Services',
          amount: o.total_amount
        });
      }
    }

    const rawSubtotal = roomChargesTotal + foodTotal + otherTotal;
    
    // Calculate discount
    let finalDiscount = discount_amount;
    if (discount_percent > 0) {
      finalDiscount = Math.round((rawSubtotal * (discount_percent / 100)) * 100) / 100;
    }
    const taxableAmount = Math.max(0, rawSubtotal - finalDiscount);

    // Taxes
    const cgstRate = settings.default_cgst_rate || 6.0;
    const sgstRate = settings.default_sgst_rate || 6.0;
    const cgstAmount = Math.round((taxableAmount * (cgstRate / 100)) * 100) / 100;
    const sgstAmount = Math.round((taxableAmount * (sgstRate / 100)) * 100) / 100;
    const grandTotal = Math.round((taxableAmount + cgstAmount + sgstAmount) * 100) / 100;
    const advancePaid = booking.advance_payment || 0;
    const balancePayable = Math.max(0, Math.round((grandTotal - advancePaid) * 100) / 100);

    // Generate unique invoice number
    const invCount = db.prepare('SELECT COUNT(*) as count FROM invoices').get().count + 1;
    const invoiceNumber = `${settings.invoice_prefix || 'INV-2026-'}${String(invCount).padStart(4, '0')}`;
    const invoiceId = 'INV-' + crypto.randomUUID().slice(0, 8);

    db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, booking_id, guest_id, guest_name, guest_phone, guest_email, guest_id_info,
        room_number, room_type, check_in_date, check_out_date, total_nights,
        room_tariff_total, food_service_total, other_services_total, subtotal,
        discount_percent, discount_amount, taxable_amount,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, service_charge_amount,
        grand_total, advance_paid, balance_payable, payment_method, payment_reference, payment_status, notes, bill_date, items_breakdown_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      invoiceId,
      invoiceNumber,
      booking.id,
      booking.guest_id,
      booking.guest_name,
      booking.guest_phone,
      booking.guest_email,
      `${booking.guest_id_type || 'ID'}: ${booking.guest_id_number || 'N/A'}`,
      booking.room_number,
      booking.room_type,
      booking.check_in_date,
      checkOut.toISOString(),
      diffDays,
      roomChargesTotal,
      foodTotal,
      otherTotal,
      rawSubtotal,
      discount_percent,
      finalDiscount,
      taxableAmount,
      cgstRate,
      cgstAmount,
      sgstRate,
      sgstAmount,
      0,
      grandTotal,
      advancePaid,
      balancePayable,
      payment_method,
      payment_reference,
      'paid',
      notes,
      checkOut.toISOString(),
      JSON.stringify(itemizedBreakdown)
    );

    // Update booking to checked_out
    db.prepare("UPDATE bookings SET status = 'checked_out', check_out_date = ? WHERE id = ?").run(
      checkOut.toISOString(),
      booking.id
    );

    // Update room status to 'cleaning'
    db.prepare("UPDATE rooms SET status = 'cleaning' WHERE id = ?").run(booking.room_id);

    const createdInvoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoiceId);

    res.json({
      success: true,
      invoice: {
        ...createdInvoice,
        itemsBreakdown: JSON.parse(createdInvoice.items_breakdown_json)
      }
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 6. Food & Room Service POS Orders
app.get('/api/pos/menu', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM menu_items ORDER BY category ASC, name ASC').all();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pos/menu', (req, res) => {
  try {
    const { name, category, price, description } = req.body;
    const result = db.prepare(`
      INSERT INTO menu_items (name, category, price, is_available, description)
      VALUES (?, ?, ?, 1, ?)
    `).run(name, category, price, description || '');
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/pos/orders', (req, res) => {
  try {
    const {
      booking_id,
      room_id,
      table_number,
      order_type = 'room_service',
      items,
      payment_method,
      is_paid_instantly = false
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain items' });
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-6);
    const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const taxAmount = Math.round(subtotal * 0.05 * 100) / 100; // 5% GST for food
    const totalAmount = subtotal + taxAmount;

    const status = is_paid_instantly ? 'paid_instantly' : (booking_id ? 'billed_to_room' : 'completed');

    db.prepare(`
      INSERT INTO orders (
        id, booking_id, room_id, table_number, order_type,
        items_json, subtotal, tax_amount, total_amount, status, payment_method
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      orderId,
      booking_id || null,
      room_id || null,
      table_number || null,
      order_type,
      JSON.stringify(items),
      subtotal,
      taxAmount,
      totalAmount,
      status,
      payment_method || null
    );

    res.json({ success: true, orderId, totalAmount, status });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// 7. Invoices History & Archive
app.get('/api/invoices', (req, res) => {
  try {
    const invoices = db.prepare(`
      SELECT * FROM invoices
      ORDER BY bill_date DESC
    `).all();

    const formatted = invoices.map(inv => ({
      ...inv,
      itemsBreakdown: inv.items_breakdown_json ? JSON.parse(inv.items_breakdown_json) : []
    }));

    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/invoices/:id', (req, res) => {
  try {
    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    res.json({
      ...invoice,
      itemsBreakdown: invoice.items_breakdown_json ? JSON.parse(invoice.items_breakdown_json) : []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Settings API
app.get('/api/settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM settings WHERE id = 1').get();
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/settings', (req, res) => {
  try {
    const {
      hotel_name, tagline, address, phone, email, website, gstin,
      currency_symbol, currency_code, default_cgst_rate, default_sgst_rate,
      service_charge_rate, invoice_prefix, invoice_terms
    } = req.body;

    db.prepare(`
      UPDATE settings SET
        hotel_name = ?, tagline = ?, address = ?, phone = ?, email = ?, website = ?,
        gstin = ?, currency_symbol = ?, currency_code = ?, default_cgst_rate = ?,
        default_sgst_rate = ?, service_charge_rate = ?, invoice_prefix = ?, invoice_terms = ?
      WHERE id = 1
    `).run(
      hotel_name, tagline, address, phone, email, website, gstin,
      currency_symbol, currency_code, default_cgst_rate, default_sgst_rate,
      service_charge_rate, invoice_prefix, invoice_terms
    );

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fallback for SPA routing if dist exists
app.use((req, res) => {
  const indexHtml = path.join(clientDistPath, 'index.html');
  res.sendFile(indexHtml, (err) => {
    if (err) {
      res.json({ message: 'Hotel Smart Billing API Server running' });
    }
  });
});

app.listen(PORT, () => {
  console.log(`🏨 Hotel Smart Billing Server active on http://localhost:${PORT}`);
});
