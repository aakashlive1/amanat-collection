import React, { useState } from 'react';
import { store } from '../../services/store';
import { QRCodeSVG } from 'qrcode.react';
import { buildUpiUri } from '../../utils/upi';
import { Settings as SettingsIcon, QrCode, Save, Check, ShieldCheck, Lock, AlertCircle, Phone } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  const currentSettings = store.getSettings();
  const currentAdmin = store.getUsers().find(u => u.role === 'admin') || store.getAuthUser();

  // Branding & UPI state
  const [upiVpa, setUpiVpa] = useState(currentSettings.upiVpa);
  const [upiName, setUpiName] = useState(currentSettings.upiName);
  const [appName, setAppName] = useState(currentSettings.appName);
  const [supportPhone, setSupportPhone] = useState(currentSettings.supportPhone);
  const [saved, setSaved] = useState(false);

  // Security & Password state
  const [adminPhone, setAdminPhone] = useState(currentAdmin?.phone || '9876543210');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securitySuccess, setSecuritySuccess] = useState('');
  const [securityError, setSecurityError] = useState('');
  const [updatingSecurity, setUpdatingSecurity] = useState(false);

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

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSecurityError('');
    setSecuritySuccess('');

    if (newPassword && newPassword.length < 6) {
      setSecurityError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setSecurityError('New password and confirm password do not match.');
      return;
    }

    if (!adminPhone.trim()) {
      setSecurityError('Admin mobile number cannot be empty.');
      return;
    }

    setUpdatingSecurity(true);

    const result = store.updateAdminCredentials({
      phone: adminPhone.trim(),
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    });

    setUpdatingSecurity(false);

    if (result.success) {
      setSecuritySuccess(result.message);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setSecuritySuccess(''), 4000);
    } else {
      setSecurityError(result.message);
    }
  };

  const previewUpiUri = buildUpiUri({
    upiVpa: upiVpa || 'amanat@upi',
    upiName: upiName || 'Amanat Collection',
    amount: 100,
    note: 'Test Payment Preview',
  });

  return (
    <div className="space-y-6 pb-20 max-w-2xl mx-auto">
      {/* Super Admin Security & Credentials */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center space-x-2 pb-3 mb-4 border-b border-slate-100">
          <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">
              Super Admin Account & Password
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Update Super Admin login mobile number and change your security password.
            </p>
          </div>
        </div>

        {securitySuccess && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{securitySuccess}</span>
          </div>
        )}

        {securityError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2 text-red-800 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{securityError}</span>
          </div>
        )}

        <form onSubmit={handleSecuritySubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Admin Login Mobile Number *
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                maxLength={10}
                placeholder="10-digit mobile number"
                value={adminPhone}
                onChange={e => setAdminPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              This mobile number will be required to log in to the Super Admin portal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Current Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-purple-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={updatingSecurity}
            className="py-2.5 px-4 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Update Super Admin Credentials</span>
          </button>
        </form>
      </div>

      {/* System & UPI Settings */}
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
