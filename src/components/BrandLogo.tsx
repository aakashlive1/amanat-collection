import React from 'react';
import { Handshake } from 'lucide-react';

interface BrandLogoProps {
  className?: string;
  variant?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  variant = 'dark',
  size = 'md',
}) => {
  const isLight = variant === 'light';

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const titleSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl',
  };

  const subSizes = {
    sm: 'text-[8px]',
    md: 'text-[9px]',
    lg: 'text-[11px]',
  };

  return (
    <div className={`flex items-center space-x-3 select-none ${className}`}>
      {/* Handshake Badge */}
      <div
        className={`${iconSizes[size]} rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 p-0.5 shadow-md shadow-emerald-600/20 flex items-center justify-center shrink-0`}
      >
        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center">
          <Handshake className={`${size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7'} text-emerald-700`} />
        </div>
      </div>

      {/* Brand Text */}
      <div className="leading-tight">
        <div className={`font-black tracking-tight ${titleSizes[size]} ${isLight ? 'text-white' : 'text-slate-900'} flex items-center gap-1.5`}>
          <span>AMANAT</span>
          <span className="text-emerald-700">COLLECTION</span>
        </div>
        <div
          className={`font-extrabold uppercase tracking-widest ${subSizes[size]} ${
            isLight ? 'text-emerald-300' : 'text-slate-500'
          }`}
        >
          Daily Collection • Safe Handling • Timely Settlement
        </div>
      </div>
    </div>
  );
};
