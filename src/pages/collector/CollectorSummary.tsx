import React, { useState } from 'react';
import { User } from '../../types';
import { store } from '../../services/store';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { buildWhatsAppReceiptUrl } from '../../utils/whatsapp';
import {
  Wallet,
  Banknote,
  QrCode,
  CheckCircle2,
  Clock,
  Send,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';

interface CollectorSummaryProps {
  collector: User;
}

export const CollectorSummary: React.FC<CollectorSummaryProps> = ({ collector }) => {
  const stats = store.getCollectorTodayStats(collector.id);
  const allMembers = store.getMembers();
  const settings = store.getSettings();

  const [submittedAmount, setSubmittedAmount] = useState<number>(stats.cashCollected);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (submittedAmount <= 0) {
      alert('Submitted amount must be greater than 0');
      return;
    }

    setIsSubmitting(true);
    try {
      store.createSettlement({
        collectorId: collector.id,
        cashCollected: stats.cashCollected,
        cashSubmitted: submittedAmount,
        notes: handoverNotes,
      });
      alert('Cash handover request submitted to admin successfully!');
    } catch {
      alert('Failed to submit cash handover request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const settlement = stats.settlement;

  return (
    <div className="space-y-4 pb-24">
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <h2 className="text-base font-black text-slate-900 flex items-center space-x-2">
          <Wallet className="w-5 h-5 text-emerald-600" />
          <span>Daily Balance & Cash Handover</span>
        </h2>
        <p className="text-xs text-slate-500 mt-0.5 font-medium">
          Summary of today's collections and cash submission to admin.
        </p>
      </div>

      {/* Collection Stats Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-emerald-700">
            <Banknote className="w-4 h-4" />
            <span className="text-xs font-bold">Cash in Hand</span>
          </div>
          <p className="text-2xl font-black text-emerald-950 mt-1">
            {formatCurrency(stats.cashCollected)}
          </p>
          <span className="text-[10px] font-medium text-emerald-700">
            To submit to Admin
          </span>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl">
          <div className="flex items-center space-x-2 text-blue-700">
            <QrCode className="w-4 h-4" />
            <span className="text-xs font-bold">Direct Online UPI</span>
          </div>
          <p className="text-2xl font-black text-blue-950 mt-1">
            {formatCurrency(stats.onlineCollected)}
          </p>
          <span className="text-[10px] font-medium text-blue-700">
            Received in company account
          </span>
        </div>
      </div>

      {/* Cash Handover Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">
            Daily Cash Handover (Day-End Closure)
          </h3>
          {settlement && (
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center space-x-1 ${
                settlement.status === 'approved'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {settlement.status === 'approved' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Approved & Settled</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Pending Admin Approval</span>
                </>
              )}
            </span>
          )}
        </div>

        {settlement ? (
          /* Already submitted today */
          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between font-bold text-slate-700">
              <span>Submitted Cash:</span>
              <span className="text-emerald-700 text-sm">
                {formatCurrency(settlement.cashSubmitted)}
              </span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Submission Time:</span>
              <span>{formatDateTime(settlement.createdAt)}</span>
            </div>
            {settlement.notes && (
              <div className="text-slate-600 italic mt-1 pt-1 border-t border-slate-200">
                Note: "{settlement.notes}"
              </div>
            )}
            {settlement.status === 'approved' && (
              <div className="p-2.5 bg-emerald-100/60 rounded-lg text-emerald-900 font-bold text-xs flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <span>Your daily cash settlement has been verified and settled.</span>
              </div>
            )}
          </div>
        ) : (
          /* Handover Form */
          <form onSubmit={handleHandover} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cash Amount Handed Over to Admin
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  required
                  value={submittedAmount}
                  onChange={e => setSubmittedAmount(Number(e.target.value))}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-black text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Submitted at main office counter"
                value={handoverNotes}
                onChange={e => setHandoverNotes(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || stats.cashCollected === 0}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>Submit Cash to Admin ({formatCurrency(submittedAmount)})</span>
            </button>
          </form>
        )}
      </div>

      {/* Today's Transactions Ledger */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">
            Today's Recorded Collections ({stats.transactions.length})
          </h3>
        </div>

        <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
          {stats.transactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No payments collected by you today yet.
            </div>
          ) : (
            stats.transactions.map(tx => {
              const member = allMembers.find(m => m.id === tx.memberId);
              if (!member) return null;

              const whatsappUrl = buildWhatsAppReceiptUrl({
                memberPhone: member.phone,
                memberName: member.name,
                memberCode: member.code,
                amount: tx.amount,
                paymentMode: tx.paymentMode,
                collectorName: collector.name,
                uniqueToken: member.uniqueToken,
                appName: settings.appName,
              });

              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {member.name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {member.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {formatDateTime(tx.createdAt)} •{' '}
                      <span
                        className={`font-bold ${
                          tx.paymentMode === 'cash' ? 'text-emerald-700' : 'text-blue-700'
                        }`}
                      >
                        {tx.paymentMode === 'cash' ? '💵 Cash' : '📲 Online UPI'}
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-black text-slate-900">
                      +{formatCurrency(tx.amount)}
                    </span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                      title="Re-send WhatsApp Receipt"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
