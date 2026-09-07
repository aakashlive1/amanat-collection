import React, { useState } from 'react';
import { store } from '../services/store';
import { Transaction, User } from '../types';
import { formatCurrency, formatDateTime } from '../utils/formatters';
import {
  CheckCircle2,
  XCircle,
  Clock,
  QrCode,
  ShieldCheck,
  Search,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react';

interface OnlineVerificationsProps {
  currentUser: User;
}

export const OnlineVerifications: React.FC<OnlineVerificationsProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'unverified' | 'verified' | 'rejected'>('unverified');
  const [search, setSearch] = useState('');
  const [copiedUtr, setCopiedUtr] = useState<string | null>(null);

  // Rejection modal state
  const [rejectingTx, setRejectingTx] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('UTR not found in bank account statement');

  // Approval modal state
  const [approvingTx, setApprovingTx] = useState<Transaction | null>(null);
  const [approvalNote, setApprovalNote] = useState('Matched with bank credit alert');

  const allTransactions = store.getTransactions().filter(t => t.paymentMode === 'online');
  const allMembers = store.getMembers();
  const allUsers = store.getUsers();

  // Filter based on collector permissions
  const visibleTransactions = allTransactions.filter(t => {
    if (currentUser.role === 'admin') return true;
    // Collector
    if (!currentUser.canVerifyPayments) return false;
    if (currentUser.canCollectAll) return true;
    // Only assigned members
    const member = allMembers.find(m => m.id === t.memberId);
    return member?.assignedCollectorId === currentUser.id;
  });

  const unverifiedList = visibleTransactions.filter(t => t.status === 'pending_verification');
  const verifiedList = visibleTransactions.filter(t => t.status === 'completed' && t.utrNumber);
  const rejectedList = visibleTransactions.filter(t => t.status === 'rejected');

  const currentList =
    activeTab === 'unverified'
      ? unverifiedList
      : activeTab === 'verified'
      ? verifiedList
      : rejectedList;

  const filteredList = currentList.filter(t => {
    const member = allMembers.find(m => m.id === t.memberId);
    const query = search.toLowerCase().trim();
    if (!query) return true;
    return (
      (t.utrNumber && t.utrNumber.toLowerCase().includes(query)) ||
      (member && member.name.toLowerCase().includes(query)) ||
      (member && member.code.toLowerCase().includes(query)) ||
      (member && member.phone.includes(query))
    );
  });

  const handleCopyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(utr);
    setTimeout(() => setCopiedUtr(null), 2000);
  };

  const handleApprove = () => {
    if (!approvingTx) return;
    store.verifyOnlineTransaction(approvingTx.id, currentUser.id, approvalNote);
    setApprovingTx(null);
  };

  const handleReject = () => {
    if (!rejectingTx) return;
    store.rejectOnlineTransaction(rejectingTx.id, currentUser.id, rejectReason);
    setRejectingTx(null);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center space-x-2">
              <QrCode className="w-5 h-5 text-blue-600" />
              <span>Online UPI Verifications</span>
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Verify members' self-submitted UPI UTR reference numbers against company bank statement.
            </p>
          </div>
          {currentUser.role === 'admin' ? (
            <span className="px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-extrabold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600" /> Admin Rights
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold flex items-center">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600" /> Collector Verified Rights
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('unverified')}
          className={`relative flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'unverified'
              ? 'bg-white text-amber-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4 text-amber-500" />
          <span>Unverified</span>
          {unverifiedList.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
              {unverifiedList.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'verified'
              ? 'bg-white text-emerald-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Verified ({verifiedList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('rejected')}
          className={`flex items-center justify-center space-x-1.5 py-2.5 rounded-xl text-xs font-extrabold transition ${
            activeTab === 'rejected'
              ? 'bg-white text-rose-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <XCircle className="w-4 h-4 text-rose-600" />
          <span>Rejected ({rejectedList.length})</span>
        </button>
      </div>

      {/* Search Filter */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search by UTR number, member code, name, or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:border-blue-500 outline-hidden"
        />
      </div>

      {/* Transactions List */}
      <div className="space-y-3">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">
              {activeTab === 'unverified'
                ? 'No unverified online payments pending!'
                : activeTab === 'verified'
                ? 'No verified online payments found.'
                : 'No rejected payments.'}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {activeTab === 'unverified' && 'All member online UPI submissions have been verified.'}
            </p>
          </div>
        ) : (
          filteredList.map(tx => {
            const member = allMembers.find(m => m.id === tx.memberId);
            const verifier = tx.verifiedBy ? allUsers.find(u => u.id === tx.verifiedBy) : null;

            return (
              <div
                key={tx.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs space-y-3 transition ${
                  tx.status === 'pending_verification'
                    ? 'border-amber-300 bg-amber-50/20'
                    : tx.status === 'completed'
                    ? 'border-emerald-200'
                    : 'border-rose-200 bg-rose-50/20'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-black text-slate-900">
                        {member?.name || 'Member'}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                        {member?.code}
                      </span>
                      <span className="text-xs text-slate-500">📞 {member?.phone}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Submitted: {formatDateTime(tx.createdAt)}
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-lg font-black text-slate-900 block">
                      {formatCurrency(tx.amount)}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase inline-flex items-center ${
                        tx.status === 'pending_verification'
                          ? 'bg-amber-100 text-amber-800'
                          : tx.status === 'completed'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {tx.status === 'pending_verification' ? (
                        <>
                          <Clock className="w-3 h-3 mr-1 text-amber-600" />
                          Unverified
                        </>
                      ) : tx.status === 'completed' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Verified
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1 text-rose-600" />
                          Rejected
                        </>
                      )}
                    </span>
                  </div>
                </div>

                {/* UTR & Bank Statement Helper Box */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-semibold">Submitted UPI UTR:</span>
                    <div className="flex items-center space-x-1.5 font-mono font-bold text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200">
                      <span>{tx.utrNumber || 'No UTR provided'}</span>
                      {tx.utrNumber && (
                        <button
                          onClick={() => handleCopyUtr(tx.utrNumber!)}
                          className="text-slate-400 hover:text-blue-600"
                          title="Copy UTR to clipboard"
                        >
                          {copiedUtr === tx.utrNumber ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    💡 Check company bank / UPI statement for reference{' '}
                    <strong className="font-mono text-slate-800">{tx.utrNumber}</strong> with credit of{' '}
                    <strong className="text-emerald-700">{formatCurrency(tx.amount)}</strong>.
                  </p>

                  {tx.notes && (
                    <p className="text-[11px] text-slate-600 italic pt-1 border-t border-slate-200">
                      Member Note: "{tx.notes}"
                    </p>
                  )}

                  {/* If verified or rejected, show audit trail */}
                  {tx.verifiedAt && verifier && (
                    <div className="pt-1.5 border-t border-slate-200 text-[11px] text-slate-600 flex items-center justify-between">
                      <span>
                        {tx.status === 'completed' ? 'Verified by:' : 'Rejected by:'}{' '}
                        <strong>{verifier.name}</strong> ({verifier.role})
                      </span>
                      <span>{formatDateTime(tx.verifiedAt)}</span>
                    </div>
                  )}

                  {tx.rejectionReason && (
                    <div className="text-[11px] text-rose-700 font-semibold bg-rose-50 p-2 rounded-lg mt-1 flex items-start space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Reason: {tx.rejectionReason}</span>
                    </div>
                  )}
                </div>

                {/* Actions if still unverified */}
                {tx.status === 'pending_verification' && (
                  <div className="flex items-center space-x-2 pt-1">
                    <button
                      onClick={() => {
                        setRejectingTx(tx);
                        setRejectReason('UTR not found in bank account statement');
                      }}
                      className="w-1/3 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Reject</span>
                    </button>

                    <button
                      onClick={() => {
                        setApprovingTx(tx);
                        setApprovalNote('Verified in bank statement credit');
                      }}
                      className="w-2/3 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-1"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Mark Verified</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Approval Confirmation Modal */}
      {approvingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Confirm Online Payment
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Confirming {formatCurrency(approvingTx.amount)} via UTR{' '}
                <strong className="font-mono text-slate-800">{approvingTx.utrNumber}</strong>
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Verification Note (Optional)
              </label>
              <input
                type="text"
                value={approvalNote}
                onChange={e => setApprovalNote(e.target.value)}
                placeholder="e.g. Bank statement credit verified"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setApprovingTx(null)}
                className="w-1/2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="w-1/2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-200 transition"
              >
                Approve Payment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900">
                Reject Online Payment
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                This will mark the payment as rejected and show the reason in the member's passbook.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rejection Reason *
              </label>
              <select
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white outline-hidden mb-2"
              >
                <option value="UTR not found in bank account statement">
                  UTR not found in bank statement
                </option>
                <option value="Amount paid does not match entry">
                  Amount paid does not match entry
                </option>
                <option value="Transaction failed or reversed by bank">
                  Transaction failed or reversed by bank
                </option>
                <option value="Duplicate UTR reference entered">
                  Duplicate UTR reference entered
                </option>
              </select>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Custom reason..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white outline-hidden"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                onClick={() => setRejectingTx(null)}
                className="w-1/2 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="w-1/2 py-2.5 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition"
              >
                Reject Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
