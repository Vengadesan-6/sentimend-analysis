import React from 'react';
import { Heart, Flame, CloudRain, AlertTriangle, Zap, ThumbsDown, Minus } from 'lucide-react';

const emotionMap = {
  joy: { icon: Heart, color: 'bg-pink-500/15 text-pink-400 border-pink-500/30', label: 'Joy' },
  anger: { icon: Flame, color: 'bg-red-500/15 text-red-400 border-red-500/30', label: 'Anger' },
  sadness: { icon: CloudRain, color: 'bg-blue-500/15 text-blue-400 border-blue-500/30', label: 'Sadness' },
  fear: { icon: AlertTriangle, color: 'bg-purple-500/15 text-purple-400 border-purple-500/30', label: 'Fear' },
  surprise: { icon: Zap, color: 'bg-amber-500/15 text-amber-400 border-amber-500/30', label: 'Surprise' },
  disgust: { icon: ThumbsDown, color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', label: 'Disgust' },
  neutral: { icon: Minus, color: 'bg-slate-700/30 text-slate-300 border-slate-600/40', label: 'Neutral' },
};

export default function EmotionBadge({ emotion, confidence, size = 'md' }) {
  const norm = String(emotion || 'neutral').toLowerCase();
  const config = emotionMap[norm] || emotionMap.neutral;
  const Icon = config.icon;

  const sizeClasses = size === 'sm' 
    ? 'px-2 py-0.5 text-xs gap-1' 
    : size === 'lg' 
    ? 'px-3.5 py-1.5 text-sm gap-2 font-semibold' 
    : 'px-2.5 py-1 text-xs gap-1.5 font-medium';

  return (
    <span className={`inline-flex items-center rounded-full border ${config.color} ${sizeClasses} backdrop-blur-sm`}>
      <Icon className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      <span>{config.label}</span>
      {confidence !== undefined && (
        <span className="opacity-75 text-[10px] font-mono">
          {Math.round(confidence * 100)}%
        </span>
      )}
    </span>
  );
}
