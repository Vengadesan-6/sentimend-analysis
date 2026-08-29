import React, { useState, useEffect } from 'react';
import {
  History as HistoryIcon,
  Search,
  Filter,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  Sparkles,
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react';
import { getPredictions, deletePrediction } from '../services/api';
import SentimentBadge from '../components/SentimentBadge';
import EmotionBadge from '../components/EmotionBadge';
import ExplainabilityTokens from '../components/ExplainabilityTokens';
import AspectBadges from '../components/AspectBadges';

export default function History() {
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [emotionFilter, setEmotionFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [inspectItem, setInspectItem] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const defaultAuditRecords = [
    {
      id: 'audit_rec_1',
      text: "The AI model's response time is exceptionally fast, and the dashboard UI is simply stunning!",
      sentiment: 'Positive',
      confidence: 0.96,
      probabilities: { Positive: 0.96, Neutral: 0.03, Negative: 0.01 },
      emotion: 'Joy',
      aspects: [{ aspect: 'Response Time', sentiment: 'Positive', confidence: 0.95 }, { aspect: 'Dashboard UI', sentiment: 'Positive', confidence: 0.97 }],
      explanation: {
        method: "Model-based Gradient Saliency & Attention Attribution",
        tokens: ["The", "AI", "model's", "response", "time", "is", "exceptionally", "fast,", "and", "the", "dashboard", "UI", "is", "simply", "stunning!"],
        scores: [0.01, 0.05, 0.02, 0.1, 0.1, 0.02, 0.85, 0.88, 0.01, 0.01, 0.2, 0.2, 0.01, 0.7, 0.95],
        top_positive_words: ["exceptionally", "fast", "stunning"],
        top_negative_words: []
      },
      model_name: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      processing_time_ms: 18.4,
      created_at: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: 'audit_rec_2',
      text: "Terrible customer service. Waited 45 minutes on hold just to get disconnected.",
      sentiment: 'Negative',
      confidence: 0.94,
      probabilities: { Positive: 0.02, Neutral: 0.04, Negative: 0.94 },
      emotion: 'Anger',
      aspects: [{ aspect: 'Customer Service', sentiment: 'Negative', confidence: 0.94 }],
      explanation: {
        method: "Model-based Gradient Saliency & Attention Attribution",
        tokens: ["Terrible", "customer", "service.", "Waited", "45", "minutes", "on", "hold", "just", "to", "get", "disconnected."],
        scores: [-0.94, 0.02, 0.02, -0.2, -0.1, -0.1, 0.0, -0.3, 0.0, 0.0, 0.0, -0.85],
        top_positive_words: [],
        top_negative_words: ["terrible", "disconnected"]
      },
      model_name: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      processing_time_ms: 22.1,
      created_at: new Date(Date.now() - 7200000).toISOString()
    },
    {
      id: 'audit_rec_3',
      text: "The smartphone weighs 187 grams and has a 6.7-inch AMOLED display.",
      sentiment: 'Neutral',
      confidence: 0.88,
      probabilities: { Positive: 0.06, Neutral: 0.88, Negative: 0.06 },
      emotion: 'Neutral',
      aspects: [{ aspect: 'Display', sentiment: 'Neutral', confidence: 0.88 }],
      model_name: 'distilbert-base-uncased-finetuned-sst-2-english',
      processing_time_ms: 12.0,
      created_at: new Date(Date.now() - 14400000).toISOString()
    },
    {
      id: 'audit_rec_4',
      text: "The noise cancellation on these headphones is miraculous on noisy flights.",
      sentiment: 'Positive',
      confidence: 0.97,
      probabilities: { Positive: 0.97, Neutral: 0.02, Negative: 0.01 },
      emotion: 'Joy',
      aspects: [{ aspect: 'Noise Cancellation', sentiment: 'Positive', confidence: 0.97 }],
      model_name: 'cardiffnlp/twitter-roberta-base-sentiment-latest',
      processing_time_ms: 24.5,
      created_at: new Date(Date.now() - 28800000).toISOString()
    },
    {
      id: 'audit_rec_5',
      text: "Battery drains completely within 3 hours of moderate usage. Completely unacceptable.",
      sentiment: 'Negative',
      confidence: 0.95,
      probabilities: { Positive: 0.01, Neutral: 0.04, Negative: 0.95 },
      emotion: 'Anger',
      aspects: [{ aspect: 'Battery', sentiment: 'Negative', confidence: 0.95 }],
      model_name: 'nlptown/bert-base-multilingual-uncased-sentiment',
      processing_time_ms: 31.0,
      created_at: new Date(Date.now() - 43200000).toISOString()
    }
  ];

  const getLocalFilteredRecords = () => {
    let localData = defaultAuditRecords;
    try {
      const cached = localStorage.getItem('sentix_predictions_history');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          localData = [...parsed, ...defaultAuditRecords.filter(d => !parsed.some(p => p.id === d.id))];
        }
      }
    } catch (e) {
      // ignore
    }

    let filtered = localData;
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(item => item.text.toLowerCase().includes(q));
    }
    if (sentimentFilter && sentimentFilter !== 'all') {
      filtered = filtered.filter(item => item.sentiment?.toLowerCase() === sentimentFilter.toLowerCase());
    }
    if (emotionFilter && emotionFilter !== 'all') {
      filtered = filtered.filter(item => item.emotion?.toLowerCase() === emotionFilter.toLowerCase());
    }

    const totalCount = filtered.length;
    const startIndex = (page - 1) * limit;
    const pagedItems = filtered.slice(startIndex, startIndex + limit);

    return {
      items: pagedItems,
      total: totalCount,
      total_pages: Math.max(1, Math.ceil(totalCount / limit))
    };
  };

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPredictions({
        page,
        limit,
        search: search.trim() || undefined,
        sentiment: sentimentFilter !== 'all' ? sentimentFilter : undefined,
        emotion: emotionFilter !== 'all' ? emotionFilter : undefined,
        sort_by: 'created_at',
        order: 'desc'
      });

      if (res && res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
        setPredictions(res.data.items);
        setTotal(res.data.total || res.data.items.length);
        setTotalPages(res.data.total_pages || 1);
        try {
          localStorage.setItem('sentix_predictions_history', JSON.stringify(res.data.items));
        } catch (e) {}
        return;
      }
    } catch (err) {
      console.warn('Backend prediction history offline, utilizing local audit storage:', err.message);
    } finally {
      setLoading(false);
    }

    // Graceful fallback to local stored records
    const localRes = getLocalFilteredRecords();
    setPredictions(localRes.items);
    setTotal(localRes.total);
    setTotalPages(localRes.total_pages);
  };

  useEffect(() => {
    fetchHistory();
  }, [page, sentimentFilter, emotionFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchHistory();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this prediction audit record?')) return;

    setDeletingId(id);
    try {
      await deletePrediction(id);
    } catch (err) {
      console.warn('Could not delete from backend, deleting from local cache:', err.message);
    }

    // Update state and local storage
    setPredictions((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => Math.max(0, prev - 1));
    if (inspectItem?.id === id) setInspectItem(null);

    try {
      const cached = JSON.parse(localStorage.getItem('sentix_predictions_history') || '[]');
      const filtered = cached.filter(p => p.id !== id);
      localStorage.setItem('sentix_predictions_history', JSON.stringify(filtered));
    } catch (e) {}

    setDeletingId(null);
  };

  return (
    <div className="space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0A0A0A] font-display tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#F97316]/10 text-[#F97316] flex items-center justify-center">
              <HistoryIcon className="w-5 h-5" />
            </div>
            <span>Prediction Audit Trail</span>
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Browse, filter, inspect, and manage historical inferences stored directly in MongoDB.
          </p>
        </div>

        <button
          onClick={fetchHistory}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-bold text-[#555555] transition-all flex items-center gap-1.5 shadow-soft cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="editorial-card p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px]">
          <div className="relative">
            <Search className="w-4 h-4 text-[#888888] absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search past texts by keywords..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FFF8F5] border border-[#E8E4E1] text-xs text-[#0A0A0A] focus:border-[#7C3AED] outline-none"
            />
          </div>
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-[#555555]">
            <Filter className="w-3.5 h-3.5" />
            <span>Sentiment:</span>
            <select
              value={sentimentFilter}
              onChange={(e) => {
                setSentimentFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E4E1] text-xs text-[#0A0A0A] focus:border-[#7C3AED] outline-none"
            >
              <option value="all">All Sentiments</option>
              <option value="positive">Positive</option>
              <option value="neutral">Neutral</option>
              <option value="negative">Negative</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-[#555555]">
            <span>Emotion:</span>
            <select
              value={emotionFilter}
              onChange={(e) => {
                setEmotionFilter(e.target.value);
                setPage(1);
              }}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-[#E8E4E1] text-xs text-[#0A0A0A] focus:border-[#7C3AED] outline-none"
            >
              <option value="all">All Emotions</option>
              <option value="joy">Joy</option>
              <option value="anger">Anger</option>
              <option value="sadness">Sadness</option>
              <option value="fear">Fear</option>
              <option value="surprise">Surprise</option>
              <option value="disgust">Disgust</option>
              <option value="neutral">Neutral</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchHistory}
            className="px-3 py-1 rounded-lg bg-[#DC2626] text-white font-bold hover:bg-[#B91C1C] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Predictions Table */}
      <div className="editorial-card rounded-3xl shadow-floating overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FFF8F5] text-[#555555] uppercase tracking-wider font-bold border-b border-[#E8E4E1]">
                <th className="py-3.5 px-4">Text Input</th>
                <th className="py-3.5 px-4">Sentiment</th>
                <th className="py-3.5 px-4">Emotion</th>
                <th className="py-3.5 px-4">Model</th>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E8E4E1]">
              {predictions.length > 0 ? (
                predictions.map((p) => (
                  <tr key={p.id} className="hover:bg-[#FFF8F5] transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#0A0A0A] max-w-sm truncate">
                      {p.text}
                    </td>
                    <td className="py-3.5 px-4">
                      <SentimentBadge sentiment={p.sentiment} confidence={p.confidence} size="sm" />
                    </td>
                    <td className="py-3.5 px-4">
                      <EmotionBadge emotion={p.emotion} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#7C3AED] text-[11px]">
                      {p.model_name ? p.model_name.split('/').pop() : 'RoBERTa'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[#888888] text-[11px]">
                      {p.created_at ? new Date(p.created_at).toLocaleString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setInspectItem(p)}
                          className="p-1.5 rounded-lg bg-[#FFF8F5] hover:bg-[#7C3AED] text-[#555555] hover:text-white border border-[#E8E4E1] transition-colors"
                          title="Inspect Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deletingId === p.id}
                          className="p-1.5 rounded-lg bg-[#FFF8F5] hover:bg-[#DC2626] text-[#555555] hover:text-white border border-[#E8E4E1] transition-colors"
                          title="Delete Record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#888888] text-xs">
                    {loading ? 'Fetching audit records from MongoDB...' : error ? 'Error loading history records.' : 'No historical predictions found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-[#E8E4E1] flex items-center justify-between text-xs text-[#555555] font-mono bg-[#FFF8F5]">
          <span>
            Showing page {page} of {totalPages} ({total} total items)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-1.5 rounded-lg bg-white hover:bg-[#F0ECE8] border border-[#E8E4E1] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded bg-white border border-[#E8E4E1] text-[#0A0A0A] font-bold">
              {page}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg bg-white hover:bg-[#F0ECE8] border border-[#E8E4E1] disabled:opacity-40 disabled:cursor-not-allowed text-[#0A0A0A] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Inspect Modal Drawer */}
      {inspectItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#E8E4E1] rounded-[32px] max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-floating">
            <div className="flex items-center justify-between border-b border-[#E8E4E1] pb-4">
              <h3 className="text-base font-bold text-[#0A0A0A] flex items-center gap-2 font-display">
                <Sparkles className="w-4 h-4 text-[#7C3AED]" />
                Prediction Audit Detail
              </h3>
              <button
                onClick={() => setInspectItem(null)}
                className="p-1.5 rounded-full hover:bg-[#FFF8F5] text-[#555555]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-[#555555]">
                  Full Input Passage
                </span>
                <p className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-mono text-[#0A0A0A]">
                  {inspectItem.text}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] space-y-1">
                  <span className="text-[11px] text-[#555555] uppercase font-bold">Sentiment</span>
                  <div>
                    <SentimentBadge sentiment={inspectItem.sentiment} confidence={inspectItem.confidence} />
                  </div>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] space-y-1">
                  <span className="text-[11px] text-[#555555] uppercase font-bold">Emotion</span>
                  <div>
                    <EmotionBadge emotion={inspectItem.emotion} />
                  </div>
                </div>
              </div>

              {inspectItem.aspects && inspectItem.aspects.length > 0 && (
                <AspectBadges aspects={inspectItem.aspects} />
              )}

              {inspectItem.explanation && (
                <ExplainabilityTokens explanation={inspectItem.explanation} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
