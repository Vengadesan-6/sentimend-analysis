import React from 'react';
import { Layers, Quote } from 'lucide-react';
import SentimentBadge from './SentimentBadge';

export default function AspectBadges({ aspects }) {
  if (!aspects || aspects.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400">
        No discrete aspect targets detected.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-medium">
        <Layers className="w-3.5 h-3.5" />
        <span>Aspect-Based Sentiment Breakdown ({aspects.length})</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
        {aspects.map((item, idx) => (
          <div
            key={idx}
            className="p-3 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700/80 transition-all duration-200 flex flex-col justify-between gap-2"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-sm text-slate-100">{item.aspect}</span>
              <SentimentBadge sentiment={item.sentiment} confidence={item.confidence} size="sm" />
            </div>

            {item.supporting_span && (
              <div className="flex items-start gap-1.5 text-xs text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 italic">
                <Quote className="w-3 h-3 text-slate-500 shrink-0 mt-0.5" />
                <span className="line-clamp-2">"{item.supporting_span}"</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
