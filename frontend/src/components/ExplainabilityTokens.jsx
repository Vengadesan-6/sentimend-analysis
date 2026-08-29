import React from 'react';
import { Sparkles, Info, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function ExplainabilityTokens({ explanation }) {
  if (!explanation || !explanation.tokens || explanation.tokens.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-500" />
        No token-level attribution data available for this input.
      </div>
    );
  }

  const { tokens, scores, top_positive_words, top_negative_words, method } = explanation;

  const getTokenStyle = (score) => {
    if (score > 0.05) {
      const alpha = Math.min(Math.max(score * 0.7, 0.15), 0.85);
      return {
        backgroundColor: `rgba(16, 185, 129, ${alpha})`,
        color: score > 0.4 ? '#FFFFFF' : '#6EE7B7',
        border: '1px solid rgba(16, 185, 129, 0.3)'
      };
    } else if (score < -0.05) {
      const alpha = Math.min(Math.max(Math.abs(score) * 0.7, 0.15), 0.85);
      return {
        backgroundColor: `rgba(244, 63, 94, ${alpha})`,
        color: Math.abs(score) > 0.4 ? '#FFFFFF' : '#FDA4AF',
        border: '1px solid rgba(244, 63, 94, 0.3)'
      };
    }
    return {
      backgroundColor: 'rgba(30, 41, 59, 0.5)',
      color: '#94A3B8',
      border: '1px solid rgba(255, 255, 255, 0.05)'
    };
  };

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-indigo-400 font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Explainable AI (XAI) Attribution Heatmap</span>
        </div>
        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-mono">
          {method || 'Model-based Gradient Saliency'}
        </span>
      </div>

      {/* Heatmap Token Container */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 backdrop-blur-md flex flex-wrap gap-1.5 leading-relaxed font-mono text-sm">
        {tokens.map((tok, idx) => {
          const score = scores[idx] !== undefined ? scores[idx] : 0;
          return (
            <span
              key={idx}
              style={getTokenStyle(score)}
              title={`Token: "${tok}" | Saliency Score: ${score > 0 ? '+' : ''}${score}`}
              className="px-2 py-0.5 rounded transition-all duration-150 cursor-pointer hover:scale-110 hover:z-10 shadow-sm"
            >
              {tok}
            </span>
          );
        })}
      </div>

      {/* Legend & Key Influencing Words */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Positive Contributors */}
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-emerald-400 font-semibold">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Positive Influencing Tokens</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {top_positive_words && top_positive_words.length > 0 ? (
              top_positive_words.map((word, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                  +{word}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None detected above threshold</span>
            )}
          </div>
        </div>

        {/* Negative Contributors */}
        <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-500/20 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 text-rose-400 font-semibold">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Negative Influencing Tokens</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {top_negative_words && top_negative_words.length > 0 ? (
              top_negative_words.map((word, i) => (
                <span key={i} className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[11px]">
                  -{word}
                </span>
              ))
            ) : (
              <span className="text-slate-500 italic">None detected above threshold</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
