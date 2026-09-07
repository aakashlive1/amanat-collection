import React, { useState } from 'react';
import { Member, User } from '../types';
import { store } from '../services/store';
import { X, Copy, Check, MessageSquare, ExternalLink } from 'lucide-react';

interface MemberModalProps {
  member?: Member | null;
  collectors: User[];
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberModal: React.FC<MemberModalProps> = ({
  member,
  collectors,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(member?.name || '');
  const [phone, setPhone] = useState(member?.phone || '');
  const [code, setCode] = useState(member?.code || '');
  const [dailyAmount, setDailyAmount] = useState<number>(member?.dailyAmount || 200);
  const [address, setAddress] = useState(member?.address || '');
  const [assignedCollectorId, setAssignedCollectorId] = useState(
    member?.assignedCollectorId || (collectors[0]?.id || '')
  );
  const [pin, setPin] = useState(member?.pin || '1234');
  const [isActive, setIsActive] = useState(member?.isActive ?? true);
  const [copied, setCopied] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || dailyAmount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    store.saveMember({
      id: member?.id,
      name,
      phone,
      code,
      dailyAmount,
      address,
      assignedCollectorId,
      pin,
      isActive,
    });

    onSuccess();
  };

  const passbookUrl = member
    ? `${window.location.origin}/#/m/${member.uniqueToken}`
    : null;

  const handleCopyLink = () => {
    if (passbookUrl) {
      navigator.clipboard.writeText(passbookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareWhatsApp = () => {
    if (!member || !passbookUrl) return;
    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const text = `Hello ${member.name}! Your Amanat Collection digital passbook is active.\n` +
      `Passbook Link: ${passbookUrl}\n` +
      `Your 4-Digit Security PIN: ${member.pin}\n\n` +
      `Use this link to check your deposit history and make direct UPI payments anytime.`;

    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-slate-900">
            {member ? 'Edit Member Details' : 'Add New Member'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Member Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g. Ramesh Sharma"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Mobile Number *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="e.g. 9811100001"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Member Code (Auto/Manual)
              </label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="e.g. AC-107"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Daily Fixed Amount *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={dailyAmount}
                  onChange={e => setDailyAmount(Number(e.target.value))}
                  className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-extrabold text-emerald-700 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Assigned Collector
              </label>
              <select
                value={assignedCollectorId}
                onChange={e => setAssignedCollectorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              >
                <option value="">None (Unassigned)</option>
                {collectors.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.canCollectAll ? 'All Members' : 'Assigned Only'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4-Digit Security PIN
              </label>
              <input
                type="password"
                maxLength={4}
                required
                value={pin}
                onChange={e => setPin(e.target.value)}
                placeholder="1234"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Address / Shop Details
            </label>
            <input
              type="text"
              value={address}
              onChange={e => setAddress(e.target.value)}
              placeholder="e.g. Shop 12, Main Market Road"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div className="flex items-center space-x-2 pt-1">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={e => setIsActive(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded-sm border-slate-300 focus:ring-emerald-500"
            />
            <label htmlFor="isActive" className="text-xs font-bold text-slate-700">
              Active Member Account
            </label>
          </div>

          {/* Member Unique Passbook Link Section if editing */}
          {member && passbookUrl && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-700 block">
                Member Passbook Link (Unique URL):
              </span>
              <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white p-2 rounded-lg border border-slate-200 font-mono truncate">
                <span className="truncate flex-1">{passbookUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="p-1 text-slate-600 hover:text-emerald-600"
                  title="Copy"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <a
                  href={`/#/m/${member.uniqueToken}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 text-slate-600 hover:text-blue-600"
                  title="Open Passbook"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2 px-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Send Passbook Link to Member on WhatsApp</span>
              </button>
            </div>
          )}

          <div className="flex items-center space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="w-1/2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition"
            >
              {member ? 'Update Member' : 'Save Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
