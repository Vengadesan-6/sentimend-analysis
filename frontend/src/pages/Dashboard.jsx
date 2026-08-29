import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Activity,
  ArrowRight,
  RefreshCw,
  Clock,
  Layers,
  HeartHandshake
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';

import {
  getAnalyticsOverview,
  getSentimentAnalytics,
  getEmotionAnalytics,
  getAspectAnalytics,
  getPredictions
} from '../services/api';
import KpiCard from '../components/KpiCard';
import SentimentBadge from '../components/SentimentBadge';
import EmotionBadge from '../components/EmotionBadge';
import LoadingSkeleton from '../components/LoadingSkeleton';

const SENTIMENT_COLORS = {
  Positive: '#10B981',
  Neutral: '#64748B',
  Negative: '#F43F5E'
};

const EMOTION_COLORS = ['#EC4899', '#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#10B981', '#64748B'];

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [sentimentData, setSentimentData] = useState(null);
  const [emotionData, setEmotionData] = useState([]);
  const [aspectData, setAspectData] = useState([]);
  const [recentPredictions, setRecentPredictions] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ovRes, sentRes, emoRes, aspRes, predRes] = await Promise.all([
        getAnalyticsOverview(),
        getSentimentAnalytics(),
        getEmotionAnalytics(),
        getAspectAnalytics(),
        getPredictions({ page: 1, limit: 6 })
      ]);

      if (ovRes.data) setOverview(ovRes.data);
      if (sentRes.data) setSentimentData(sentRes.data);
      if (emoRes.data?.emotions) setEmotionData(emoRes.data.emotions);
      if (aspRes.data?.aspects) setAspectData(aspRes.data.aspects);
      if (predRes.data?.items) setRecentPredictions(predRes.data.items);
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format sentiment pie data
  const pieData = sentimentData?.distribution
    ? Object.entries(sentimentData.distribution).map(([name, value]) => ({
        name,
        value
      }))
    : [];

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner / Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-indigo-950/50 via-slate-900/60 to-cyan-950/40 border border-indigo-500/20 backdrop-blur-xl relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
            <Sparkles className="w-4 h-4" />
            <span>MCA Capstone Sentiment Intelligence System</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Real-Time Affective & Semantic Telemetry
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Live neural inference across RoBERTa, DistilBERT, and BERT architectures with aspect-based extraction and Explainable AI.
          </p>
        </div>

        <div className="flex items-center gap-3 z-10">
          <button
            onClick={fetchData}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 transition-all flex items-center gap-1.5 text-xs font-semibold"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <Link
            to="/analyze"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-lg shadow-indigo-500/25 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Analyze Custom Text</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <LoadingSkeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KpiCard
            title="Total Analyses"
            value={overview?.total_analyses ?? 0}
            subtitle="Processed records"
            icon={Activity}
            color="indigo"
          />
          <KpiCard
            title="Positive Sentiment"
            value={overview?.positive_count ?? 0}
            subtitle={`${overview?.positive_percentage ?? 0}% of volume`}
            icon={Smile}
            color="emerald"
          />
          <KpiCard
            title="Neutral Sentiment"
            value={overview?.neutral_count ?? 0}
            subtitle={`${overview?.neutral_percentage ?? 0}% of volume`}
            icon={Meh}
            color="amber"
          />
          <KpiCard
            title="Negative Sentiment"
            value={overview?.negative_count ?? 0}
            subtitle={`${overview?.negative_percentage ?? 0}% of volume`}
            icon={Frown}
            color="rose"
          />
          <KpiCard
            title="Avg Confidence"
            value={`${Math.round((overview?.avg_confidence ?? 0) * 100)}%`}
            subtitle="Softmax probability"
            icon={TrendingUp}
            color="cyan"
          />
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sentiment Distribution Pie */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Smile className="w-4 h-4 text-indigo-400" />
              Sentiment Distribution
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Aggregated</span>
          </div>

          <div className="h-64 w-full flex items-center justify-center">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={SENTIMENT_COLORS[entry.name] || '#6366F1'}
                        stroke="#090D16"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-500">No predictions recorded yet</div>
            )}
          </div>
        </div>

        {/* 7-Day Sentiment Timeline */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Sentiment Timeline Trend
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Daily Inferences</span>
          </div>

          <div className="h-64 w-full">
            {sentimentData?.trend && sentimentData.trend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentimentData.trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="posGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="negGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F43F5E" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#F43F5E" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="positive" stroke="#10B981" fillOpacity={1} fill="url(#posGrad)" />
                  <Area type="monotone" dataKey="negative" stroke="#F43F5E" fillOpacity={1} fill="url(#negGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Timeline data will appear after running predictions
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Charts: Emotions & Aspects */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Distribution */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-pink-400" />
              Emotion Distribution (7-Class)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Affective State</span>
          </div>

          <div className="h-60 w-full">
            {emotionData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={emotionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="emotion" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                No emotion analytics recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Top Extracted Aspects */}
        <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Top Extracted Aspects (ABSA)
            </h3>
            <span className="text-[11px] font-mono text-slate-400">Entity Sentiment</span>
          </div>

          <div className="h-60 w-full">
            {aspectData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aspectData.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="aspect" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="positive" fill="#10B981" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutral" fill="#64748B" stackId="a" />
                  <Bar dataKey="negative" fill="#F43F5E" stackId="a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500">
                Aspects will appear as sentences are analyzed
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Predictions Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Recent Predictions Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live inference streaming directly from MongoDB</p>
          </div>
          <Link
            to="/history"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <span>View Full Audit History</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                <th className="py-3 px-4">Text Sample</th>
                <th className="py-3 px-4">Sentiment</th>
                <th className="py-3 px-4">Emotion</th>
                <th className="py-3 px-4">Model</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {recentPredictions.length > 0 ? (
                recentPredictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-200 max-w-xs truncate">
                      {pred.text}
                    </td>
                    <td className="py-3.5 px-4">
                      <SentimentBadge sentiment={pred.sentiment} confidence={pred.confidence} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <EmotionBadge emotion={pred.emotion} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {pred.model_name.split('/').pop()}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                      {pred.processing_time_ms}ms
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to="/history"
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-300 text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    No predictions yet. Head over to Single Text Analysis or Bulk Upload to generate results!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
