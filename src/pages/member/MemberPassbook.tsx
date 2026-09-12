import React, { useState } from 'react';
import { store } from '../../services/store';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import { buildUpiUri, launchUpiApp } from '../../utils/upi';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Lock,
  Unlock,
  Building2,
  QrCode,
  ArrowRight,
  CheckCircle2,
  Send,
  PhoneCall,
  History,
  Clock,
} from 'lucide-react';

interface MemberPassbookProps {
  token: string;
}

export const MemberPassbook: React.FC<MemberPassbookProps> = ({ token }) => {
  const localMember = store.getMemberByToken(token);
  const settings = store.getSettings();

  const [serverMember, setServerMember] = useState<any>(null);
  const [serverTransactions, setServerTransactions] = useState<any[] | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  const member = serverMember || localMember;

  const [enteredPin, setEnteredPin] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Pay amount (defaults to member's daily amount)
  const [payAmount, setPayAmount] = useState<number>(member?.dailyAmount || 200);
  const [showQr, setShowQr] = useState(false);
  const [showUtrForm, setShowUtrForm] = useState(false);
  const [utrNumber, setUtrNumber] = useState('');
  const [submittedUtr, setSubmittedUtr] = useState(false);

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPin.length < 4) return;
    setIsVerifying(true);
    setPinError(false);

    try {
      const res = await fetch('/api/passbook/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, pin: enteredPin }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.member) {
          setServerMember(data.member);
          setServerTransactions(data.transactions);
          if (data.member.dailyAmount) {
            setPayAmount(data.member.dailyAmount);
          }
          setIsUnlocked(true);
          setIsVerifying(false);
          return;
        }
      }
    } catch {
      // Offline fallback
    }

    // Offline / local store fallback check
    if (localMember && localMember.pin && enteredPin === localMember.pin) {
      setIsUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
      setEnteredPin('');
    }
    setIsVerifying(false);
  };

  // If locked, show 4-digit PIN gate
  if (!isUnlocked) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-100 to-slate-200">
        <div className="bg-white w-full max-w-sm rounded-3xl shadow-xl border border-slate-200 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
            <Lock className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            {settings.appName}
          </h2>
          <p className="text-xs font-semibold text-slate-500 mt-0.5">
            Security PIN Required
          </p>

          <div className="my-5 p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-xs font-bold text-slate-700">{member?.name || 'Customer Passbook'}</p>
            <p className="text-[11px] font-mono text-slate-500">
              {member?.code ? `Member Code: ${member.code}` : `Token: ${token}`}
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1.5">
                Enter your 4-Digit Passbook PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                required
                autoFocus
                disabled={isVerifying}
                value={enteredPin}
                onChange={e => setEnteredPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="• • • •"
                className="w-full text-center py-3 text-2xl font-mono font-black tracking-widest bg-slate-100 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden transition disabled:opacity-50"
              />
              {pinError && (
                <p className="text-xs font-bold text-rose-600 mt-1.5">
                  ❌ Incorrect PIN! Please try again.
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isVerifying || enteredPin.length < 4}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              <Unlock className="w-4 h-4" />
              <span>{isVerifying ? 'Verifying...' : 'Unlock Passbook'}</span>
            </button>
          </form>

          <p className="text-[11px] text-slate-400 mt-4">
            Forgot your PIN? Contact your collector or admin.
          </p>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center max-w-sm">
          <p className="text-sm font-bold text-rose-600">
            ⚠️ Invalid or expired passbook link.
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Please check your URL or contact Amanat Collection support.
          </p>
        </div>
      </div>
    );
  }

  // Once unlocked: Full Passbook View
  const upiUri = buildUpiUri({
    upiVpa: settings.upiVpa,
    upiName: settings.upiName,
    amount: payAmount,
    memberCode: member.code,
    note: 'Daily Collection Deposit',
  });

  const handlePayViaUpi = () => {
    launchUpiApp({
      upiVpa: settings.upiVpa,
      upiName: settings.upiName,
      amount: payAmount,
      memberCode: member.code,
    });
  };

  const handleUtrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrNumber.trim()) return;

    store.addTransaction({
      memberId: member.id,
      amount: payAmount,
      paymentMode: 'online',
      utrNumber: utrNumber.trim(),
      notes: 'Submitted directly by member via Passbook (UTR verification pending)',
      status: 'pending_verification',
    });

    try {
      confetti({ particleCount: 50, spread: 50 });
    } catch {
      // ignore
    }

    setSubmittedUtr(true);
    setUtrNumber('');
    setShowUtrForm(false);
  };

  const transactions = serverTransactions || store.getMemberTransactions(member.id);
  const deposits = transactions.filter((t: any) => (t.txType === 'deposit' || !t.txType) && t.status === 'completed');
  const withdrawals = transactions.filter((t: any) => t.txType === 'withdrawal' && t.status === 'completed');
  const totalDeposited = deposits.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const totalWithdrawn = withdrawals.reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);
  const netBalance = Math.max(0, totalDeposited - totalWithdrawn);
  const balanceInfo = {
    totalDeposited,
    totalWithdrawn,
    netBalance,
  };

  const pendingVerificationAmount = transactions
    .filter((t: any) => t.status === 'pending_verification')
    .reduce((acc: number, t: any) => acc + (Number(t.amount) || 0), 0);

  const pendingCount = transactions.filter((t: any) => t.status === 'pending_verification').length;

  return (
    <div className="min-h-screen bg-slate-50 pb-16">
      {/* Passbook Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white pt-6 pb-12 px-4 shadow-md">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Building2 className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight">{settings.appName}</h1>
              <p className="text-[11px] text-emerald-200">Digital Passbook</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-700/80 text-[11px] font-bold">
            PIN Protected 🔒
          </span>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-8 space-y-4">
        {/* Passbook Summary Card */}
        <div className="bg-white rounded-3xl p-5 shadow-lg border border-slate-100 space-y-4">
          <div className="flex items-start justify-between border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold">
                {member.code}
              </span>
              <h2 className="text-lg font-black text-slate-900 mt-1">{member.name}</h2>
              <p className="text-xs text-slate-500">{member.phone}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Daily Installment
              </span>
              <span className="text-sm font-extrabold text-emerald-700">
                {formatCurrency(member.dailyAmount)} / day
              </span>
            </div>
          </div>

          {/* Primary Available Net Balance Card */}
          <div className="p-4 bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-2xl shadow-md shadow-emerald-200 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-100 block">
                Available Net Balance (शुद्ध शेष)
              </span>
              <span className="text-2xl font-black tracking-tight block mt-0.5">
                {formatCurrency(balanceInfo.netBalance)}
              </span>
            </div>
            <div className="text-right text-[11px] text-emerald-100 font-semibold">
              <span className="block">{transactions.length} Total Entries</span>
            </div>
          </div>

          {/* Sub Totals: Total Deposited vs Total Withdrawn */}
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="p-3 bg-emerald-50/70 rounded-2xl border border-emerald-100">
              <span className="text-[11px] font-bold text-emerald-800 block">Total Deposited</span>
              <span className="text-lg font-black text-emerald-950 mt-0.5 block">
                {formatCurrency(balanceInfo.totalDeposited)}
              </span>
            </div>
            <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-100">
              <span className="text-[11px] font-bold text-amber-800 block">Total Withdrawn</span>
              <span className="text-lg font-black text-amber-950 mt-0.5 block">
                {formatCurrency(balanceInfo.totalWithdrawn)}
              </span>
            </div>
          </div>

          {pendingCount > 0 && (
            <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
              <span className="text-amber-900 font-bold flex items-center">
                <span className="w-2 h-2 rounded-full bg-amber-500 mr-1.5 animate-pulse"></span>
                Under Bank Verification:
              </span>
              <span className="font-extrabold text-amber-950">
                {formatCurrency(pendingVerificationAmount)} ({pendingCount} entries)
              </span>
            </div>
          )}
        </div>

        {/* UPI Payment Card */}
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <QrCode className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">
                  Pay Directly via UPI
                </h3>
                <p className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm</p>
              </div>
            </div>
            <button
              onClick={() => setShowQr(!showQr)}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              {showQr ? 'Hide QR' : 'Show QR'}
            </button>
          </div>

          {/* Amount selector */}
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-slate-600">Amount:</span>
            <div className="flex-1 relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                ₹
              </span>
              <input
                type="number"
                min="1"
                value={payAmount}
                onChange={e => setPayAmount(Number(e.target.value))}
                className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:border-blue-500 outline-hidden"
              />
            </div>
          </div>

          {/* Dynamic QR Code */}
          {showQr && (
            <div className="flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="p-3 bg-white rounded-xl shadow-xs">
                <QRCodeSVG value={upiUri} size={160} level="M" />
              </div>
              <p className="text-xs font-bold text-slate-800 mt-2">
                Scan QR to pay {formatCurrency(payAmount)}
              </p>
              <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                UPI ID: {settings.upiVpa}
              </p>
            </div>
          )}

          {/* Pay Button for Mobile */}
          <button
            onClick={handlePayViaUpi}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white rounded-2xl font-black text-sm shadow-md shadow-blue-200 flex items-center justify-center space-x-2 transition"
          >
            <span>Pay via UPI App ({formatCurrency(payAmount)})</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Submit UTR toggle */}
          <div className="text-center pt-1">
            <button
              onClick={() => setShowUtrForm(!showUtrForm)}
              className="text-xs font-bold text-slate-500 hover:text-slate-700"
            >
              {showUtrForm ? 'Close Form ✕' : 'Paid already? Submit 12-digit UTR Number ➜'}
            </button>
          </div>

          {/* UTR Submission Form */}
          {showUtrForm && (
            <form onSubmit={handleUtrSubmit} className="p-3.5 bg-slate-50 rounded-2xl space-y-2.5">
              <label className="block text-xs font-bold text-slate-700">
                12-Digit UPI UTR / Reference No.
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 429381203912"
                value={utrNumber}
                onChange={e => setUtrNumber(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 outline-hidden"
              />
              <button
                type="submit"
                className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit UTR</span>
              </button>
            </form>
          )}

          {submittedUtr && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 text-center flex items-center justify-center space-x-1.5">
              <Clock className="w-4 h-4 text-amber-600 animate-spin" />
              <span>UTR Submitted! Status: Unverified (Under Bank Review). Your passbook will update to Verified once approved.</span>
            </div>
          )}
        </div>

        {/* Passbook Statement Ledger */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 flex items-center space-x-1.5">
              <History className="w-4 h-4 text-slate-500" />
              <span>Passbook Ledger Statement</span>
            </h3>
            <span className="text-[11px] font-bold text-slate-400">
              {transactions.length} entries
            </span>
          </div>

          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No transactions recorded yet.
              </div>
            ) : (
              transactions.map(tx => {
                const isWithdrawal = tx.txType === 'withdrawal';

                return (
                  <div key={tx.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <span className="text-xs font-extrabold text-slate-900">
                          {formatDate(tx.collectionDate)}
                        </span>
                        {isWithdrawal ? (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                            Withdrawal / Payout ({tx.paymentMode === 'cash' ? 'Cash' : 'Online'})
                          </span>
                        ) : (
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              tx.paymentMode === 'cash'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            Deposit ({tx.paymentMode === 'cash' ? 'Cash' : 'Online UPI'})
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatDateTime(tx.createdAt)}
                        {tx.notes && ` • ${tx.notes}`}
                        {tx.utrNumber && ` • Ref: ${tx.utrNumber}`}
                      </p>
                      {tx.rejectionReason && (
                        <p className="text-[10px] text-rose-600 font-semibold mt-0.5">
                          ❌ Reason: {tx.rejectionReason}
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <span
                        className={`text-sm font-black block ${
                          tx.status === 'rejected'
                            ? 'text-slate-400 line-through'
                            : tx.status === 'pending_verification'
                            ? 'text-amber-700'
                            : isWithdrawal
                            ? 'text-amber-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {isWithdrawal ? '-' : '+'}{formatCurrency(tx.amount)}
                      </span>
                      <span
                        className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full inline-flex items-center justify-end ${
                          tx.status === 'completed'
                            ? isWithdrawal
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                            : tx.status === 'pending_verification'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {tx.status === 'completed' ? (
                          isWithdrawal ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-0.5 text-amber-600" /> Paid Out
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-0.5 text-emerald-600" /> Verified
                            </>
                          )
                        ) : tx.status === 'pending_verification' ? (
                          <>
                            <Clock className="w-3 h-3 mr-0.5 text-amber-600" /> Unverified
                          </>
                        ) : (
                          'Rejected'
                        )}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Support Help Footer */}
        {settings.supportPhone && (
          <div className="text-center pt-2">
            <a
              href={`tel:${settings.supportPhone}`}
              className="inline-flex items-center space-x-1 text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>For help call: {settings.supportPhone}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
};
