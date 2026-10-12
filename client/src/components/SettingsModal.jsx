import React, { useState } from 'react';
import {
  X,
  Settings,
  Building2,
  Percent,
  Receipt,
  CheckCircle2,
  Save,
  Globe,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings
}) {
  if (!isOpen) return null;

  const [form, setForm] = useState({
    hotel_name: settings?.hotel_name || '',
    tagline: settings?.tagline || '',
    address: settings?.address || '',
    phone: settings?.phone || '',
    email: settings?.email || '',
    website: settings?.website || '',
    gstin: settings?.gstin || '',
    currency_symbol: settings?.currency_symbol || '₹',
    currency_code: settings?.currency_code || 'INR',
    default_cgst_rate: settings?.default_cgst_rate || 6.0,
    default_sgst_rate: settings?.default_sgst_rate || 6.0,
    service_charge_rate: settings?.service_charge_rate || 0.0,
    invoice_prefix: settings?.invoice_prefix || 'INV-2026-',
    invoice_terms: settings?.invoice_terms || ''
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update settings');

      setSuccess(true);
      if (onSaveSettings) onSaveSettings(form);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Hotel Branding & Tax Settings</h2>
            <p className="text-xs text-slate-400">Configure receipt header, GST rates, and invoice prefix</p>
          </div>
        </div>

        {success && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Settings updated successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Hotel Identity */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Hotel Information
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Hotel Legal Name *</label>
                <input
                  type="text"
                  value={form.hotel_name}
                  onChange={(e) => handleChange('hotel_name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Tagline / Subtitle</label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-xs text-slate-300 block mb-1">Full Property Address *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Reception Phone *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Official Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
                  required
                />
              </div>
            </div>
          </div>

          {/* Tax & Invoicing Rules */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-400 tracking-wider">
              Taxes, GST & Invoice Format
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">GSTIN / Tax ID</label>
                <input
                  type="text"
                  value={form.gstin}
                  onChange={(e) => handleChange('gstin', e.target.value)}
                  placeholder="33AABCG1234F1Z8"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Currency Symbol</label>
                <input
                  type="text"
                  value={form.currency_symbol}
                  onChange={(e) => handleChange('currency_symbol', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={form.invoice_prefix}
                  onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">CGST Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.default_cgst_rate}
                  onChange={(e) => handleChange('default_cgst_rate', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">SGST Rate (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={form.default_sgst_rate}
                  onChange={(e) => handleChange('default_sgst_rate', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Combined GST Rate</label>
                <div className="px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-amber-400 font-mono font-bold">
                  {(Number(form.default_cgst_rate) || 0) + (Number(form.default_sgst_rate) || 0)}% Total
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-300 block mb-1">Receipt Terms & Conditions</label>
              <textarea
                value={form.invoice_terms}
                onChange={(e) => handleChange('invoice_terms', e.target.value)}
                rows="2"
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-400"
              ></textarea>
            </div>
          </div>

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
              disabled={saving}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>{saving ? 'Saving...' : 'Save Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
