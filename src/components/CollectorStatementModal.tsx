import React, { useState } from 'react';
import { User } from '../types';
import { store } from '../services/store';
import { formatCurrency, formatDate, formatDateTime } from '../utils/formatters';
import { exportToCsv } from '../utils/export';
import {
  X,
  FileSpreadsheet,
  Calendar,
  Filter,
  CheckCircle2,
  Clock,
  Banknote,
  QrCode,
  Users,
  ShieldCheck,
  History,
} from 'lucide-react';

interface CollectorStatementModalProps {
  collector: User | null;
  onClose: () => void;
}

export const CollectorStatementModal: React.FC<CollectorStatementModalProps> = ({
  collector,
  onClose,
}) => {
  if (!collector) return null;

  const [activeTab, setActiveTab] = useState<'collections' | 'settlements'>('collections');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');

  const settings = store.getSettings();
  const allMembers = store.getMembers();
  const assignedMembersCount = allMembers.filter(
    m => m.assignedCollectorId === collector.id && m.isActive
  ).length;

  // All collections where this collector was the collector
  const allTransactions = store
    .getTransactions()
    .filter(t => t.collectorId === collector.id);

  // All settlements submitted by this collector
  const collectorSettlements = store
    .getSettlements()
    .filter(s => s.collectorId === collector.id);

  // Filter collections
  const filteredTransactions = allTransactions.filter(tx => {
    if (modeFilter !== 'all' && tx.paymentMode !== modeFilter) return false;

    const txDate = tx.collectionDate;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (dateFilter === 'today') {
      if (txDate !== todayStr) return false;
    } else if (dateFilter === '7days') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      if (txDate < past7.toISOString().split('T')[0]) return false;
    } else if (dateFilter === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      if (txDate < firstDay) return false;
    } else if (dateFilter === 'custom') {
      if (startDate && txDate < startDate) return false;
      if (endDate && txDate > endDate) return false;
    }

    return true;
  });

  // Calculate Metrics
  const totalCollected = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const cashCollected = filteredTransactions
    .filter(t => t.paymentMode === 'cash' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const onlineCollected = filteredTransactions
    .filter(t => t.paymentMode === 'online' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalSubmittedSettlements = collectorSettlements
    .filter(s => s.status === 'approved')
    .reduce((acc, s) => acc + s.cashSubmitted, 0);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    if (activeTab === 'collections') {
      const headers = [
        'Transaction ID',
        'Date',
        'Member Code',
        'Member Name',
        'Member Phone',
        'Amount (INR)',
        'Payment Mode',
        'Status',
        'UTR Number',
        'Notes',
        'Recorded At',
      ];

      const rows = filteredTransactions.map(tx => {
        const member = allMembers.find(m => m.id === tx.memberId);
        return [
          tx.id,
          tx.collectionDate,
          member?.code || '',
          member?.name || 'Unknown',
          member?.phone || '',
          tx.amount,
          tx.paymentMode === 'cash' ? 'Cash' : 'Online UPI',
          tx.status,
          tx.utrNumber || '',
          tx.notes || '',
          formatDateTime(tx.createdAt),
        ];
      });

      const filename = `Collector_Collections_${collector.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      exportToCsv(filename, headers, rows, {
        title: `${settings.appName} - Collector Collection Statement`,
        subtitle: `Collector: ${collector.name} | Phone: ${collector.phone} | Assigned Members: ${assignedMembersCount}`,
        summary: {
          'Collector Name': collector.name,
          'Phone Number': collector.phone,
          'Access Scope': collector.canCollectAll ? 'All Members' : 'Assigned Only',
          'Online Verification Rights': collector.canVerifyPayments ? 'Enabled' : 'Disabled',
          'Total Collections': `Rs. ${totalCollected}`,
          'Cash Collected': `Rs. ${cashCollected}`,
          'Online UPI Collected': `Rs. ${onlineCollected}`,
          'Total Transactions Count': filteredTransactions.length,
        },
      });
    } else {
      // Export settlements
      const headers = [
        'Settlement ID',
        'Date',
        'Cash Collected (INR)',
        'Cash Submitted (INR)',
        'Status',
        'Notes',
        'Approved At',
      ];

      const rows = collectorSettlements.map(s => [
        s.id,
        s.settlementDate,
        s.cashCollected,
        s.cashSubmitted,
        s.status,
        s.notes || '',
        s.approvedAt ? formatDateTime(s.approvedAt) : 'Pending',
      ]);

      const filename = `Collector_Settlements_${collector.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

      exportToCsv(filename, headers, rows, {
        title: `${settings.appName} - Collector Cash Handover Settlement Log`,
        subtitle: `Collector: ${collector.name} | Phone: ${collector.phone}`,
        summary: {
          'Collector Name': collector.name,
          'Total Approved Settlements': `Rs. ${totalSubmittedSettlements}`,
          'Settlement Records Count': collectorSettlements.length,
        },
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-sm">
              {collector.name.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900">{collector.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold uppercase">
                  {collector.canCollectAll ? 'All Members' : 'Assigned Only'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                📞 {collector.phone} • {assignedMembersCount} assigned members
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportExcel}
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 flex items-center space-x-1.5 transition"
              title="Download Statement in Excel / CSV format"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Export to Excel</span>
              <span className="sm:hidden">Excel</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 block">Total Collected</span>
              <span className="text-lg font-black text-emerald-950 mt-0.5 block">
                {formatCurrency(totalCollected)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block">Cash Collected</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {formatCurrency(cashCollected)}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 block">Online UPI</span>
              <span className="text-lg font-black text-blue-950 mt-0.5 block">
                {formatCurrency(onlineCollected)}
              </span>
            </div>
            <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100">
              <span className="text-[11px] font-bold text-purple-800 block">Settled to Admin</span>
              <span className="text-lg font-black text-purple-950 mt-0.5 block">
                {formatCurrency(totalSubmittedSettlements)}
              </span>
            </div>
          </div>

          {/* Sub-Tabs: Collections vs Settlements */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => setActiveTab('collections')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'collections'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <History className="w-4 h-4 text-emerald-600" />
              <span>Collections History ({filteredTransactions.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('settlements')}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
                activeTab === 'settlements'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Banknote className="w-4 h-4 text-purple-600" />
              <span>Daily Cash Handovers ({collectorSettlements.length})</span>
            </button>
          </div>

          {activeTab === 'collections' ? (
            <>
              {/* Filter Toolbar for Collections */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <span>Date Filter:</span>
                  </div>

                  <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                    {(['all', 'today', '7days', 'this_month', 'custom'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setDateFilter(p)}
                        className={`px-2.5 py-1 rounded-lg font-bold transition ${
                          dateFilter === p
                            ? 'bg-slate-900 text-white'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {p === 'all'
                          ? 'All'
                          : p === 'today'
                          ? 'Today'
                          : p === '7days'
                          ? 'Last 7 Days'
                          : p === 'this_month'
                          ? 'This Month'
                          : 'Custom'}
                      </button>
                    ))}
                  </div>
                </div>

                {dateFilter === 'custom' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <input
                      type="date"
                      value={startDate}
                      onChange={e => setStartDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                    <span className="text-xs text-slate-400 font-bold">to</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={e => setEndDate(e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                )}

                <div>
                  <select
                    value={modeFilter}
                    onChange={e => setModeFilter(e.target.value as any)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                  >
                    <option value="all">All Payment Modes</option>
                    <option value="cash">Cash Collections Only</option>
                    <option value="online">Online UPI Only</option>
                  </select>
                </div>
              </div>

              {/* Collections List */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                  <span>Collector Transactions ({filteredTransactions.length})</span>
                  <span className="text-slate-400 font-normal">Newest first</span>
                </div>

                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {filteredTransactions.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No collections recorded for this collector in this period.
                    </div>
                  ) : (
                    filteredTransactions.map(tx => {
                      const member = allMembers.find(m => m.id === tx.memberId);

                      return (
                        <div
                          key={tx.id}
                          className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-extrabold text-slate-900">
                                {member?.name || 'Unknown'}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                                {member?.code}
                              </span>
                              <span
                                className={`font-bold px-1.5 py-0.2 rounded text-[10px] uppercase ${
                                  tx.paymentMode === 'cash'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-blue-100 text-blue-800'
                                }`}
                              >
                                {tx.paymentMode === 'cash' ? 'Cash' : 'Online'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {formatDate(tx.collectionDate)} • {formatDateTime(tx.createdAt)}
                              {tx.utrNumber && ` • UTR: ${tx.utrNumber}`}
                            </p>
                          </div>

                          <div className="text-right">
                            <span className="font-black text-sm text-emerald-700 block">
                              +{formatCurrency(tx.amount)}
                            </span>
                            <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end">
                              <CheckCircle2 className="w-3 h-3 mr-0.5" /> Completed
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            /* Settlements History */
            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Handover Settlement Records ({collectorSettlements.length})</span>
                <span className="text-slate-400 font-normal">History log</span>
              </div>

              <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {collectorSettlements.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    No cash handover settlements submitted yet.
                  </div>
                ) : (
                  collectorSettlements.map(s => (
                    <div
                      key={s.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">
                            Date: {s.settlementDate}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              s.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {s.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Cash Collected: {formatCurrency(s.cashCollected)} • Submitted:{' '}
                          <strong className="text-emerald-700">{formatCurrency(s.cashSubmitted)}</strong>
                        </p>
                        {s.notes && (
                          <p className="text-[10px] text-slate-400 italic">"{s.notes}"</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-400">
                          {s.approvedAt ? formatDateTime(s.approvedAt) : 'Pending'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Collector ID: <code className="font-mono">{collector.id}</code></span>
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
