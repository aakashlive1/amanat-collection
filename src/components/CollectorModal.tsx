import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { X } from 'lucide-react';

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
  const [canCollectAll, setCanCollectAll] = useState(collector?.canCollectAll ?? false);
  const [canVerifyPayments, setCanVerifyPayments] = useState(collector?.canVerifyPayments ?? false);
  const [isActive, setIsActive] = useState(collector?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert('Please fill in name and mobile number');
      return;
    }

    store.saveCollector({
      id: collector?.id,
      name,
      phone,
      canCollectAll,
      canVerifyPayments,
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
              {collector ? 'Update Collector' : 'Create Collector'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
