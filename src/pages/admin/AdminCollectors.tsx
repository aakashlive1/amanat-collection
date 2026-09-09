import React, { useState } from 'react';
import { store } from '../../services/store';
import { User } from '../../types';
import { CollectorModal } from '../../components/CollectorModal';
import { DeleteConfirmModal } from '../../components/DeleteConfirmModal';
import { formatCurrency } from '../../utils/formatters';
import {
  UserPlus,
  ShieldCheck,
  Lock,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Banknote,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import { CollectorStatementModal } from '../../components/CollectorStatementModal';

export const AdminCollectors: React.FC = () => {
  const collectors = store.getCollectors();
  const members = store.getMembers();
  const [editingCollector, setEditingCollector] = useState<User | null | 'new'>(null);
  const [selectedStatementCollector, setSelectedStatementCollector] = useState<User | null>(null);
  const [deletingCollector, setDeletingCollector] = useState<User | null>(null);

  const handleToggleCollectAll = (collectorId: string) => {
    store.toggleCollectorCanCollectAll(collectorId);
  };

  const handleToggleCanVerify = (collectorId: string) => {
    store.toggleCollectorCanVerifyPayments(collectorId);
  };

  const handleToggleStatus = (collectorId: string) => {
    store.toggleCollectorStatus(collectorId);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
        <div>
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Collectors Management
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            {collectors.length} registered collectors
          </p>
        </div>

        <button
          onClick={() => setEditingCollector('new')}
          className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 flex items-center justify-center space-x-1.5 transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Collector</span>
        </button>
      </div>

      {/* Collectors List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collectors.map(collector => {
          const assignedMembersCount = members.filter(
            m => m.assignedCollectorId === collector.id && m.isActive
          ).length;
          const stats = store.getCollectorTodayStats(collector.id);

          return (
            <div
              key={collector.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-11 h-11 rounded-xl bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-sm">
                    {collector.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {collector.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      📞 {collector.phone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleToggleStatus(collector.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1 ${
                      collector.isActive
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {collector.isActive ? (
                      <>
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Active</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3 text-slate-400" />
                        <span>Inactive</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setSelectedStatementCollector(collector)}
                    className="p-1.5 text-purple-700 hover:bg-purple-50 rounded-lg transition text-xs font-bold flex items-center space-x-1"
                    title="View Collector Statement & Export to Excel"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                    <span className="text-[11px]">Statement</span>
                  </button>

                  <button
                    onClick={() => setEditingCollector(collector)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    title="Edit Collector"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingCollector(collector)}
                    className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                    title="Delete Collector"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Permission Badge: All Members vs Assigned */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {collector.canCollectAll ? (
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-500" />
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      {collector.canCollectAll ? 'All Members Access (Company-wide)' : 'Assigned Members Only'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {collector.canCollectAll
                        ? 'Can search and collect from any member'
                        : `Restricted to their ${assignedMembersCount} assigned members`}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCollectAll(collector.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    collector.canCollectAll
                      ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  Change
                </button>
              </div>

              {/* Permission Badge: Online UPI Verification Rights */}
              <div className="p-3 bg-slate-50 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <ShieldCheck
                    className={`w-4 h-4 ${
                      collector.canVerifyPayments ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Online UPI Verification:{' '}
                      <span className={collector.canVerifyPayments ? 'text-blue-700' : 'text-slate-500'}>
                        {collector.canVerifyPayments ? 'Allowed' : 'Disabled'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {collector.canVerifyPayments
                        ? 'Can verify members’ self-paid online UTRs'
                        : 'Only Admin can verify online UPI submissions'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleCanVerify(collector.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                    collector.canVerifyPayments
                      ? 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                      : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                  }`}
                >
                  {collector.canVerifyPayments ? 'Revoke' : 'Grant'}
                </button>
              </div>

              {/* Today's collection summary for this collector */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 bg-emerald-50/50 rounded-xl border border-emerald-100">
                  <span className="text-[11px] text-emerald-800 font-semibold block flex items-center">
                    <Banknote className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                    Cash in Hand
                  </span>
                  <span className="text-sm font-black text-emerald-950 mt-0.5 block">
                    {formatCurrency(stats.cashCollected)}
                  </span>
                </div>

                <div className="p-2.5 bg-blue-50/50 rounded-xl border border-blue-100">
                  <span className="text-[11px] text-blue-800 font-semibold block flex items-center">
                    <Users className="w-3.5 h-3.5 mr-1 text-blue-600" />
                    Today's Collections
                  </span>
                  <span className="text-sm font-black text-blue-950 mt-0.5 block">
                    {stats.collectedCount} members ({formatCurrency(stats.totalCollected)})
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Collector Edit Modal */}
      {editingCollector && (
        <CollectorModal
          collector={editingCollector === 'new' ? null : editingCollector}
          onClose={() => setEditingCollector(null)}
          onSuccess={() => setEditingCollector(null)}
        />
      )}

      {/* Collector Statement Modal */}
      {selectedStatementCollector && (
        <CollectorStatementModal
          collector={selectedStatementCollector}
          onClose={() => setSelectedStatementCollector(null)}
        />
      )}

      {/* Delete Collector Confirmation Modal */}
      {deletingCollector && (
        <DeleteConfirmModal
          isOpen={Boolean(deletingCollector)}
          title="Delete Collector"
          itemName={deletingCollector.name}
          itemDetails={`Phone: ${deletingCollector.phone} • Role: Collector`}
          warningText="Are you sure you want to permanently delete this collector? Any members currently assigned to this collector will become unassigned. This action cannot be undone."
          onClose={() => setDeletingCollector(null)}
          onConfirm={() => {
            store.deleteCollector(deletingCollector.id);
            setDeletingCollector(null);
          }}
        />
      )}
    </div>
  );
};
