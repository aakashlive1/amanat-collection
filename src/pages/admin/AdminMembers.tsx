import React, { useState } from 'react';
import { store } from '../../services/store';
import { Member } from '../../types';
import { MemberModal } from '../../components/MemberModal';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { MemberStatementModal } from '../../components/MemberStatementModal';
import { WithdrawModal } from '../../components/WithdrawModal';
import { CollectModal } from '../../components/CollectModal';
import { formatCurrency } from '../../utils/formatters';
import {
  UserPlus,
  Search,
  ExternalLink,
  MessageSquare,
  Edit2,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  ArrowDownCircle,
  PlusCircle,
  Wallet,
} from 'lucide-react';

export const AdminMembers: React.FC = () => {
  const members = store.getMembers();
  const collectors = store.getCollectors();
  const authUser = store.getAuthUser() || store.getUsers().find(u => u.role === 'admin') || {
    id: 'u-admin-1',
    name: 'Super Admin',
    phone: '9876543210',
    role: 'admin' as const,
    canCollectAll: true,
    canVerifyPayments: true,
    isActive: true,
    createdAt: new Date().toISOString(),
  };

  const [search, setSearch] = useState('');
  const [collectorFilter, setCollectorFilter] = useState('');
  const [editingMember, setEditingMember] = useState<Member | null | 'new'>(null);
  const [selectedStatementMember, setSelectedStatementMember] = useState<Member | null>(null);
  const [withdrawingMember, setWithdrawingMember] = useState<Member | null>(null);
  const [collectingMember, setCollectingMember] = useState<Member | null>(null);
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter members
  const filteredMembers = members.filter(m => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.phone.includes(search);
    const matchesCollector = !collectorFilter || m.assignedCollectorId === collectorFilter;
    return matchesSearch && matchesCollector;
  });

  const handleCopyPassbook = (member: Member) => {
    const url = `${window.location.origin}/#/m/${member.uniqueToken}`;
    navigator.clipboard.writeText(url);
    setCopiedId(member.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendWhatsApp = (member: Member) => {
    const url = `${window.location.origin}/#/m/${member.uniqueToken}`;
    let cleanPhone = member.phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    const text = `Hello ${member.name}! Your Amanat Collection passbook link: ${url}\nYour 4-Digit Security PIN: ${member.pin}`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Members Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {members.length} registered members total
          </p>
        </div>

        <button
          onClick={() => setEditingMember('new')}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center space-x-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code (e.g. AC-101), or phone..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-emerald-500 outline-hidden"
          />
        </div>

        <div>
          <select
            value={collectorFilter}
            onChange={e => setCollectorFilter(e.target.value)}
            className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:border-emerald-500 outline-hidden"
          >
            <option value="">All Collectors</option>
            {collectors.map(c => (
              <option key={c.id} value={c.id}>
                Collector: {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Members List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredMembers.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No members found matching your filter.
            </div>
          ) : (
            filteredMembers.map(member => {
              const assignedColl = collectors.find(c => c.id === member.assignedCollectorId);
              const balance = store.getMemberBalance(member.id);

              return (
                <div
                  key={member.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 font-bold flex items-center justify-center shrink-0">
                      {member.code ? member.code.replace('AC-', '') : member.name?.charAt(0) || 'M'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          {member.name}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                          {member.code}
                        </span>
                        {member.isActive ? (
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center">
                            <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" /> Active
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-bold flex items-center">
                            <XCircle className="w-3 h-3 mr-0.5" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 font-medium">
                        📞 {member.phone} {member.address && `• 📍 ${member.address}`}
                      </p>
                      <p className="text-xs text-slate-600 mt-1">
                        Daily Amount:{' '}
                        <span className="font-extrabold text-emerald-700">
                          {formatCurrency(member.dailyAmount)}
                        </span>
                        {assignedColl && (
                          <span className="text-slate-500 font-normal">
                            {' '}
                            • Collector: <strong className="font-semibold text-slate-700">{assignedColl.name}</strong>
                          </span>
                        )}
                        <span className="text-slate-400 ml-2">
                          (PIN: <code className="font-mono font-bold text-slate-700">{member.pin}</code>)
                        </span>
                      </p>

                      {/* Net Balance & Totals Badge */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-bold text-emerald-800">
                          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Net Balance:</span>
                          <span className="font-black text-emerald-700">{formatCurrency(balance.netBalance)}</span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-medium">
                          (Collected: <strong className="text-emerald-700">{formatCurrency(balance.totalDeposited)}</strong> | Withdrawn: <strong className="text-amber-700">{formatCurrency(balance.totalWithdrawn)}</strong>)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-1.5 shrink-0 self-end sm:self-center">
                    {/* Collect Payment Button */}
                    <button
                      onClick={() => setCollectingMember(member)}
                      className="py-1.5 px-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl transition text-xs flex items-center space-x-1 font-bold active:scale-95"
                      title="Record Payment Collection"
                    >
                      <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Collect</span>
                    </button>

                    {/* Member Payout / Withdrawal Button */}
                    <button
                      onClick={() => setWithdrawingMember(member)}
                      className="py-1.5 px-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl transition text-xs flex items-center space-x-1 font-bold active:scale-95"
                      title="Process Member Payout / Withdrawal"
                    >
                      <ArrowDownCircle className="w-3.5 h-3.5 text-amber-600" />
                      <span>Payout</span>
                    </button>

                    {/* Copy Passbook Link */}
                    <button
                      onClick={() => handleCopyPassbook(member)}
                      className="p-2 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition text-xs flex items-center space-x-1"
                      title="Copy Passbook Link"
                    >
                      {copiedId === member.id ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                      <span className="text-[11px] font-bold">Link</span>
                    </button>

                    {/* WhatsApp share passbook */}
                    <button
                      onClick={() => handleSendWhatsApp(member)}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                      title="Send Passbook Link via WhatsApp"
                    >
                      <MessageSquare className="w-4 h-4" />
                    </button>

                    {/* Direct open passbook in new tab */}
                    <a
                      href={`/#/m/${member.uniqueToken}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                      title="Open Passbook"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>

                    {/* Member Statement Button */}
                    <button
                      onClick={() => setSelectedStatementMember(member)}
                      className="p-2 text-emerald-700 hover:bg-emerald-50 rounded-xl transition text-xs flex items-center space-x-1 font-bold"
                      title="View Member Account Statement & Export to Excel"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span className="hidden sm:inline">Statement</span>
                    </button>

                    {/* Edit Member */}
                    <button
                      onClick={() => setEditingMember(member)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition"
                      title="Edit Member"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    {/* Delete Member */}
                    <button
                      onClick={() => setDeletingMember(member)}
                      className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
                      title="Delete Member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Member Edit / Create Modal */}
      {editingMember && (
        <MemberModal
          member={editingMember === 'new' ? null : editingMember}
          collectors={collectors}
          onClose={() => setEditingMember(null)}
          onSuccess={() => setEditingMember(null)}
        />
      )}

      {/* Collect Modal */}
      {collectingMember && (
        <CollectModal
          member={collectingMember}
          collector={authUser}
          onClose={() => setCollectingMember(null)}
          onSuccess={() => setCollectingMember(null)}
        />
      )}

      {/* Member Payout / Withdraw Modal */}
      {withdrawingMember && (
        <WithdrawModal
          member={withdrawingMember}
          processedBy={authUser}
          onClose={() => setWithdrawingMember(null)}
          onSuccess={() => setWithdrawingMember(null)}
        />
      )}

      {/* Member Account Statement Modal */}
      {selectedStatementMember && (
        <MemberStatementModal
          member={selectedStatementMember}
          onClose={() => setSelectedStatementMember(null)}
        />
      )}

      {/* Delete Member Confirmation Modal */}
      {deletingMember && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingMember)}
          title="Delete Member"
          itemName={deletingMember.name}
          itemDetails={`Code: ${deletingMember.code} • Phone: ${deletingMember.phone} • Daily Amount: ${formatCurrency(deletingMember.dailyAmount)}`}
          warningText="Are you sure you want to permanently delete this member? All associated collection transaction history for this member will also be removed from the system and cloud database. This action cannot be undone."
          onClose={() => setDeletingMember(null)}
          onConfirm={() => {
            store.deleteMember(deletingMember.id);
            setDeletingMember(null);
          }}
        />
      )}
    </div>
  );
};
