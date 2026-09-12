import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { X, Trash2, KeyRound, Eye, EyeOff } from 'lucide-react';
import { DeleteConfirmModal } from './DeleteConfirmModal';

interface CollectorModalProps {
  collector?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const CollectorModal: React.FC<CollectorModalProps> = ({
  collector,
  onClose,
  onSuccess,
}) => {
  const [name, setName] = useState(collector?.name || '');
  const [phone, setPhone] = useState(collector?.phone || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [canCollectAll, setCanCollectAll] = useState(collector?.canCollectAll ?? false);
  const [canVerifyPayments, setCanVerifyPayments] = useState(collector?.canVerifyPayments ?? false);
  const [canWithdraw, setCanWithdraw] = useState(collector?.canWithdraw ?? false);
  const [isActive, setIsActive] = useState(collector?.isActive ?? true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please fill in name and mobile number');
      return;
    }

    if (!collector && (!password.trim() || password.trim().length < 4)) {
      alert('Please provide a login password with at least 4 characters');
      return;
    }

    if (collector && password.trim() && password.trim().length < 4) {
      alert('Password must have at least 4 characters');
      return;
    }

    store.saveCollector({
      id: collector?.id,
      name,
      phone,
      password: password.trim() || undefined,
      canCollectAll,
      canVerifyPayments,
      canWithdraw,
      isActive,
    });

    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            {collector ? 'Edit Collector Details' : 'Add New Collector'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Collector Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Rajesh Kumar"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number (Login ID) *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="e.g. 9822011111"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">
                {collector ? 'Reset / Change Password' : 'Collector Login Password *'}
              </label>
              {collector && (
                <span className="text-[10px] text-slate-400 font-medium">
                  (Optional - leave blank to keep current)
                </span>
              )}
            </div>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required={!collector}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={collector ? 'Enter new password to reset' : 'Min 4 characters (e.g. coll123)'}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-400 hover:text-slate-600 absolute right-3 top-1/2 -translate-y-1/2"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {collector
                ? 'Only enter a new password if you wish to reset or change it.'
                : 'Collector will use their mobile number and this password to log in.'}
            </p>
          </div>

          {/* Super Admin Special Permission: Can collect from all members */}
          <div className="p-3 rounded-xl border border-purple-200 bg-purple-50/60 space-y-2">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="canCollectAll"
                checked={canCollectAll}
                onChange={e => setCanCollectAll(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-purple-600 rounded-sm border-purple-300 focus:ring-purple-500"
              />
              <div>
                <label htmlFor="canCollectAll" className="text-xs font-extrabold text-purple-950 block">
                  Allow Collection from All Members (Company-wide)
                </label>
                <p className="text-[11px] text-purple-800 font-medium mt-0.5 leading-snug">
                  {canCollectAll
                    ? '✅ Can search and collect payments from any registered member.'
                    : '🔒 Restricted to collecting payments only from assigned members.'}
                </p>
              </div>
            </div>
          </div>

          {/* Super Admin Special Permission: Can verify online UPI payments */}
          <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/60 space-y-2">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="canVerifyPayments"
                checked={canVerifyPayments}
                onChange={e => setCanVerifyPayments(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-blue-600 rounded-sm border-blue-300 focus:ring-blue-500"
              />
              <div>
                <label htmlFor="canVerifyPayments" className="text-xs font-extrabold text-blue-950 block">
                  Allow Online UPI Payment Verification
                </label>
                <p className="text-[11px] text-blue-800 font-medium mt-0.5 leading-snug">
                  {canVerifyPayments
                    ? '✅ This collector can verify and approve members’ self-paid online UTR submissions.'
                    : '🔒 Only Super Admin will verify online UPI payments.'}
                </p>
              </div>
            </div>
          </div>

          {/* Super Admin Special Permission: Can process member withdrawals / payouts */}
          <div className="p-3 rounded-xl border border-amber-200 bg-amber-50/60 space-y-2">
            <div className="flex items-start space-x-2.5">
              <input
                type="checkbox"
                id="canWithdraw"
                checked={canWithdraw}
                onChange={e => setCanWithdraw(e.target.checked)}
                className="w-4 h-4 mt-0.5 text-amber-600 rounded-sm border-amber-300 focus:ring-amber-500"
              />
              <div>
                <label htmlFor="canWithdraw" className="text-xs font-extrabold text-amber-950 block">
                  Allow Member Withdrawals / Payouts
                </label>
                <p className="text-[11px] text-amber-800 font-medium mt-0.5 leading-snug">
                  {canWithdraw
                    ? '✅ This collector can process cash & online payouts/deductions for members.'
                    : '🔒 Member withdrawals are restricted to Super Admin only.'}
                </p>
              </div>
            </div>
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
              Active Account Status
            </label>
          </div>

          <div className="flex items-center justify-between space-x-2 pt-2">
            {collector ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2.5 px-3 bg-red-50 hover:bg-red-100 active:scale-[0.98] text-red-600 rounded-xl font-bold text-xs transition flex items-center space-x-1"
                title="Delete Collector"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition"
              >
                {collector ? 'Update Collector' : 'Create Collector'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Delete Collector Confirmation Modal */}
      {collector && (
        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          title="Delete Collector"
          itemName={collector.name}
          itemDetails={`Phone: ${collector.phone} • Role: Collector`}
          warningText="Are you sure you want to permanently delete this collector? Any members currently assigned to this collector will become unassigned. This action cannot be undone."
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => {
            store.deleteCollector(collector.id);
            setShowDeleteConfirm(false);
            onSuccess();
          }}
        />
      )}
    </div>
  );
};
