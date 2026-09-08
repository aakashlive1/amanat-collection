import React, { useState } from 'react';
import { store } from '../services/store';
import { User } from '../types';
import { ShieldCheck, UserCheck, LogOut, RotateCcw, Building2, RefreshCw, CloudCheck } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onSelectUser: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onSelectUser }) => {
  const settings = store.getSettings();
  const allUsers = store.getUsers();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await store.syncWithCloud();
    setTimeout(() => setIsSyncing(false), 600);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-2.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-slate-900 leading-tight">
              {settings.appName}
            </h1>
            <p className="text-[11px] font-medium text-emerald-700">
              Daily Collection System
            </p>
          </div>
        </div>

        {/* Cloud Sync & User Controls */}
        {currentUser && (
          <div className="flex items-center space-x-2">
            {/* Live Cloud Sync Button */}
            <button
              onClick={handleManualSync}
              disabled={isSyncing}
              title="Sync with Cloudflare D1 Database"
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200/60 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isSyncing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isSyncing ? 'Syncing...' : 'Sync Cloud'}</span>
            </button>

            {/* User Badge */}
            <div className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-700">
              {currentUser.role === 'admin' ? (
                <ShieldCheck className="w-4 h-4 text-purple-600" />
              ) : (
                <UserCheck className="w-4 h-4 text-emerald-600" />
              )}
              <span className="max-w-[120px] truncate">{currentUser.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-bold uppercase">
                {currentUser.role === 'admin' ? 'Admin' : 'Collector'}
              </span>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Sign Out"
              className="flex items-center space-x-1 p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span className="text-xs font-bold text-slate-600 hover:text-rose-600 hidden sm:inline">Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
