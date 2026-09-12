import React, { useState } from 'react';
import { store } from '../services/store';
import { User, UserRole } from '../types';
import { Building2, ShieldCheck, UserCheck, ArrowRight, Phone, KeyRound, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLoginSuccess: (user: User) => void;
  onBack?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess, onBack }) => {
  const settings = store.getSettings();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setError('');
    setPhone('');
    setPassword('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Please enter your mobile number.');
      return;
    }

    if (!password.trim()) {
      setError('Please enter your password.');
      return;
    }

    const user = store.login(phone, password, selectedRole);
    if (user) {
      onLoginSuccess(user);
    } else {
      setError('Invalid mobile number or password, or account is inactive.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-100 p-6 sm:p-8 relative">
        {/* Optional Back to Website button */}
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="absolute top-6 left-6 text-xs font-bold text-slate-500 hover:text-emerald-700 flex items-center space-x-1 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Website</span>
          </button>
        )}

        {/* Brand Header */}
        <div className="text-center mb-6 pt-2">
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
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Password
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:bg-white focus:border-emerald-500 outline-hidden transition"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-200 transition flex items-center justify-center space-x-2 cursor-pointer"
          >
            <span>Sign In Securely</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
