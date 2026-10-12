import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import RoomsGrid from './components/RoomsGrid';
import POSModule from './components/POSModule';
import CheckoutFolio from './components/CheckoutFolio';
import InvoiceArchive from './components/InvoiceArchive';
import CheckInModal from './components/CheckInModal';
import AddRoomModal from './components/AddRoomModal';
import SettingsModal from './components/SettingsModal';
import PrintInvoiceModal from './components/PrintInvoiceModal';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInRoomId, setCheckInRoomId] = useState(null);
  const [isAddRoomOpen, setIsAddRoomOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [printableInvoice, setPrintableInvoice] = useState(null);
  const [isPrintInvoiceOpen, setIsPrintInvoiceOpen] = useState(false);

  // Context passing
  const [selectedBookingForFolio, setSelectedBookingForFolio] = useState(null);
  const [posSelectedRoom, setPosSelectedRoom] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  }

  // Load core application data
  async function refreshData() {
    try {
      const [dashRes, roomsRes, setRes] = await Promise.all([
        fetch('/api/dashboard').then((r) => r.json()),
        fetch('/api/rooms').then((r) => r.json()),
        fetch('/api/settings').then((r) => r.json())
      ]);

      setDashboardStats(dashRes);
      setRooms(roomsRes);
      setSettings(setRes);
    } catch (err) {
      console.error('Error refreshing app data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshData();
  }, []);

  // Handlers
  function handleOpenCheckIn(roomId = null) {
    setCheckInRoomId(roomId);
    setIsCheckInOpen(true);
  }

  function handleSelectRoomForFolio(bookingId) {
    setSelectedBookingForFolio(bookingId);
    setActiveTab('checkout');
  }

  function handleOpenPOSForRoom(room) {
    setPosSelectedRoom(room);
    setActiveTab('pos');
  }

  async function handleUpdateRoomStatus(roomId, newStatus) {
    try {
      const res = await fetch(`/api/rooms/${roomId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        showToast(`Room status updated to ${newStatus}`);
        refreshData();
      }
    } catch (err) {
      showToast('Failed to update status', 'error');
    }
  }

  async function handleSelectInvoiceToView(invoiceId) {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const inv = await res.json();
      setPrintableInvoice(inv);
      setIsPrintInvoiceOpen(true);
    } catch (err) {
      showToast('Could not load invoice details', 'error');
    }
  }

  function handleCheckoutSuccess(invoice) {
    showToast(`Check-out completed! Invoice ${invoice.invoice_number} generated.`);
    refreshData();
    setPrintableInvoice(invoice);
    setIsPrintInvoiceOpen(true);
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl text-xs sm:text-sm animate-bounce print-hide">
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          )}
          <span className="font-semibold text-white">{toast.message}</span>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCheckIn={() => handleOpenCheckIn()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        settings={settings}
        dashboardStats={dashboardStats}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-slate-400">
              Loading Grand Aurelia Smart Billing OS...
            </p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard
                dashboardStats={dashboardStats}
                rooms={rooms}
                settings={settings}
                setActiveTab={setActiveTab}
                onOpenCheckIn={handleOpenCheckIn}
                onSelectRoomForFolio={handleSelectRoomForFolio}
                onSelectInvoiceToView={handleSelectInvoiceToView}
                onUpdateRoomStatus={handleUpdateRoomStatus}
              />
            )}

            {activeTab === 'rooms' && (
              <RoomsGrid
                rooms={rooms}
                settings={settings}
                onOpenCheckIn={handleOpenCheckIn}
                onSelectRoomForFolio={handleSelectRoomForFolio}
                onOpenPOSForRoom={handleOpenPOSForRoom}
                onUpdateRoomStatus={handleUpdateRoomStatus}
                onOpenAddRoom={() => setIsAddRoomOpen(true)}
              />
            )}

            {activeTab === 'pos' && (
              <POSModule
                rooms={rooms}
                settings={settings}
                preselectedRoom={posSelectedRoom}
                onOrderCompleted={() => {
                  refreshData();
                  showToast('Order recorded successfully!');
                }}
              />
            )}

            {activeTab === 'checkout' && (
              <CheckoutFolio
                rooms={rooms}
                settings={settings}
                preselectedBookingId={selectedBookingForFolio}
                onCheckoutSuccess={handleCheckoutSuccess}
              />
            )}

            {activeTab === 'invoices' && (
              <InvoiceArchive
                settings={settings}
                onSelectInvoiceToView={handleSelectInvoiceToView}
              />
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 text-center text-xs text-slate-500 print-hide">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {settings?.hotel_name || 'Grand Aurelia Hotel'} &copy; {new Date().getFullYear()} — Smart Billing & PMS System
          </p>
          <p className="text-slate-400">
            GST Compliant &bull; Live Folio Consolidation &bull; Automated Tax Invoices
          </p>
        </div>
      </footer>

      {/* Modals */}
      <CheckInModal
        isOpen={isCheckInOpen}
        onClose={() => {
          setIsCheckInOpen(false);
          setCheckInRoomId(null);
        }}
        preselectedRoomId={checkInRoomId}
        rooms={rooms}
        settings={settings}
        onCheckInSuccess={() => {
          refreshData();
          showToast('Guest checked in successfully!');
        }}
      />

      <AddRoomModal
        isOpen={isAddRoomOpen}
        onClose={() => setIsAddRoomOpen(false)}
        settings={settings}
        onRoomAdded={() => {
          refreshData();
          showToast('Room added to inventory!');
        }}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          refreshData();
          showToast('Settings saved!');
        }}
      />

      <PrintInvoiceModal
        isOpen={isPrintInvoiceOpen}
        onClose={() => {
          setIsPrintInvoiceOpen(false);
          setPrintableInvoice(null);
        }}
        invoice={printableInvoice}
        settings={settings}
      />
    </div>
  );
}
