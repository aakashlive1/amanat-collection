import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'emerald' | 'blue' | 'purple' | 'amber' | 'slate' | 'rose';
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'emerald',
  onClick,
}) => {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50/70',
      border: 'border-emerald-200/60',
      iconBg: 'bg-emerald-600',
      text: 'text-emerald-950',
      sub: 'text-emerald-700',
    },
    blue: {
      bg: 'bg-blue-50/70',
      border: 'border-blue-200/60',
      iconBg: 'bg-blue-600',
      text: 'text-blue-950',
      sub: 'text-blue-700',
    },
    purple: {
      bg: 'bg-purple-50/70',
      border: 'border-purple-200/60',
      iconBg: 'bg-purple-600',
      text: 'text-purple-950',
      sub: 'text-purple-700',
    },
    amber: {
      bg: 'bg-amber-50/70',
      border: 'border-amber-200/60',
      iconBg: 'bg-amber-600',
      text: 'text-amber-950',
      sub: 'text-amber-700',
    },
    slate: {
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      iconBg: 'bg-slate-700',
      text: 'text-slate-900',
      sub: 'text-slate-500',
    },
    rose: {
      bg: 'bg-rose-50/70',
      border: 'border-rose-200/60',
      iconBg: 'bg-rose-600',
      text: 'text-rose-950',
      sub: 'text-rose-700',
    },
  };

  const scheme = colorMap[variant];

  return (
    <div
      onClick={onClick}
      className={`relative p-3.5 rounded-2xl border ${scheme.bg} ${scheme.border} transition ${
        onClick ? 'cursor-pointer hover:shadow-md active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className={`text-xl font-extrabold mt-1 tracking-tight ${scheme.text}`}>{value}</p>
          {subtitle && <p className={`text-[11px] font-medium mt-0.5 ${scheme.sub}`}>{subtitle}</p>}
        </div>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg} text-white shadow-xs`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>
    </div>
  );
};
