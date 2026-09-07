import React, { useState } from 'react';
import { store } from '../../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUri } from '../../utils/upi';
import { Settings as SettingsIcon, QrCode, Save, Check } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const currentSettings = store.getSettings();

  const [upiVpa, setUpiVpa] = useState(currentSettings.upiVpa);
  const [upiName, setUpiName] = useState(currentSettings.upiName);
  const [appName, setAppName] = useState(currentSettings.appName);
  const [supportPhone, setSupportPhone] = useState(currentSettings.supportPhone);
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateSettings({
      upiVpa: upiVpa.trim(),
      upiName: upiName.trim(),
      appName: appName.trim(),
      supportPhone: supportPhone.trim(),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const previewUpiUri = buildUpiUri({
    upiVpa: upiVpa || 'amanat@upi',
    upiName: upiName || 'Amanat Collection',
    amount: 100,
    note: 'Test Payment Preview',
  });

  return (
    <div className="space-y-5 pb-20 max-w-2xl mx-auto">
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <SettingsIcon className="w-5 h-5 text-purple-600" />
          <span>System & UPI Settings</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Configure company UPI VPA, QR codes, payee name, and branding details anytime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Settings Form */}
        <form
          onSubmit={handleSubmit}
          className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 space-y-4 shadow-xs"
        >
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Application Brand Name
            </label>
            <input
              type="text"
              required
              value={appName}
              onChange={e => setAppName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Company UPI ID / VPA *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. amanatcollection@okaxis"
              value={upiVpa}
              onChange={e => setUpiVpa(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-emerald-800 focus:bg-white focus:border-emerald-500 outline-hidden"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              When members pay via passbook or scan QR, payments will route directly to this UPI address.
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              UPI Payee / Merchant Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Amanat Collection"
              value={upiName}
              onChange={e => setUpiName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Support Helpline Phone
            </label>
            <input
              type="tel"
              value={supportPhone}
              onChange={e => setSupportPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-purple-200 transition flex items-center justify-center space-x-1.5"
          >
            {saved ? (
              <>
                <Check className="w-4 h-4 text-white" />
                <span>Settings Saved Successfully!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Settings</span>
              </>
            )}
          </button>
        </form>

        {/* Live UPI QR Preview */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col items-center justify-center text-center shadow-xs">
          <div className="flex items-center space-x-1 text-slate-700 font-bold text-xs mb-3">
            <QrCode className="w-4 h-4 text-emerald-600" />
            <span>Live QR Preview</span>
          </div>

          <div className="p-3 bg-white border-2 border-slate-100 rounded-2xl shadow-inner">
            <QRCodeSVG value={previewUpiUri} size={150} level="M" />
          </div>

          <p className="text-xs font-black text-slate-900 mt-3">{upiName}</p>
          <p className="text-[11px] font-mono text-emerald-700 font-bold break-all mt-0.5">
            {upiVpa}
          </p>
          <p className="text-[10px] text-slate-400 mt-2">
            This live dynamic QR code displays in customer passbooks with their daily amount.
          </p>
        </div>
      </div>
    </div>
  );
};
