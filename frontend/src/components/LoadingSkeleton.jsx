import React from 'react';

export default function LoadingSkeleton({ className = "h-6 w-full", count = 1 }) {
  return (
    <div className="space-y-2.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse bg-slate-800/60 rounded-xl border border-slate-700/30 ${className}`}
        />
      ))}
    </div>
  );
}
