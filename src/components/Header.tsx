import React from 'react';
import { store } from '../services/store';
import { User } from '../types';
import { ShieldCheck, UserCheck, LogOut, RotateCcw, Building2 } from 'lucide-react';

interface HeaderProps {
  currentUser: User | null;
  onLogout: () => void;
  onSelectUser: (user: User) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onLogout, onSelectUser }) => {
  const settings = store.getSettings();
  const allUsers = store.getUsers();

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

        {/* User Badge & Switcher for Easy Testing */}
        {currentUser && (
          <div className="flex items-center space-x-2">
            {/* Quick Demo Switcher dropdown */}
            <div className="relative group">
              <button className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 transition text-xs font-semibold text-slate-700">
                {currentUser.role === 'admin' ? (
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                )}
                <span className="max-w-[100px] truncate">{currentUser.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-slate-600 font-bold uppercase">
                  {currentUser.role === 'admin' ? 'Admin' : 'Collector'}
                </span>
              </button>

              {/* Quick switch menu on hover/click */}
              <div className="absolute right-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 hidden group-hover:block group-focus-within:block z-50">
                <div className="px-2.5 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Switch Account (Quick Test)
                </div>
                {allUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={() => onSelectUser(u)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center justify-between ${
                      currentUser.id === u.id ? 'bg-emerald-50 text-emerald-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="text-[10px] uppercase text-slate-500 font-mono">
                      {u.role === 'admin' ? 'Admin' : u.canCollectAll ? 'All' : 'Assigned'}
                    </span>
                  </button>
                ))}
                <div className="border-t border-slate-100 my-1"></div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to reset all demo data to default?')) {
                      store.resetToDemo();
                      window.location.reload();
                    }
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-amber-700 hover:bg-amber-50 flex items-center space-x-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  <span>Reset Demo Data</span>
                </button>
              </div>
            </div>

            {/* Logout */}
            <button
              onClick={onLogout}
              title="Logout"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
