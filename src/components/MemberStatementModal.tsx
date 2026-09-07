import React, { useState } from 'react';
import { Member } from '../types';
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
  XCircle,
  Building2,
  Phone,
} from 'lucide-react';

interface MemberStatementModalProps {
  member: Member | null;
  onClose: () => void;
}

export const MemberStatementModal: React.FC<MemberStatementModalProps> = ({ member, onClose }) => {
  if (!member) return null;

  const [dateFilter, setDateFilter] = useState<'all' | '30days' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending_verification' | 'rejected'>('all');

  const settings = store.getSettings();
  const allCollectors = store.getCollectors();
  const assignedCollector = allCollectors.find(c => c.id === member.assignedCollectorId);

  // All transactions for this member
  const allTransactions = store.getMemberTransactions(member.id);

  // Filter logic
  const filteredTransactions = allTransactions.filter(tx => {
    // Mode
    if (modeFilter !== 'all' && tx.paymentMode !== modeFilter) return false;
    // Status
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;

    // Date
    const txDate = tx.collectionDate; // YYYY-MM-DD
    const now = new Date();

    if (dateFilter === '30days') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      const past30Str = past30.toISOString().split('T')[0];
      if (txDate < past30Str) return false;
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
  const totalAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const cashAmount = filteredTransactions
    .filter(t => t.paymentMode === 'cash' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const onlineAmount = filteredTransactions
    .filter(t => t.paymentMode === 'online' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingAmount = filteredTransactions
    .filter(t => t.status === 'pending_verification')
    .reduce((acc, t) => acc + t.amount, 0);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Amount (INR)',
      'Payment Mode',
      'Status',
      'Collector Name',
      'UTR / Ref Number',
      'Notes',
      'Created At',
    ];

    const rows = filteredTransactions.map(tx => {
      const collector = tx.collectorId ? allCollectors.find(c => c.id === tx.collectorId) : null;
      return [
        tx.id,
        tx.collectionDate,
        tx.amount,
        tx.paymentMode === 'cash' ? 'Cash' : 'Online UPI',
        tx.status,
        collector?.name || (tx.paymentMode === 'online' ? 'Self (Online)' : 'Direct'),
        tx.utrNumber || '',
        tx.notes || '',
        formatDateTime(tx.createdAt),
      ];
    });

    const filename = `Statement_${member.code}_${member.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}`;

    exportToCsv(filename, headers, rows, {
      title: `${settings.appName} - Member Account Statement`,
      subtitle: `Member: ${member.name} (${member.code}) | Phone: ${member.phone} | Daily Amount: Rs. ${member.dailyAmount}`,
      summary: {
        'Member Name': member.name,
        'Member Code': member.code,
        'Phone Number': member.phone,
        'Daily Installment': `Rs. ${member.dailyAmount}`,
        'Assigned Collector': assignedCollector?.name || 'Unassigned',
        'Total Verified Paid': `Rs. ${totalAmount}`,
        'Cash Paid': `Rs. ${cashAmount}`,
        'Online UPI Paid': `Rs. ${onlineAmount}`,
        'Pending Verification': `Rs. ${pendingAmount}`,
        'Total Transactions': filteredTransactions.length,
      },
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 sm:p-4">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 sticky top-0 z-10">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
              {member.code.replace('AC-', '')}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-slate-900">{member.name}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-bold">
                  {member.code}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                📞 {member.phone} {member.address && `• 📍 ${member.address}`}
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

        {/* Modal Body with scroll */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* Quick Metrics Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 block">Total Verified</span>
              <span className="text-lg font-black text-emerald-950 mt-0.5 block">
                {formatCurrency(totalAmount)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block">Cash Paid</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {formatCurrency(cashAmount)}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 block">Online UPI</span>
              <span className="text-lg font-black text-blue-950 mt-0.5 block">
                {formatCurrency(onlineAmount)}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-[11px] font-bold text-amber-800 block">Daily Target</span>
              <span className="text-lg font-black text-amber-950 mt-0.5 block">
                {formatCurrency(member.dailyAmount)}
              </span>
            </div>
          </div>

          {/* Filter Toolbar */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filters:</span>
              </div>

              {/* Date presets */}
              <div className="flex items-center space-x-1 bg-white p-1 rounded-xl border border-slate-200 text-xs">
                {(['all', '30days', 'this_month', 'custom'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setDateFilter(p)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition ${
                      dateFilter === p ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {p === 'all'
                      ? 'All'
                      : p === '30days'
                      ? 'Last 30 Days'
                      : p === 'this_month'
                      ? 'This Month'
                      : 'Custom Date'}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range if selected */}
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

            {/* Mode & Status filter dropdowns */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <select
                  value={modeFilter}
                  onChange={e => setModeFilter(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">All Payment Modes</option>
                  <option value="cash">Cash Only</option>
                  <option value="online">Online UPI Only</option>
                </select>
              </div>

              <div>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Verified / Completed</option>
                  <option value="pending_verification">Unverified (Pending)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          {/* Transactions Statement Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Account Ledger Statement ({filteredTransactions.length} entries)</span>
              <span className="text-slate-400 font-normal">Showing newest first</span>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No transactions match the selected filters.
                </div>
              ) : (
                filteredTransactions.map(tx => {
                  const collector = tx.collectorId ? allCollectors.find(c => c.id === tx.collectorId) : null;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition text-xs"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900">
                            {formatDate(tx.collectionDate)}
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
                          Collector: {collector?.name || (tx.paymentMode === 'online' ? 'Self Online' : 'Direct')} • {formatDateTime(tx.createdAt)}
                          {tx.utrNumber && ` • UTR: ${tx.utrNumber}`}
                        </p>
                        {tx.notes && (
                          <p className="text-[10px] text-slate-400 italic">"{tx.notes}"</p>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black text-sm block ${
                            tx.status === 'rejected'
                              ? 'text-slate-400 line-through'
                              : tx.status === 'pending_verification'
                              ? 'text-amber-700'
                              : 'text-emerald-700'
                          }`}
                        >
                          +{formatCurrency(tx.amount)}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full inline-flex items-center ${
                            tx.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : tx.status === 'pending_verification'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {tx.status === 'completed' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" /> Verified
                            </>
                          ) : tx.status === 'pending_verification' ? (
                            <>
                              <Clock className="w-3 h-3 mr-0.5 text-amber-600" /> Unverified
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 mr-0.5" /> Rejected
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Assigned Collector: <strong>{assignedCollector?.name || 'None'}</strong></span>
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
