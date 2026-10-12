# 🏨 The Grand Aurelia — Smart Hotel Billing & Property Management System

A modern, full-stack, enterprise-grade Hotel Billing & Property Management System (PMS) built with **React**, **Tailwind CSS**, **Node.js/Express**, and **SQLite**.

Designed for boutique hotels, resorts, luxury suites, and guest houses with complete front-desk operations, fine dining POS, automated folio calculation, GST accounting, and print-ready tax invoices.

---

## 🌟 Key Features

### 1. 📊 Front Desk & Real-time Operations Dashboard
- **Live Key Performance Indicators (KPIs)**: Total Settled Revenue, Occupancy Rate %, Active In-house Guests, Housekeeping tracking.
- **Interactive Room Matrix Grid**: Instant status badges for Available (Vacant), Occupied (In-house), Cleaning (Housekeeping), and Reserved.
- **One-click Quick Actions**: Fast Check-in, Direct Room Dining Charge, and Instant Check-Out.
- **Recent Settled Invoices Table**: Real-time log of checked-out guests and amounts.

### 2. 🛏️ Room Management & Matrix
- Filter rooms by **Floor** (Floor 1, Floor 2, Penthouse Floor 3) or by **Status**.
- Full room cards detailing room category, nightly tariffs, guest capacity, amenities, and current guest details.
- Status transition actions: Mark Cleaning → Available with 1 click.
- Expand room inventory with **Add New Room** modal.

### 3. ✍️ Guest Registration & Check-In
- Comprehensive guest profiling: Full Name, Mobile, Email, ID Proof Type (Aadhaar, Passport, Driving License, Voter ID), ID Number, and Origin Address.
- Automated duration calculation from check-in and expected checkout dates.
- Advance deposit collection tracking (Cash, Card, UPI).
- Special preferences, notes, and room tariff override support.

### 4. 🍽️ Fine Dining & Room Service POS Engine
- Item catalog categorized into:
  - *Breakfast*, *Starters & Snacks*, *Main Course*, *Beverages*, *Desserts*, and *Laundry & Extra Services*.
- Flexible Billing Modes:
  - **Bill to Guest Room Folio**: Select occupied room and charge to guest's folio to settle at final checkout.
  - **Walk-in Restaurant Table**: Immediate dining settlement via UPI QR, Card, or Cash.
- Live Cart with quantity adjustments and automated 5% F&B GST calculation.

### 5. 🧾 Smart Checkout & Live Folio Settlement
- Real-time aggregation of:
  - Accommodation charges (Nights Stayed × Room Rate).
  - All room service & food orders attached to the guest.
  - Laundry & special amenity charges.
- **Dynamic Discount Engine**: Apply discount by percentage (%) or flat currency amount.
- **Tax & GST Engine**: Configurable Central GST (CGST) and State GST (SGST).
- **Advance Deposit Deduction**: Automatically subtracts advance collected at check-in to compute **Net Balance Payable**.
- **Multi-Modal Payment Collection**:
  - **Dynamic UPI QR Code**: Instant scannable QR display with payee VPA and exact payable amount.
  - **Cash Tendered**: Automatically computes change to return.
  - **Card POS**: Records transaction/approval reference.

### 6. 🖨️ A4 Print-Ready Official Tax Invoice
- Branded hotel header with legal name, address, contact, and GSTIN.
- Unique serialized invoice numbering (`INV-2026-XXXX`).
- Comprehensive guest details and arrival/departure timestamps.
- Itemized charges table with HSN/SAC categorization.
- Tax breakdown (CGST + SGST) and Grand Total rendered both in numbers and **in words**.
- Digital receipt QR verification code and Authorized Signatory box.
- Optimized for `@media print` with clean formatting for direct A4 printing or PDF saving.

### 7. 📑 Tax Invoice History & Audit Archive
- Search invoices by Invoice Number, Guest Name, or Room Number.
- Filter by payment method (UPI, Card, Cash).
- One-click Reprint / View any past invoice.

### 8. ⚙️ Hotel Branding & Tax Settings
- Custom Hotel Legal Name, Tagline, Address, Phone, and Email.
- GSTIN / Tax ID customization.
- Currency Symbol (₹ INR, $ USD, € EUR, £ GBP, etc.).
- Configurable CGST and SGST tax percentages.
- Customizable Invoice Prefix and receipt footer terms.

---

## 🚀 Quick Start Guide

### 1. Requirements
- **Node.js** (v18 or higher; tested and verified on Node.js v24)
- **npm** (v9 or higher)

### 2. Start the Application
The backend automatically serves both the REST API and the built React frontend on port `5000`:

```bash
# Start the unified server
node server/index.js
```

Now open your web browser at:
👉 **`http://localhost:5000`**

### 3. Development Mode (Optional)
If you wish to run the Vite hot-reloading development server alongside the backend:

```bash
# Terminal 1: Backend API
node server/index.js

# Terminal 2: Frontend Vite Dev Server
npm run client
```

Vite will run on **`http://localhost:3000`** and automatically proxy API calls to **`http://localhost:5000`**.

---

## 🗄️ Database Architecture (`hotel.db`)

The SQLite database includes pre-loaded sample luxury suites, executive rooms, room service dishes, and active guest bookings:

- `settings`: Hotel profile, GSTIN, currency, tax rates, invoice terms.
- `rooms`: Room inventory, floors, base rates, amenities, and real-time status.
- `guests`: Identity information, phone numbers, ID proof details.
- `bookings`: Active guest stays, check-in timestamps, advance deposits.
- `menu_items`: Dining, beverages, laundry, and hotel amenities.
- `orders`: Kitchen Order Tickets (KOT) and room service charges.
- `invoices`: Settled tax invoices with itemized JSON breakdown and payment references.
