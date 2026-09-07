import React, { useState } from 'react';
import { store } from '../../services/store';
import { CashSettlement } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import {
  HandCoins,
  CheckCircle2,
  Clock,
  Check,
  Building2,
} from 'lucide-react';

export const AdminSettlements: React.FC = () => {
  const settlements = store.getSettlements();
  const collectors = store.getCollectors();
  const currentAdmin = store.getAuthUser();

  const [settlingItem, setSettlingItem] = useState<CashSettlement | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const pastSettlements = settlements.filter(s => s.status !== 'pending');

  const handleApprove = () => {
    if (!settlingItem || !currentAdmin) return;
    store.updateSettlementStatus(settlingItem.id, 'approved', currentAdmin.id, adminNotes);
    setSettlingItem(null);
    setAdminNotes('');
  };

  return (
    <div className="space-y-5 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
          <HandCoins className="w-5 h-5 text-emerald-600" />
          <span>Daily Cash Settlements & Handover Reconciliation</span>
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">
          Verify physical cash submitted by collectors and approve settlements to balance company accounts.
        </p>
      </div>

      {/* Pending Handover Requests */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Pending Handover Approvals ({pendingSettlements.length})</span>
        </h3>

        {pendingSettlements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              All collector cash settlements are fully up to date!
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              No pending cash handovers require approval at this time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingSettlements.map(item => {
              const collector = collectors.find(c => c.id === item.collectorId);
              const isMatch = item.cashCollected === item.cashSubmitted;

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl border-2 border-amber-300 p-4 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Date: {item.settlementDate}
                      </span>
                      <h4 className="text-base font-black text-slate-900 mt-0.5">
                        {collector?.name || 'Unknown Collector'}
                      </h4>
                      <p className="text-xs text-slate-500">📞 {collector?.phone}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[11px] font-extrabold flex items-center">
                      <Clock className="w-3 h-3 mr-1" /> Pending Approval
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl">
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Total Cash Collected:
                      </span>
                      <span className="text-base font-black text-slate-900">
                        {formatCurrency(item.cashCollected)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-500 font-semibold block">
                        Submitted Cash:
                      </span>
                      <span
                        className={`text-base font-black ${
                          isMatch ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {formatCurrency(item.cashSubmitted)}
                      </span>
                    </div>
                  </div>

                  {item.notes && (
                    <p className="text-xs text-slate-600 bg-amber-50/60 p-2 rounded-lg italic">
                      Note: "{item.notes}"
                    </p>
                  )}

                  <button
                    onClick={() => {
                      setSettlingItem(item);
                      setAdminNotes('');
                    }}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Cash Received, Approve Settlement</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past Approved Settlements */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-extrabold text-slate-900">
            Past Settlement Records
          </h3>
        </div>

        <div className="divide-y divide-slate-100">
          {pastSettlements.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400">
              No past settlement records found.
            </div>
          ) : (
            pastSettlements.map(item => {
              const collector = collectors.find(c => c.id === item.collectorId);
              return (
                <div key={item.id} className="p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      {collector?.name || 'Collector'} • Date: {item.settlementDate}
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submitted Amount: <strong className="text-emerald-700">{formatCurrency(item.cashSubmitted)}</strong>
                      {item.approvedAt && ` • Approved: ${formatDateTime(item.approvedAt)}`}
                    </p>
                    {item.notes && (
                      <p className="text-[11px] text-slate-400 italic mt-0.5">"{item.notes}"</p>
                    )}
                  </div>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                    Settled
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Verification Modal */}
      {settlingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <Building2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Cash Verification & Approval
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Have you physically counted and verified {formatCurrency(settlingItem.cashSubmitted)} cash?
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Admin Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cash bag received, full amount matched"
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setSettlingItem(null)}
                className="w-1/2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="w-1/2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition"
              >
                Approve Settlement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
