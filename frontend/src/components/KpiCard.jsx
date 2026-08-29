import React from 'react';

export default function KpiCard({ title, value, subtitle, icon: Icon, color = 'indigo', trend }) {
  const colorSchemes = {
    indigo: {
      border: 'border-indigo-500/20 hover:border-indigo-500/40',
      iconBg: 'bg-indigo-500/10 text-indigo-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(99,102,241,0.15)]',
      gradient: 'from-indigo-500/10 to-transparent'
    },
    emerald: {
      border: 'border-emerald-500/20 hover:border-emerald-500/40',
      iconBg: 'bg-emerald-500/10 text-emerald-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      gradient: 'from-emerald-500/10 to-transparent'
    },
    rose: {
      border: 'border-rose-500/20 hover:border-rose-500/40',
      iconBg: 'bg-rose-500/10 text-rose-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(244,63,94,0.15)]',
      gradient: 'from-rose-500/10 to-transparent'
    },
    amber: {
      border: 'border-amber-500/20 hover:border-amber-500/40',
      iconBg: 'bg-amber-500/10 text-amber-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      gradient: 'from-amber-500/10 to-transparent'
    },
    cyan: {
      border: 'border-cyan-500/20 hover:border-cyan-500/40',
      iconBg: 'bg-cyan-500/10 text-cyan-400',
      glow: 'group-hover:shadow-[0_0_25px_rgba(6,182,212,0.15)]',
      gradient: 'from-cyan-500/10 to-transparent'
    }
  };

  const scheme = colorSchemes[color] || colorSchemes.indigo;

  return (
    <div className={`group relative p-5 rounded-2xl bg-slate-900/60 border ${scheme.border} backdrop-blur-xl ${scheme.glow} transition-all duration-300 overflow-hidden`}>
      <div className={`absolute -right-6 -bottom-6 w-28 h-28 bg-gradient-to-br ${scheme.gradient} rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-500`} />
      
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</p>
          <div className="mt-2 flex items-baseline gap-2">
            <h3 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight">{value}</h3>
            {trend && (
              <span className="text-xs font-medium text-emerald-400 flex items-center">
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
        </div>

        {Icon && (
          <div className={`p-3 rounded-xl ${scheme.iconBg} transition-transform group-hover:scale-110 duration-200`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  );
}
