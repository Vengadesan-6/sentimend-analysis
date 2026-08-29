import React from 'react';
import { Smile, Frown, Meh } from 'lucide-react';

export default function SentimentBadge({ sentiment, confidence, size = 'md' }) {
  const norm = String(sentiment || '').toLowerCase();

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700/60';
  let Icon = Meh;
  let glow = '';

  if (norm.includes('pos')) {
    colorClasses = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    Icon = Smile;
    glow = 'shadow-[0_0_12px_rgba(16,185,129,0.2)]';
  } else if (norm.includes('neg')) {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    Icon = Frown;
    glow = 'shadow-[0_0_12px_rgba(244,63,94,0.2)]';
  } else if (norm.includes('neu')) {
    colorClasses = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    Icon = Meh;
    glow = 'shadow-[0_0_12px_rgba(245,158,11,0.2)]';
  }

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : size === 'lg' 
    ? 'px-4 py-2 text-base gap-2 font-semibold' 
    : 'px-2.5 py-1 text-sm gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border ${colorClasses} ${sizeClasses} ${glow} transition-all duration-200`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />
      <span>{sentiment || 'Neutral'}</span>
      {confidence !== undefined && (
        <span className="opacity-75 text-[11px] font-mono ml-0.5">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
}
