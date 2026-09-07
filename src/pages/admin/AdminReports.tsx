import React, { useState } from 'react';
import { store } from '../../services/store';
import { Member, User } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { exportToCsv } from '../../utils/export';
import { MemberStatementModal } from '../../components/MemberStatementModal';
import { CollectorStatementModal } from '../../components/CollectorStatementModal';
import {
  FileSpreadsheet,
  Calendar,
  Filter,
  Search,
  Users,
  UserCog,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  HandCoins,
} from 'lucide-react';

export const AdminReports: React.FC = () => {
  const [reportTab, setReportTab] = useState<'master' | 'members' | 'collectors'>('master');

  // Master statement filters
  const [search, setSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'this_month' | 'custom'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [collectorFilter, setCollectorFilter] = useState('');
  const [memberFilter, setMemberFilter] = useState('');
  const [modeFilter, setModeFilter] = useState<'all' | 'cash' | 'online'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending_verification' | 'rejected'>('all');

  // Statement Modals
  const [selectedMemberForStatement, setSelectedMemberForStatement] = useState<Member | null>(null);
  const [selectedCollectorForStatement, setSelectedCollectorForStatement] = useState<User | null>(null);

  const settings = store.getSettings();
  const allMembers = store.getMembers();
  const allCollectors = store.getCollectors();
  const allTransactions = store.getTransactions();
  const allSettlements = store.getSettlements();

  // Filter master transactions
  const filteredTransactions = allTransactions.filter(tx => {
    // Mode
    if (modeFilter !== 'all' && tx.paymentMode !== modeFilter) return false;
    // Status
    if (statusFilter !== 'all' && tx.status !== statusFilter) return false;
    // Collector
    if (collectorFilter && tx.collectorId !== collectorFilter) return false;
    // Member
    if (memberFilter && tx.memberId !== memberFilter) return false;

    // Date
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

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const member = allMembers.find(m => m.id === tx.memberId);
      const collector = tx.collectorId ? allCollectors.find(c => c.id === tx.collectorId) : null;
      const matches =
        (member && member.name.toLowerCase().includes(q)) ||
        (member && member.code.toLowerCase().includes(q)) ||
        (collector && collector.name.toLowerCase().includes(q)) ||
        (tx.utrNumber && tx.utrNumber.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Calculate Aggregates
  const totalCompletedAmount = filteredTransactions
    .filter(t => t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const cashTotal = filteredTransactions
    .filter(t => t.paymentMode === 'cash' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const onlineTotal = filteredTransactions
    .filter(t => t.paymentMode === 'online' && t.status === 'completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingTotal = filteredTransactions
    .filter(t => t.status === 'pending_verification')
    .reduce((acc, t) => acc + t.amount, 0);

  // 1. Export Master Transaction Statement
  const handleExportMasterExcel = () => {
    const headers = [
      'Transaction ID',
      'Date',
      'Member Code',
      'Member Name',
      'Member Phone',
      'Amount (INR)',
      'Payment Mode',
      'Status',
      'Collector Name',
      'UTR / Ref Number',
      'Notes',
      'Recorded Timestamp',
    ];

    const rows = filteredTransactions.map(tx => {
      const member = allMembers.find(m => m.id === tx.memberId);
      const collector = tx.collectorId ? allCollectors.find(c => c.id === tx.collectorId) : null;
      return [
        tx.id,
        tx.collectionDate,
        member?.code || '',
        member?.name || 'Unknown',
        member?.phone || '',
        tx.amount,
        tx.paymentMode === 'cash' ? 'Cash' : 'Online UPI',
        tx.status,
        collector?.name || (tx.paymentMode === 'online' ? 'Self (Online)' : 'Direct'),
        tx.utrNumber || '',
        tx.notes || '',
        formatDateTime(tx.createdAt),
      ];
    });

    const filename = `Amanat_Master_Statement_${new Date().toISOString().split('T')[0]}`;

    exportToCsv(filename, headers, rows, {
      title: `${settings.appName} - Master Collection Statement`,
      subtitle: `Filters: Date: ${dateFilter} | Mode: ${modeFilter} | Status: ${statusFilter}`,
      summary: {
        'Total Verified Collection': `Rs. ${totalCompletedAmount}`,
        'Cash Collections': `Rs. ${cashTotal}`,
        'Online UPI Collections': `Rs. ${onlineTotal}`,
        'Pending Verification': `Rs. ${pendingTotal}`,
        'Transactions Count': filteredTransactions.length,
      },
    });
  };

  // 2. Export Members Master List
  const handleExportMembersList = () => {
    const headers = [
      'Member Code',
      'Name',
      'Phone Number',
      'Address',
      'Daily Amount (INR)',
      'Assigned Collector',
      'Status',
      'Passbook URL',
      'Registration Date',
    ];

    const rows = allMembers.map(m => {
      const collector = allCollectors.find(c => c.id === m.assignedCollectorId);
      return [
        m.code,
        m.name,
        m.phone,
        m.address || '',
        m.dailyAmount,
        collector?.name || 'Unassigned',
        m.isActive ? 'Active' : 'Inactive',
        `${window.location.origin}/#/m/${m.uniqueToken}`,
        formatDate(m.createdAt),
      ];
    });

    const filename = `Amanat_Members_List_${new Date().toISOString().split('T')[0]}`;

    exportToCsv(filename, headers, rows, {
      title: `${settings.appName} - Registered Members Directory`,
      subtitle: `Total Registered Members: ${allMembers.length}`,
    });
  };

  // 3. Export Settlements Log
  const handleExportSettlements = () => {
    const headers = [
      'Settlement ID',
      'Date',
      'Collector Name',
      'Collector Phone',
      'Cash Collected (INR)',
      'Cash Submitted (INR)',
      'Status',
      'Notes',
      'Approved By',
      'Approved At',
    ];

    const rows = allSettlements.map(s => {
      const collector = allCollectors.find(c => c.id === s.collectorId);
      return [
        s.id,
        s.settlementDate,
        collector?.name || 'Unknown',
        collector?.phone || '',
        s.cashCollected,
        s.cashSubmitted,
        s.status,
        s.notes || '',
        s.approvedBy ? 'Admin' : '',
        s.approvedAt ? formatDateTime(s.approvedAt) : 'Pending',
      ];
    });

    const filename = `Amanat_Cash_Settlements_${new Date().toISOString().split('T')[0]}`;

    exportToCsv(filename, headers, rows, {
      title: `${settings.appName} - Daily Cash Handover Settlement Records`,
      subtitle: `Total Settlement Records: ${allSettlements.length}`,
    });
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Banner with Quick Export Actions */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
            <span>Statements & Export Reports</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            View comprehensive account statements of any member, collector, or export all transactions to Excel.
          </p>
        </div>

        {/* Global Export Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportMasterExcel}
            className="py-2.5 px-3.5 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-sm shadow-emerald-200 flex items-center space-x-1.5 transition"
            title="Download Master Transactions Excel"
          >
            <Download className="w-4 h-4" />
            <span>Export Master Excel</span>
          </button>

          <button
            onClick={handleExportMembersList}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            title="Export Members Directory"
          >
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Members</span>
          </button>

          <button
            onClick={handleExportSettlements}
            className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
            title="Export Cash Settlements"
          >
            <HandCoins className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Settlements</span>
          </button>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-200/80 rounded-2xl">
        <button
          onClick={() => setReportTab('master')}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
            reportTab === 'master'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Master Statement</span>
        </button>

        <button
          onClick={() => setReportTab('members')}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
            reportTab === 'members'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>Member Statements</span>
        </button>

        <button
          onClick={() => setReportTab('collectors')}
          className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition flex items-center justify-center space-x-1.5 ${
            reportTab === 'collectors'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <UserCog className="w-4 h-4 text-purple-600" />
          <span>Collector Statements</span>
        </button>
      </div>

      {/* TAB 1: MASTER TRANSACTIONS STATEMENT */}
      {reportTab === 'master' && (
        <div className="space-y-4">
          {/* Quick Metrics of filtered selection */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 block">Total Verified</span>
              <span className="text-lg font-black text-emerald-950 mt-0.5 block">
                {formatCurrency(totalCompletedAmount)}
              </span>
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[11px] font-bold text-slate-600 block">Cash Amount</span>
              <span className="text-lg font-black text-slate-900 mt-0.5 block">
                {formatCurrency(cashTotal)}
              </span>
            </div>
            <div className="p-3 bg-blue-50 rounded-2xl border border-blue-100">
              <span className="text-[11px] font-bold text-blue-800 block">Online UPI Amount</span>
              <span className="text-lg font-black text-blue-950 mt-0.5 block">
                {formatCurrency(onlineTotal)}
              </span>
            </div>
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
              <span className="text-[11px] font-bold text-amber-800 block">Transactions</span>
              <span className="text-lg font-black text-amber-950 mt-0.5 block">
                {filteredTransactions.length} entries
              </span>
            </div>
          </div>

          {/* Master Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by member code, member name, collector, or UTR number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden"
              />
            </div>

            {/* Filter Dropdowns Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {/* Date Presets */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Time Period
                </label>
                <select
                  value={dateFilter}
                  onChange={e => setDateFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="this_month">This Month</option>
                  <option value="custom">Custom Date Range</option>
                </select>
              </div>

              {/* Collector Filter */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Collector
                </label>
                <select
                  value={collectorFilter}
                  onChange={e => setCollectorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="">All Collectors</option>
                  {allCollectors.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Mode */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Payment Mode
                </label>
                <select
                  value={modeFilter}
                  onChange={e => setModeFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">All Modes</option>
                  <option value="cash">Cash Only</option>
                  <option value="online">Online UPI Only</option>
                </select>
              </div>

              {/* Payment Status */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Status
                </label>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-hidden"
                >
                  <option value="all">All Statuses</option>
                  <option value="completed">Completed / Verified</option>
                  <option value="pending_verification">Unverified (Pending)</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>

            {/* Custom Date Picker Inputs */}
            {dateFilter === 'custom' && (
              <div className="flex items-center space-x-2 pt-1">
                <span className="text-xs text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
                <span className="text-xs text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            )}
          </div>

          {/* Master Transactions Statement Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Master Transaction Ledger ({filteredTransactions.length} records)
              </span>
              <button
                onClick={handleExportMasterExcel}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Filtered Table</span>
              </button>
            </div>

            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No transaction records found matching your filters.
                </div>
              ) : (
                filteredTransactions.map(tx => {
                  const member = allMembers.find(m => m.id === tx.memberId);
                  const collector = tx.collectorId ? allCollectors.find(c => c.id === tx.collectorId) : null;

                  return (
                    <div
                      key={tx.id}
                      className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition text-xs"
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
                          Date: <strong>{formatDate(tx.collectionDate)}</strong> • Collector:{' '}
                          {collector?.name || (tx.paymentMode === 'online' ? 'Self (Online)' : 'Direct')}
                          {tx.utrNumber && ` • UTR: ${tx.utrNumber}`}
                        </p>
                      </div>

                      <div className="text-right flex items-center space-x-3">
                        <div>
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
                              'Rejected'
                            )}
                          </span>
                        </div>

                        {/* Button to view this member's full statement */}
                        {member && (
                          <button
                            onClick={() => setSelectedMemberForStatement(member)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="View Full Member Statement"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBER STATEMENTS EXPLORER */}
      {reportTab === 'members' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Select any Member to view their Account Statement & Export to Excel
            </h3>
            <p className="text-xs text-slate-500">
              Click "View Statement" on any customer account to open their date-wise ledger and download Excel statements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allMembers.map(member => {
              const memberTxs = store.getMemberTransactions(member.id);
              const totalPaid = memberTxs
                .filter(t => t.status === 'completed')
                .reduce((acc, t) => acc + t.amount, 0);

              const assignedCollector = allCollectors.find(c => c.id === member.assignedCollectorId);

              return (
                <div
                  key={member.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between hover:border-emerald-500 transition"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs">
                      {member.code.replace('AC-', '')}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h4 className="text-sm font-extrabold text-slate-900">{member.name}</h4>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-700 font-bold">
                          {member.code}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        📞 {member.phone} • Daily: <strong>{formatCurrency(member.dailyAmount)}</strong>
                      </p>
                      <p className="text-[11px] text-emerald-700 font-bold mt-1">
                        Total Verified Paid: {formatCurrency(totalPaid)} ({memberTxs.length} entries)
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedMemberForStatement(member)}
                    className="py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Statement</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: COLLECTOR STATEMENTS EXPLORER */}
      {reportTab === 'collectors' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200">
            <h3 className="text-sm font-black text-slate-900 mb-1">
              Collector Performance Statements & Cash Reconciliation Log
            </h3>
            <p className="text-xs text-slate-500">
              Audit each collector's total collections, cash in hand, daily settlement records, and export to Excel.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allCollectors.map(collector => {
              const collectorStats = store.getCollectorTodayStats(collector.id);
              const allCollectorTxs = store
                .getTransactions()
                .filter(t => t.collectorId === collector.id && t.status === 'completed');
              const lifetimeTotal = allCollectorTxs.reduce((acc, t) => acc + t.amount, 0);

              return (
                <div
                  key={collector.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-11 h-11 rounded-xl bg-purple-100 text-purple-800 font-bold flex items-center justify-center text-sm">
                        {collector.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-slate-900">{collector.name}</h4>
                        <p className="text-xs text-slate-500">📞 {collector.phone}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedCollectorForStatement(collector)}
                      className="py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                      <span>View Statement</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[11px] text-slate-500 block">Total Lifetime Collections</span>
                      <span className="text-sm font-black text-slate-900 block mt-0.5">
                        {formatCurrency(lifetimeTotal)} ({allCollectorTxs.length})
                      </span>
                    </div>

                    <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                      <span className="text-[11px] text-emerald-800 block">Today's Cash in Hand</span>
                      <span className="text-sm font-black text-emerald-950 block mt-0.5">
                        {formatCurrency(collectorStats.cashCollected)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Member Statement Modal */}
      {selectedMemberForStatement && (
        <MemberStatementModal
          member={selectedMemberForStatement}
          onClose={() => setSelectedMemberForStatement(null)}
        />
      )}

      {/* Collector Statement Modal */}
      {selectedCollectorForStatement && (
        <CollectorStatementModal
          collector={selectedCollectorForStatement}
          onClose={() => setSelectedCollectorForStatement(null)}
        />
      )}
    </div>
  );
};
