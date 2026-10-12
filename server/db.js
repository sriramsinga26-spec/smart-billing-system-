import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '..', 'hotel.db');

export const db = new Database(dbPath);

// Enable WAL mode for high performance & reliability
db.pragma('journal_mode = WAL');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      hotel_name TEXT NOT NULL,
      tagline TEXT,
      address TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      website TEXT,
      gstin TEXT,
      currency_symbol TEXT DEFAULT '₹',
      currency_code TEXT DEFAULT 'INR',
      default_cgst_rate REAL DEFAULT 6.0,
      default_sgst_rate REAL DEFAULT 6.0,
      service_charge_rate REAL DEFAULT 0.0,
      invoice_prefix TEXT DEFAULT 'INV-2026-',
      invoice_terms TEXT
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room_number TEXT UNIQUE NOT NULL,
      room_type TEXT NOT NULL,
      floor INTEGER NOT NULL,
      rate_per_night REAL NOT NULL,
      capacity INTEGER NOT NULL,
      status TEXT DEFAULT 'available', -- 'available', 'occupied', 'reserved', 'cleaning'
      features_json TEXT
    );

    CREATE TABLE IF NOT EXISTS guests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      id_type TEXT,
      id_number TEXT,
      address TEXT,
      city TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      guest_id INTEGER NOT NULL,
      room_id INTEGER NOT NULL,
      check_in_date DATETIME NOT NULL,
      check_out_date DATETIME,
      expected_check_out_date DATETIME NOT NULL,
      adults INTEGER DEFAULT 1,
      children INTEGER DEFAULT 0,
      room_rate_per_night REAL NOT NULL,
      advance_payment REAL DEFAULT 0.0,
      status TEXT DEFAULT 'checked_in', -- 'checked_in', 'checked_out', 'cancelled'
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (guest_id) REFERENCES guests(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL,
      is_available INTEGER DEFAULT 1,
      description TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      booking_id TEXT,
      room_id INTEGER,
      table_number TEXT,
      order_type TEXT NOT NULL, -- 'room_service', 'restaurant_dine_in', 'laundry', 'amenity'
      items_json TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'completed', -- 'completed', 'billed_to_room', 'paid_instantly', 'cancelled'
      payment_method TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES bookings(id),
      FOREIGN KEY (room_id) REFERENCES rooms(id)
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      booking_id TEXT,
      guest_id INTEGER,
      guest_name TEXT NOT NULL,
      guest_phone TEXT,
      guest_email TEXT,
      guest_id_info TEXT,
      room_number TEXT,
      room_type TEXT,
      check_in_date DATETIME,
      check_out_date DATETIME,
      total_nights INTEGER DEFAULT 1,
      room_tariff_total REAL NOT NULL,
      food_service_total REAL DEFAULT 0.0,
      other_services_total REAL DEFAULT 0.0,
      subtotal REAL NOT NULL,
      discount_percent REAL DEFAULT 0.0,
      discount_amount REAL DEFAULT 0.0,
      taxable_amount REAL NOT NULL,
      cgst_percent REAL DEFAULT 6.0,
      cgst_amount REAL DEFAULT 0.0,
      sgst_percent REAL DEFAULT 6.0,
      sgst_amount REAL DEFAULT 0.0,
      service_charge_amount REAL DEFAULT 0.0,
      grand_total REAL NOT NULL,
      advance_paid REAL DEFAULT 0.0,
      balance_payable REAL NOT NULL,
      payment_method TEXT DEFAULT 'cash', -- 'cash', 'card', 'upi_qr', 'bank_transfer', 'split'
      payment_reference TEXT,
      payment_status TEXT DEFAULT 'paid', -- 'paid', 'partial', 'unpaid'
      notes TEXT,
      bill_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      items_breakdown_json TEXT
    );
  `);

  seedInitialData();
}

export function seedInitialData() {
  // Check settings
  const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!settingsRow) {
    db.prepare(`
      INSERT INTO settings (
        id, hotel_name, tagline, address, phone, email, website, gstin,
        currency_symbol, currency_code, default_cgst_rate, default_sgst_rate,
        service_charge_rate, invoice_prefix, invoice_terms
      ) VALUES (
        1,
        'The Grand Aurelia Hotel & Suites',
        'Luxury Stays & Fine Hospitality',
        '42 Marina Boulevard, Oceanfront Enclave, Chennai, Tamil Nadu - 600004',
        '+91 98765 43210 / +91 44 2847 9000',
        'reservations@grandaurelia.com',
        'www.grandaureliahotel.com',
        '33AABCG1234F1Z8',
        '₹',
        'INR',
        6.0,
        6.0,
        0.0,
        'INV-2026-',
        'Thank you for staying with us. In case of queries regarding this invoice, please reach out to frontdesk@grandaurelia.com. Check-out time is strictly 11:00 AM.'
      )
    `).run();
  }

  // Check rooms
  const roomsCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get();
  if (roomsCount.count === 0) {
    const insertRoom = db.prepare(`
      INSERT INTO rooms (room_number, room_type, floor, rate_per_night, capacity, status, features_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const defaultRooms = [
      ['101', 'Deluxe King', 1, 4500, 2, 'available', JSON.stringify(['King Bed', 'Garden View', 'High-Speed Wi-Fi', 'Smart TV', 'AC'])],
      ['102', 'Deluxe Twin', 1, 4200, 2, 'occupied', JSON.stringify(['Twin Beds', 'Garden View', 'Work Desk', 'Mini Fridge', 'AC'])],
      ['103', 'Executive Club', 1, 6500, 2, 'occupied', JSON.stringify(['King Bed', 'Club Lounge Access', 'Espresso Machine', 'Bathtub', 'Balcony'])],
      ['104', 'Standard Queen', 1, 3500, 2, 'cleaning', JSON.stringify(['Queen Bed', 'City View', 'Wi-Fi', 'Smart TV'])],
      ['201', 'Executive Suite', 2, 8500, 3, 'occupied', JSON.stringify(['Separate Living Room', 'Jacuzzi', 'Ocean View', 'Complimentary Breakfast'])],
      ['202', 'Executive Suite', 2, 8500, 3, 'available', JSON.stringify(['Separate Living Room', 'Jacuzzi', 'Ocean View', 'Complimentary Breakfast'])],
      ['203', 'Deluxe King', 2, 4500, 2, 'available', JSON.stringify(['King Bed', 'Ocean Breeze', 'Smart TV', 'Work Desk'])],
      ['204', 'Deluxe Twin', 2, 4200, 2, 'reserved', JSON.stringify(['Twin Beds', 'Ocean Breeze', 'Tea/Coffee Maker'])],
      ['301', 'Presidential Penthouse', 3, 18000, 4, 'occupied', JSON.stringify(['Panoramic Penthouse View', 'Private Terrace', 'Personal Butler', 'Full Kitchenette', 'Deep Soaking Tub'])],
      ['302', 'Royal Heritage Suite', 3, 14000, 3, 'available', JSON.stringify(['Royal Canopy Bed', 'Ocean View', 'Private Bar', 'Walk-in Closet'])]
    ];

    for (const r of defaultRooms) {
      insertRoom.run(...r);
    }
  }

  // Check menu items
  const menuCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get();
  if (menuCount.count === 0) {
    const insertMenu = db.prepare(`
      INSERT INTO menu_items (name, category, price, is_available, description)
      VALUES (?, ?, ?, ?, ?)
    `);

    const defaultMenu = [
      // Breakfast
      ['Continental Breakfast Spread', 'Breakfast', 450, 1, 'Croissant, toast, butter, seasonal fruit bowl, fresh juice & coffee'],
      ['South Indian Special Thali', 'Breakfast', 350, 1, 'Steamed idli, medu vada, masala dosa, sambar & trio chutneys'],
      ['Fluffy Pancakes with Maple Syrup', 'Breakfast', 380, 1, 'Served with whipped butter and berry compote'],
      ['Masala Cheese Omelette', 'Breakfast', 280, 1, 'Served with grilled tomatoes and buttered hash browns'],
      // Main Course
      ['Royal Chicken Biryani (Aurelia Dum)', 'Main Course', 650, 1, 'Aromatic basmati rice cooked with tender spiced chicken & raita'],
      ['Paneer Butter Masala & Garlic Naan', 'Main Course', 520, 1, 'Rich creamy cottage cheese curry with 2 butter garlic naans'],
      ['Pan-Seared Norwegian Salmon', 'Main Course', 890, 1, 'Served with herb crushed potatoes and lemon butter sauce'],
      ['Wild Truffle Mushroom Risotto', 'Main Course', 620, 1, 'Creamy Arborio rice with wild forest mushrooms and parmesan shavings'],
      ['Dal Makhani & Jeera Pulao', 'Main Course', 420, 1, 'Slow-cooked black lentils in churned butter with fragrant cumin rice'],
      // Snacks & Starters
      ['Crispy Peri Peri Chicken Strips', 'Snacks & Starters', 420, 1, 'Crispy crumb-fried chicken strips with garlic aioli'],
      ['Truffle Parmesan French Fries', 'Snacks & Starters', 290, 1, 'Golden crispy potato fries dusted with parmesan and truffle oil'],
      ['Crispy Vegetable Spring Rolls', 'Snacks & Starters', 320, 1, 'Served with spicy sweet chili dipping sauce'],
      ['Classic Caesar Salad', 'Snacks & Starters', 380, 1, 'Romaine lettuce, garlic croutons, parmesan flakes and creamy dressing'],
      // Beverages
      ['Signature Cold Brew Kaapi', 'Beverages', 190, 1, 'Traditional South Indian chicory-rich cold brew with froth'],
      ['Fresh Pressed Valencia Orange Juice', 'Beverages', 220, 1, 'Pure 100% freshly squeezed orange juice'],
      ['Classic Virgin Mojito', 'Beverages', 240, 1, 'Muddled fresh mint, lime, cane sugar and sparkling soda'],
      ['Himalayan Natural Sparkling Water (750ml)', 'Beverages', 150, 1, 'Premium mineral water'],
      // Desserts
      ['Molten Belgium Chocolate Lava Cake', 'Beverages & Desserts', 380, 1, 'Warm chocolate cake with molten core and vanilla bean ice cream'],
      ['Royal Kesari Kulfi & Gulab Jamun', 'Beverages & Desserts', 290, 1, 'Saffron infused traditional Indian ice cream paired with warm jamun'],
      ['New York Blueberry Baked Cheesecake', 'Beverages & Desserts', 420, 1, 'Silky cream cheese with wild blueberry compote'],
      // Laundry & Services
      ['Express Laundry & Dry Clean (Per Suit)', 'Services & Laundry', 450, 1, 'Full professional dry clean and hanger service within 4 hours'],
      ['Steam Pressing (Per Garment)', 'Services & Laundry', 150, 1, 'Crease-free steam iron service'],
      ['Extra Luxury Rollaway Bed (Per Night)', 'Services & Laundry', 1200, 1, 'Premium orthopaedic rollaway mattress with duvet set'],
      ['Airport Chauffeur Transfer (Sedan)', 'Services & Laundry', 1800, 1, 'Private luxury air-conditioned sedan transfer to airport']
    ];

    for (const m of defaultMenu) {
      insertMenu.run(...m);
    }
  }

  // Check sample guests & active bookings
  const guestsCount = db.prepare('SELECT COUNT(*) as count FROM guests').get();
  if (guestsCount.count === 0) {
    const insertGuest = db.prepare(`
      INSERT INTO guests (name, phone, email, id_type, id_number, address, city)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const g1 = insertGuest.run('Rajesh Kannan', '+91 97890 88219', 'rkannan@innovate.org', 'Driving License', 'TN07-2018-00921', '12 Gandhi Road, T. Nagar', 'Chennai');
    const g2 = insertGuest.run('Sophia Reynolds', '+44 7911 123456', 'sophia.reynolds@consulting.co.uk', 'Passport', 'GBR-P78291032', '14 Kensington Church St', 'London');
    const g3 = insertGuest.run('Vikram Malhotra', '+91 98401 23456', 'vikram.m@techcorp.com', 'Aadhaar Card', '9120-4389-7712', 'Flat 4B, Green Glen Layout', 'Bengaluru');
    const g4 = insertGuest.run('Dr. Ananya Sen', '+91 98300 44556', 'ananya.sen@aiims.edu', 'Passport', 'IND-Z4992100', '18 Park Circus', 'Kolkata');

    // Create active bookings
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const yesterday = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const today = new Date().toISOString();

    const insertBooking = db.prepare(`
      INSERT INTO bookings (id, guest_id, room_id, check_in_date, expected_check_out_date, adults, children, room_rate_per_night, advance_payment, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'checked_in', ?)
    `);

    // Room 102 (ID 2): Rajesh Kannan
    insertBooking.run('BK-102', g1.lastInsertRowid, 2, twoDaysAgo, tomorrow, 2, 0, 4200, 3000, 'Company booking. Late check-out requested.');
    
    // Room 103 (ID 3): Sophia Reynolds
    insertBooking.run('BK-103', g2.lastInsertRowid, 3, yesterday, today, 1, 0, 6500, 5000, 'VIP Guest. Non-smoking room.');

    // Room 201 (ID 5): Vikram Malhotra
    insertBooking.run('BK-201', g3.lastInsertRowid, 5, threeDaysAgo, today, 2, 1, 8500, 10000, 'Anniversary stay. Requested ocean view.');

    // Room 301 (ID 9): Dr. Ananya Sen
    insertBooking.run('BK-301', g4.lastInsertRowid, 9, yesterday, tomorrow, 2, 0, 18000, 15000, 'Presidential Penthouse guest.');

    // Attach sample orders to bookings
    const insertOrder = db.prepare(`
      INSERT INTO orders (id, booking_id, room_id, order_type, items_json, subtotal, tax_amount, total_amount, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'billed_to_room', ?)
    `);

    insertOrder.run(
      'ORD-701',
      'BK-102',
      2,
      'room_service',
      JSON.stringify([
        { id: 5, name: 'Royal Chicken Biryani (Aurelia Dum)', price: 650, quantity: 2, category: 'Main Course' },
        { id: 14, name: 'Fresh Pressed Valencia Orange Juice', price: 220, quantity: 2, category: 'Beverages' }
      ]),
      1740,
      87, // 5% food gst
      1827,
      yesterday
    );

    insertOrder.run(
      'ORD-702',
      'BK-201',
      5,
      'room_service',
      JSON.stringify([
        { id: 7, name: 'Pan-Seared Norwegian Salmon', price: 890, quantity: 2, category: 'Main Course' },
        { id: 10, name: 'Truffle Parmesan French Fries', price: 290, quantity: 1, category: 'Snacks & Starters' },
        { id: 17, name: 'Molten Belgium Chocolate Lava Cake', price: 380, quantity: 2, category: 'Beverages & Desserts' }
      ]),
      2830,
      141.5,
      2971.5,
      twoDaysAgo
    );

    insertOrder.run(
      'ORD-703',
      'BK-201',
      5,
      'laundry',
      JSON.stringify([
        { id: 20, name: 'Express Laundry & Dry Clean (Per Suit)', price: 450, quantity: 2, category: 'Services & Laundry' }
      ]),
      900,
      162, // 18% services gst
      1062,
      yesterday
    );

    // Also insert 2 completed invoices in history
    const insertInvoice = db.prepare(`
      INSERT INTO invoices (
        id, invoice_number, booking_id, guest_id, guest_name, guest_phone, guest_email, guest_id_info,
        room_number, room_type, check_in_date, check_out_date, total_nights,
        room_tariff_total, food_service_total, other_services_total, subtotal,
        discount_percent, discount_amount, taxable_amount,
        cgst_percent, cgst_amount, sgst_percent, sgst_amount, service_charge_amount,
        grand_total, advance_paid, balance_payable, payment_method, payment_reference, payment_status, notes, bill_date, items_breakdown_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const pastCheckin1 = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString();
    const pastCheckout1 = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString();

    insertInvoice.run(
      'INV-001',
      'INV-2026-0101',
      'BK-PAST-1',
      99,
      'Rohan Singhania',
      '+91 99887 76655',
      'rohan.singh@gmail.com',
      'Passport - IND-K1293849',
      '202',
      'Executive Suite',
      pastCheckin1,
      pastCheckout1,
      3,
      25500, // 3 nights @ 8500
      2450,
      600,
      28550,
      5.0,
      1427.5,
      27122.5,
      6.0,
      1627.35,
      6.0,
      1627.35,
      0,
      30377.2,
      10000,
      20377.2,
      'upi_qr',
      'UPI-REF-9928104820',
      'paid',
      'Guest checked out smoothly. Enjoyed the ocean suite.',
      pastCheckout1,
      JSON.stringify([
        { description: 'Executive Suite (3 Nights @ ₹8,500/night)', category: 'Room Tariff', amount: 25500 },
        { description: 'In-Room Fine Dining & Beverages', category: 'Food & Beverage', amount: 2450 },
        { description: 'Steam Pressing & Laundry', category: 'Hotel Services', amount: 600 }
      ])
    );
  }
}
