import React, { useState } from 'react';
import { User, Member } from '../../types';
import { store } from '../../services/store';
import { CollectModal } from '../../components/CollectModal';
import { formatCurrency } from '../../utils/formatters';
import {
  Search,
  CheckCircle2,
  Clock,
  ShieldCheck,
  ChevronRight,
  Phone,
  Wallet,
} from 'lucide-react';

interface CollectorCollectProps {
  collector: User;
}

export const CollectorCollect: React.FC<CollectorCollectProps> = ({ collector }) => {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'pending' | 'collected'>('pending');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const allMembers = store.getMembers().filter(m => m.isActive);
  const stats = store.getCollectorTodayStats(collector.id);
  const todayTransactions = store.getTransactions().filter(
    t => t.collectionDate === stats.today && t.status === 'completed'
  );

  const paidMemberIds = new Set(todayTransactions.map(t => t.memberId));

  // Filter members based on collector permission
  const eligibleMembers = allMembers.filter(m => {
    if (collector.canCollectAll) return true;
    return m.assignedCollectorId === collector.id;
  });

  const pendingMembers = eligibleMembers.filter(m => !paidMemberIds.has(m.id));
  const collectedMembers = eligibleMembers.filter(m => paidMemberIds.has(m.id));

  const currentList = activeFilter === 'pending' ? pendingMembers : collectedMembers;

  const filteredMembers = currentList.filter(m => {
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      m.name.toLowerCase().includes(query) ||
      m.code.toLowerCase().includes(query) ||
      m.phone.includes(query)
    );
  });

  return (
    <div className="space-y-4 pb-24">
      {/* Top Banner & Hand in Cash Quick Stat */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-200">
                Welcome, {collector.name}
              </span>
              {collector.canCollectAll && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 text-[10px] font-extrabold flex items-center">
                  <ShieldCheck className="w-3 h-3 mr-1" /> All Members Access
                </span>
              )}
            </div>
            <p className="text-xs text-emerald-300 font-medium mt-0.5">
              Cash in Hand:
            </p>
            <h2 className="text-2xl font-black mt-0.5 tracking-tight">
              {formatCurrency(stats.cashCollected)}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-emerald-300 block">Today's Total:</span>
            <span className="text-base font-bold text-white">
              {formatCurrency(stats.totalCollected)}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-0.5">
              ({stats.collectedCount} members)
            </span>
          </div>
        </div>
      </div>

      {/* Quick Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by code (e.g. 101), name, or phone number..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 shadow-xs focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-hidden transition"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-slate-600"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs: Pending vs Collected */}
      <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          type="button"
          onClick={() => setActiveFilter('pending')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeFilter === 'pending'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Today ({pendingMembers.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('collected')}
          className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeFilter === 'collected'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Collected ({collectedMembers.length})</span>
        </button>
      </div>

      {/* Member Cards List */}
      <div className="space-y-2.5">
        {filteredMembers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            {activeFilter === 'pending' ? (
              <>
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-700">
                  Great work! All collections are complete for today.
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  No pending members left on your list.
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">
                No collections have been recorded today yet.
              </p>
            )}
          </div>
        ) : (
          filteredMembers.map(member => {
            const isPaid = paidMemberIds.has(member.id);

            return (
              <div
                key={member.id}
                onClick={() => setSelectedMember(member)}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex items-center justify-between cursor-pointer hover:border-emerald-500 active:scale-[0.99] transition ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 ${
                      isPaid
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {member.code ? member.code.replace('AC-', '') : member.name?.charAt(0) || 'M'}
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="text-sm font-extrabold text-slate-900">
                        {member.name}
                      </h3>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                        {member.code}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      📞 {member.phone} {member.address && `• ${member.address}`}
                    </p>

                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs font-black text-emerald-700">
                        Daily: {formatCurrency(member.dailyAmount)}
                      </span>
                      {isPaid && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Collected Today
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <a
                    href={`tel:${member.phone}`}
                    onClick={e => e.stopPropagation()}
                    className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition"
                    title="Call Member"
                  >
                    <Phone className="w-4 h-4" />
                  </a>

                  <div
                    className={`p-2 rounded-xl text-white font-bold flex items-center space-x-1 text-xs shadow-xs ${
                      isPaid ? 'bg-slate-600' : 'bg-emerald-600 shadow-emerald-200'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    <span>{isPaid ? 'Again' : 'Collect'}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Collect Modal */}
      {selectedMember && (
        <CollectModal
          member={selectedMember}
          collector={collector}
          onClose={() => setSelectedMember(null)}
          onSuccess={() => setSelectedMember(null)}
        />
      )}
    </div>
  );
};
