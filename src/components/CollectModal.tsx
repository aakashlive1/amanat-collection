import React, { useState } from 'react';
import { Member, PaymentMode, User } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/formatters';
import { buildWhatsAppReceiptUrl } from '../utils/whatsapp';
import confetti from 'canvas-confetti';
import { X, CheckCircle2, Banknote, QrCode, MessageSquare, ArrowRight, User as UserIcon } from 'lucide-react';

interface CollectModalProps {
  member: Member;
  collector: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const CollectModal: React.FC<CollectModalProps> = ({
  member,
  collector,
  onClose,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<number>(member.dailyAmount || 100);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTxId, setCompletedTxId] = useState<string | null>(null);

  // Synchronous lock to prevent fast double-tap duplicate submissions on mobile
  const submittingLockRef = React.useRef(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingLockRef.current || isSubmitting) return;

    if (amount <= 0) {
      alert('Please enter an amount greater than 0');
      return;
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);

    try {
      const tx = store.addTransaction({
        memberId: member.id,
        collectorId: collector.id,
        amount,
        paymentMode,
        utrNumber: paymentMode === 'online' ? utrNumber : undefined,
        notes,
        status: 'completed',
      });

      // Confetti celebration
      try {
        confetti({
          particleCount: 60,
          spread: 60,
          origin: { y: 0.7 },
        });
      } catch {
        // Ignore confetti if not available
      }

      setCompletedTxId(tx.id);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to record collection');
    } finally {
      submittingLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const settings = store.getSettings();

  // WhatsApp receipt link
  const whatsappUrl = buildWhatsAppReceiptUrl({
    memberPhone: member.phone,
    memberName: member.name,
    memberCode: member.code,
    amount,
    paymentMode,
    collectorName: collector.name,
    uniqueToken: member.uniqueToken,
    appName: settings.appName,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {member.name}
              </h2>
              <p className="text-xs font-semibold text-emerald-600">
                Code: {member.code} • {member.phone}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {completedTxId ? (
            /* Success State */
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-900">
                Payment Recorded Successfully!
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {formatCurrency(amount)} ({paymentMode === 'cash' ? 'Cash' : 'Online UPI'}) received
              </p>

              <div className="mt-6 space-y-3">
                {/* WhatsApp Receipt Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Send WhatsApp Receipt (Free)</span>
                </a>

                <button
                  onClick={onClose}
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            /* Collection Entry Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Daily Fixed Amount notice */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
                <span>Fixed Daily Installment:</span>
                <span className="font-extrabold text-slate-900 text-sm">
                  {formatCurrency(member.dailyAmount)}
                </span>
              </div>

              {/* Amount Input with Quick Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount to Collect
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={e => setAmount(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xl font-black text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                  />
                </div>

                {/* Quick amount adjusters */}
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {[member.dailyAmount, member.dailyAmount * 2, 500, 1000].filter(
                    (v, i, a) => v > 0 && a.indexOf(v) === i
                  ).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                        amount === val
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Mode (Cash vs Online) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Payment Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl border-2 font-bold transition ${
                      paymentMode === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Banknote className="w-5 h-5 text-emerald-600" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`flex items-center justify-center space-x-2 py-3 px-3 rounded-xl border-2 font-bold transition ${
                      paymentMode === 'online'
                        ? 'border-blue-600 bg-blue-50 text-blue-800 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-blue-600" />
                    <span>Online UPI</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {paymentMode === 'cash'
                    ? '⚠️ This amount is added to your Cash in Hand balance.'
                    : 'ℹ️ This amount was transferred directly to the company bank account.'}
                </p>
              </div>

              {/* Online Ref / UTR if Online */}
              {paymentMode === 'online' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    UPI / UTR / Reference No. (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 423981293812"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-hidden transition"
                  />
                </div>
              )}

              {/* Optional Note */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Note / Remarks (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Paid at shop counter"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-black text-base shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                <span>Record Collection ({formatCurrency(amount)})</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
