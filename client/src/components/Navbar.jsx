import React, { useState, useEffect } from 'react';
import {
  Building2,
  LayoutDashboard,
  BedDouble,
  UtensilsCrossed,
  Receipt,
  FileText,
  Settings,
  UserPlus,
  Clock,
  Sparkles
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  onOpenCheckIn,
  onOpenSettings,
  settings,
  dashboardStats
}) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'rooms', label: 'Rooms & Matrix', icon: BedDouble },
    { id: 'pos', label: 'Food & Service POS', icon: UtensilsCrossed },
    { id: 'checkout', label: 'Checkout & Folio', icon: Receipt },
    { id: 'invoices', label: 'Invoice Archive', icon: FileText }
  ];

  const occupancyRate = dashboardStats?.rooms?.occupancyRate || 0;

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 select-none shadow-xl print-hide">
      {/* Top utility bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Hotel Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white flex items-center gap-1.5">
                  {settings?.hotel_name || 'Grand Aurelia Hotel'}
                  <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    Smart OS
                  </span>
                </span>
              </div>
              <p className="text-xs text-slate-400 -mt-0.5 hidden sm:block">
                {settings?.tagline || 'Intelligent Billing & Front Desk POS'}
              </p>
            </div>
          </div>

          {/* Center Info / Live Clock & Occupancy */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {time.toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' })}
              </span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-amber-300 font-medium">
                {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            </div>

            <div className="flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-400">Occupancy:</span>
              <span className="font-semibold text-emerald-400">{occupancyRate}%</span>
              <span className="text-slate-500">({dashboardStats?.rooms?.occupied || 0}/{dashboardStats?.rooms?.total || 0} Rooms)</span>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              onClick={onOpenCheckIn}
              className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm rounded-lg shadow-md shadow-amber-500/25 transition-all duration-150 active:scale-95"
            >
              <UserPlus className="w-4 h-4 stroke-[2.5]" />
              <span>New Check-In</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Hotel & Tax Settings"
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg border border-slate-700/60 transition"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary Navigation Tabs */}
      <nav className="bg-slate-950/70 border-t border-slate-800/60 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
