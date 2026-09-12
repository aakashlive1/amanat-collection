import React, { useState } from 'react';
import { store } from '../../services/store';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { Transaction } from '../../types';
import {
  Wallet,
  Banknote,
  QrCode,
  Users,
  AlertTriangle,
  Phone,
  MessageSquare,
  ArrowRight,
  Clock,
  FileSpreadsheet,
  ArrowDownCircle,
  Ban,
  X,
} from 'lucide-react';

interface AdminDashboardProps {
  onNavigateTab: (tab: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigateTab }) => {
  const authUser = store.getAuthUser();
  const [voidModalTx, setVoidModalTx] = useState<Transaction | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isVoiding, setIsVoiding] = useState(false);

  const handleConfirmVoid = () => {
    if (!voidModalTx || !voidReason.trim() || !authUser) return;
    setIsVoiding(true);
    try {
      store.voidTransaction(voidModalTx.id, voidReason.trim(), authUser);
      setVoidModalTx(null);
      setVoidReason('');
    } catch {
      alert('Failed to void transaction');
    } finally {
      setIsVoiding(false);
    }
  };

  const stats = store.getTodayAdminStats();
  const allMembers = store.getMembers();
  const collectors = store.getCollectors();

  // Find members who haven't paid today
  const paidMemberIds = new Set(stats.todayTransactions.map(t => t.memberId));
  const unpaidMembers = allMembers.filter(m => m.isActive && !paidMemberIds.has(m.id));

  return (
    <div className="space-y-5 pb-20">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 to-slate-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-2.5 py-1 rounded-lg bg-white/10 text-purple-200 text-xs font-bold uppercase tracking-wider">
            Daily Report • {stats.today}
          </span>
          <h2 className="text-xl sm:text-2xl font-black mt-2 tracking-tight">
            Today's Total Collection: {formatCurrency(stats.totalAmount)}
          </h2>
          <p className="text-xs text-purple-200 mt-1 font-medium">
            {stats.paidMembersCount} members collected • {stats.pendingMembersCount} members pending
            {stats.totalWithdrawalAmount > 0 && ` • Payouts: ${formatCurrency(stats.totalWithdrawalAmount)}`}
          </p>
        </div>
      </div>

      {/* Member Payouts Summary Alert if any occurred today */}
      {stats.totalWithdrawalAmount > 0 && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <ArrowDownCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-950">
                Today's Member Payouts / Withdrawals: {formatCurrency(stats.totalWithdrawalAmount)}
              </p>
              <p className="text-xs text-amber-800 font-medium">
                Cash Payouts: {formatCurrency(stats.cashWithdrawalAmount)} | Net Physical Cash Collected: {formatCurrency(stats.netCashInHand)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Pending Settlement Alert (if any collector submitted cash) */}
      {stats.pendingSettlementsCount > 0 && (
        <div
          onClick={() => onNavigateTab('settlements')}
          className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-amber-100/70 transition shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-amber-950">
                {stats.pendingSettlementsCount} collector cash handover(s) pending approval!
              </p>
              <p className="text-xs text-amber-800 font-medium">
                Verify submitted physical cash and approve settlement.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-900 flex items-center">
            Review <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      )}

      {/* Pending Online UPI UTR Verification Alert */}
      {stats.pendingOnlineCount > 0 && (
        <div
          onClick={() => onNavigateTab('verifications')}
          className="bg-blue-50 border border-blue-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-blue-100/70 transition shadow-xs"
        >
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blue-950">
                {stats.pendingOnlineCount} member self-paid online UPI submission(s) pending bank verification!
              </p>
              <p className="text-xs text-blue-800 font-medium">
                Match submitted UTRs against bank statement credit and mark Verified.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-blue-900 flex items-center">
            Verify Now <ArrowRight className="w-4 h-4 ml-1" />
          </span>
        </div>
      )}

      {/* Statements & Excel Export Quick Banner */}
      <div
        onClick={() => onNavigateTab('reports')}
        className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center justify-between cursor-pointer hover:bg-emerald-100/70 transition shadow-xs"
      >
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-extrabold text-emerald-950">
              Account Statements & Excel Reports
            </p>
            <p className="text-xs text-emerald-800 font-medium">
              View customer passbooks, collector reports, and download full Excel/CSV statements.
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-900 flex items-center">
          Open Statements <ArrowRight className="w-4 h-4 ml-1" />
        </span>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          title="Total Collection"
          value={formatCurrency(stats.totalAmount)}
          subtitle={`${stats.todayTransactions.length} transactions`}
          icon={Wallet}
          variant="purple"
        />
        <StatCard
          title="Cash Collection"
          value={formatCurrency(stats.cashAmount)}
          subtitle="In collectors' custody"
          icon={Banknote}
          variant="emerald"
        />
        <StatCard
          title="Direct Online UPI"
          value={formatCurrency(stats.onlineAmount)}
          subtitle="Direct to bank account"
          icon={QrCode}
          variant="blue"
        />
        <StatCard
          title="Collection Progress"
          value={`${stats.paidMembersCount} / ${stats.totalMembers}`}
          subtitle={`${stats.pendingMembersCount} pending`}
          icon={Users}
          variant="slate"
        />
      </div>

      {/* Unpaid Members (Defaulters List) Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Pending Collections Today ({unpaidMembers.length} Members)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Quickly follow up with members via Call or WhatsApp
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('members')}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
          >
            All Members ➜
          </button>
        </div>

        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
          {unpaidMembers.length === 0 ? (
            <div className="p-6 text-center text-xs font-bold text-emerald-600">
              🎉 Excellent! All active members have completed their collection today.
            </div>
          ) : (
            unpaidMembers.map(member => {
              const assignedColl = collectors.find(c => c.id === member.assignedCollectorId);
              let cleanPhone = member.phone.replace(/[^0-9]/g, '');
              if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

              const waReminderText = `Hello ${member.name}! This is a reminder from Amanat Collection that your daily collection installment of ${formatCurrency(
                member.dailyAmount
              )} is due today. Thank you!`;

              return (
                <div
                  key={member.id}
                  className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">{member.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {member.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Daily: <span className="font-bold text-slate-800">{formatCurrency(member.dailyAmount)}</span>
                      {assignedColl && ` • Collector: ${assignedColl.name}`}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    {/* Call Button */}
                    <a
                      href={`tel:${member.phone}`}
                      className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Call Member"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    {/* WhatsApp Reminder Button */}
                    <a
                      href={`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waReminderText)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Send WhatsApp Reminder"
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

      {/* Today's Transactions Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>Today's Transactions ({stats.todayTransactions.length})</span>
          </h3>
        </div>

        <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
          {stats.todayTransactions.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No transactions recorded today yet.
            </div>
          ) : (
            stats.todayTransactions.map(tx => {
              const member = allMembers.find(m => m.id === tx.memberId);
              const collector = collectors.find(c => c.id === tx.collectorId);

              return (
                <div key={tx.id} className="p-3.5 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900">
                        {member?.name || 'Unknown Member'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {member?.code}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Collector: {collector?.name || 'Direct Online'} • {formatDateTime(tx.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <span className={`text-sm font-black block ${tx.txType === 'withdrawal' ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {tx.txType === 'withdrawal' ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          tx.paymentMode === 'cash'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {tx.paymentMode === 'cash' ? 'Cash' : 'Online'}
                      </span>
                    </div>
                    {authUser?.role === 'admin' && (
                      <button
                        type="button"
                        onClick={() => {
                          setVoidModalTx(tx);
                          setVoidReason('');
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Void / Cancel this accidental entry"
                      >
                        <Ban className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Super Admin Void Confirmation Modal */}
      {voidModalTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center space-x-2 text-rose-600 font-bold">
                <Ban className="w-5 h-5" />
                <span>Void Transaction Entry</span>
              </div>
              <button onClick={() => setVoidModalTx(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-xs text-rose-800">
              <p className="font-bold">⚠️ Warning: Financial Audit Action</p>
              <p className="mt-1">
                Voiding will cancel this <strong>{voidModalTx.txType === 'withdrawal' ? 'payout' : 'collection'} of {formatCurrency(voidModalTx.amount)}</strong>. It will be removed from member net balance and daily collection stats. A permanent audit entry with your name will be recorded.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Reason for Voiding (Required)
              </label>
              <textarea
                rows={3}
                required
                value={voidReason}
                onChange={e => setVoidReason(e.target.value)}
                placeholder="e.g. Collector typed 5000 instead of 500 by mistake; correction recorded."
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-200 resize-none"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setVoidModalTx(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-xs rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!voidReason.trim() || isVoiding}
                onClick={handleConfirmVoid}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50"
              >
                {isVoiding ? 'Voiding...' : 'Confirm Void'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
