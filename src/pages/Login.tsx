import React, { useState } from 'react';
import { store } from '../services/store';
import { User, UserRole } from '../types';
import { Building2, ShieldCheck, UserCheck, ArrowRight, Phone, KeyRound } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const settings = store.getSettings();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    if (role === 'admin') {
      setPhone('9876543210');
      setPassword('admin123');
    } else {
      setPhone('9822011111');
      setPassword('coll123');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const user = store.login(phone, selectedRole);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid mobile number or password, or account is inactive.');
    }
  };

  const handleQuickLogin = (targetPhone: string, role: UserRole) => {
    const user = store.login(targetPhone, role);
    if (user) {
      onLoginSuccess(user);
    }
  };

  return (
    <div className="min-h-[90vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-emerald-200">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {settings.appName}
          </h1>
          <p className="text-xs font-semibold text-slate-500 mt-1">
            Daily Collection & Ledger Management System
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-extrabold transition ${
              selectedRole === 'admin'
                ? 'bg-white text-purple-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Super Admin</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('collector')}
            className={`flex items-center justify-center space-x-2 py-2.5 rounded-xl text-xs font-extrabold transition ${
              selectedRole === 'collector'
                ? 'bg-white text-emerald-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            <span>Collector Login</span>
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Mobile Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                required
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password / PIN
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2"
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* 1-Tap Quick Demo Logins for Fast Evaluation */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center mb-2.5">
            ⚡ Quick 1-Tap Demo Login (Evaluation)
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => handleQuickLogin('9876543210', 'admin')}
              className="w-full py-2 px-3 bg-purple-50 hover:bg-purple-100 text-purple-900 rounded-xl text-xs font-bold flex items-center justify-between transition"
            >
              <span>👑 Super Admin</span>
              <span className="text-[10px] text-purple-600">Login ➜</span>
            </button>
            <button
              onClick={() => handleQuickLogin('9822011111', 'collector')}
              className="w-full py-2 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 rounded-xl text-xs font-bold flex items-center justify-between transition"
            >
              <span>🛵 Rajesh Kumar (All Members Collector)</span>
              <span className="text-[10px] text-emerald-600">Login ➜</span>
            </button>
            <button
              onClick={() => handleQuickLogin('9822022222', 'collector')}
              className="w-full py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-900 rounded-xl text-xs font-bold flex items-center justify-between transition"
            >
              <span>🚶‍♂️ Vikram Singh (Assigned Only Collector)</span>
              <span className="text-[10px] text-blue-600">Login ➜</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
