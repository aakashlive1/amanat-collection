import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCog,
  HandCoins,
  Settings,
  Wallet,
  CheckCircle2,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react';
import { UserRole } from '../types';

interface BottomNavProps {
  role: UserRole;
  canVerifyPayments?: boolean;
  activeTab: string;
  onTabChange: (tab: string) => void;
  pendingSettlementsCount?: number;
  pendingVerificationsCount?: number;
}

interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  role,
  canVerifyPayments = false,
  activeTab,
  onTabChange,
  pendingSettlementsCount = 0,
  pendingVerificationsCount = 0,
}) => {
  const adminTabs: TabItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'collectors', label: 'Collectors', icon: UserCog },
    {
      id: 'verifications',
      label: 'Verify UPI',
      icon: ShieldCheck,
      badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
    },
    { id: 'reports', label: 'Reports', icon: FileSpreadsheet },
    {
      id: 'settlements',
      label: 'Settlements',
      icon: HandCoins,
      badge: pendingSettlementsCount > 0 ? pendingSettlementsCount : undefined,
    },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const collectorTabs: TabItem[] = [
    { id: 'collect', label: 'Collections', icon: Wallet },
    ...(canVerifyPayments
      ? [
          {
            id: 'verifications',
            label: 'Verify UPI',
            icon: ShieldCheck,
            badge: pendingVerificationsCount > 0 ? pendingVerificationsCount : undefined,
          },
        ]
      : []),
    { id: 'summary', label: 'Handover', icon: CheckCircle2 },
  ];

  const tabs = role === 'admin' ? adminTabs : collectorTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1 px-1 shadow-lg">
      <div className="max-w-lg mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center py-1 px-2 rounded-xl transition ${
                isActive
                  ? 'text-emerald-600 font-bold'
                  : 'text-slate-500 hover:text-slate-800 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-2.5 bg-rose-500 text-white text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
