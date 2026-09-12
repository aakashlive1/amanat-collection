import React, { useState } from 'react';
import { Member, PaymentMode, User } from '../types';
import { store } from '../services/store';
import { formatCurrency } from '../utils/formatters';
import { buildWhatsAppWithdrawalReceiptUrl } from '../utils/whatsapp';
import {
  X,
  CheckCircle2,
  Banknote,
  QrCode,
  MessageSquare,
  ArrowDownCircle,
  AlertCircle,
  Wallet,
  ArrowRight,
} from 'lucide-react';

interface WithdrawModalProps {
  member: Member;
  processedBy: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  member,
  processedBy,
  onClose,
  onSuccess,
}) => {
  const balanceInfo = store.getMemberBalance(member.id);
  const [amount, setAmount] = useState<number | ''>('');
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [utrNumber, setUtrNumber] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedTxId, setCompletedTxId] = useState<string | null>(null);
  const [recordedAmount, setRecordedAmount] = useState<number>(0);

  // Synchronous lock to prevent mobile fast double-tap duplicate submissions
  const submittingLockRef = React.useRef(false);

  // Collector physical cash in hand check
  const isCollector = processedBy.role === 'collector';
  const collectorStats = isCollector ? store.getCollectorTodayStats(processedBy.id) : null;
  const collectorCashInHand = collectorStats ? Math.max(0, collectorStats.cashCollected) : 0;

  const netBalance = balanceInfo.netBalance;
  const numAmount = Number(amount) || 0;
  const isOverBalance = numAmount > netBalance;
  const isOverCashInHand = isCollector && paymentMode === 'cash' && numAmount > collectorCashInHand;
  const remainingBalanceAfter = Math.max(0, netBalance - (completedTxId ? recordedAmount : numAmount));

  const quickPresets = [500, 1000, 2000, 5000].filter(val => val <= netBalance);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (submittingLockRef.current || isSubmitting) return;

    if (numAmount <= 0) {
      alert('Please enter a valid amount greater than 0');
      return;
    }

    if (numAmount > netBalance) {
      alert(`Cannot withdraw more than available net balance of ${formatCurrency(netBalance)}`);
      return;
    }

    // Loophole 4: Block negative collector cash in hand
    if (isCollector && paymentMode === 'cash') {
      if (numAmount > collectorCashInHand) {
        alert(
          `Insufficient Cash in Hand! You currently hold ${formatCurrency(collectorCashInHand)} physical cash collected today. ` +
          `You cannot pay out ${formatCurrency(numAmount)} in cash. Please choose Online payout or ask Super Admin.`
        );
        return;
      }
    }

    submittingLockRef.current = true;
    setIsSubmitting(true);

    try {
      const tx = store.addTransaction({
        memberId: member.id,
        collectorId: processedBy.id,
        amount: numAmount,
        paymentMode,
        txType: 'withdrawal',
        utrNumber: paymentMode === 'online' ? utrNumber : undefined,
        notes: notes.trim() || undefined,
        status: 'completed',
      });

      setRecordedAmount(numAmount);
      setCompletedTxId(tx.id);
      onSuccess();
    } catch (err) {
      console.error(err);
      alert('Failed to process withdrawal');
    } finally {
      submittingLockRef.current = false;
      setIsSubmitting(false);
    }
  };

  const settings = store.getSettings();

  const whatsappUrl = buildWhatsAppWithdrawalReceiptUrl({
    memberPhone: member.phone,
    memberName: member.name,
    memberCode: member.code,
    amount: recordedAmount,
    paymentMode,
    processedByName: processedBy.name,
    remainingBalance: remainingBalanceAfter,
    uniqueToken: member.uniqueToken,
    appName: settings.appName,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white w-full max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Member Payout / Withdrawal
              </h2>
              <p className="text-xs font-semibold text-slate-500">
                {member.name} • {member.code}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition"
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
              <h3 className="text-xl font-black text-slate-900">
                Payout Processed Successfully!
              </h3>
              <p className="text-sm font-semibold text-slate-500 mt-1">
                {formatCurrency(recordedAmount)} paid via {paymentMode === 'cash' ? 'Cash' : 'Online UPI'}
              </p>

              {/* Updated Balance Card */}
              <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                  <span>Total Collected So Far:</span>
                  <span className="font-bold text-slate-700">{formatCurrency(balanceInfo.totalDeposited)}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-amber-700 font-semibold">
                  <span>Total Withdrawn / Payout:</span>
                  <span className="font-bold text-amber-700">{formatCurrency(balanceInfo.totalWithdrawn + recordedAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-sm">
                  <span className="font-bold text-slate-800">Remaining Net Balance:</span>
                  <span className="font-extrabold text-emerald-600 text-base">{formatCurrency(remainingBalanceAfter)}</span>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {/* WhatsApp Receipt Button */}
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold shadow-md shadow-emerald-200 transition"
                >
                  <MessageSquare className="w-5 h-5" />
                  <span>Send WhatsApp Payout Receipt</span>
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
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Member Balance Overview */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-indigo-50 rounded-2xl border border-emerald-100">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Wallet className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                      Available Wallet Balance
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-700">
                    {formatCurrency(netBalance)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-emerald-200/60 text-slate-600 font-medium">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Total Deposited:</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(balanceInfo.totalDeposited)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Past Withdrawals:</span>
                    <span className="font-bold text-amber-600">{formatCurrency(balanceInfo.totalWithdrawn)}</span>
                  </div>
                </div>
              </div>

              {netBalance <= 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-amber-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>This member has ₹0 available balance. A withdrawal cannot be processed.</span>
                </div>
              )}

              {/* Amount Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payout Amount (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">
                    ₹
                  </span>
                  <input
                    type="number"
                    inputMode="numeric"
                    required
                    min="1"
                    max={netBalance}
                    value={amount}
                    onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Enter amount to withdraw"
                    disabled={netBalance <= 0}
                    className={`w-full pl-9 pr-4 py-3 bg-slate-50 border text-xl font-extrabold rounded-xl focus:outline-none focus:ring-2 transition ${
                      isOverBalance
                        ? 'border-rose-400 focus:ring-rose-200 text-rose-600'
                        : 'border-slate-200 focus:ring-amber-200 text-slate-800'
                    }`}
                  />
                </div>

                {isOverBalance && (
                  <p className="mt-1 text-xs font-bold text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Cannot exceed available net balance of {formatCurrency(netBalance)}
                  </p>
                )}

                {/* Quick Presets */}
                {netBalance > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {quickPresets.map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition active:scale-95 ${
                          numAmount === preset
                            ? 'bg-amber-600 text-white border-amber-600'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        ₹{preset}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAmount(netBalance)}
                      className="text-xs px-3 py-1.5 rounded-lg border font-bold transition active:scale-95 bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100"
                    >
                      Full Balance ({formatCurrency(netBalance)})
                    </button>
                  </div>
                )}
              </div>

              {/* Payment Mode Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payout Mode
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMode('cash')}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition ${
                      paymentMode === 'cash'
                        ? 'border-amber-600 bg-amber-50/60 text-amber-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <Banknote className="w-4 h-4" />
                    <span>Cash Handover</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode('online')}
                    className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl border-2 font-bold text-sm transition ${
                      paymentMode === 'online'
                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Bank / Online UPI</span>
                  </button>
                </div>
                {isCollector && paymentMode === 'cash' && (
                  <div className={`mt-2 p-2.5 rounded-xl text-xs flex items-center justify-between font-bold ${
                    isOverCashInHand ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                    <span>Collector Physical Cash in Hand Today:</span>
                    <span className="font-black font-mono">{formatCurrency(collectorCashInHand)}</span>
                  </div>
                )}
                {isOverCashInHand && (
                  <p className="mt-1 text-xs font-bold text-rose-600 flex items-center space-x-1">
                    <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                    Cannot exceed your today's physical cash in hand of {formatCurrency(collectorCashInHand)}. Choose Online Payout or ask Super Admin.
                  </p>
                )}
              </div>

              {/* Optional UTR for online payout */}
              {paymentMode === 'online' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Bank UTR / UPI Ref ID (Optional)
                  </label>
                  <input
                    type="text"
                    value={utrNumber}
                    onChange={e => setUtrNumber(e.target.value)}
                    placeholder="e.g. 423984192834"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              )}

              {/* Notes / Reason */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason / Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="e.g. Returned ₹8,000 to member for business expense..."
                  rows={2}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 text-slate-800 text-sm font-medium rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
                />
              </div>

              {/* Balance preview */}
              {numAmount > 0 && !isOverBalance && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex justify-between items-center text-slate-600">
                  <span>Balance After Withdrawal:</span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {formatCurrency(netBalance - numAmount)}
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting || netBalance <= 0 || numAmount <= 0 || isOverBalance || isOverCashInHand}
                  className="w-full flex items-center justify-center space-x-2 py-3.5 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold shadow-md shadow-amber-200 transition active:scale-[0.98]"
                >
                  <span>{isSubmitting ? 'Processing Payout...' : 'Confirm & Process Payout'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
