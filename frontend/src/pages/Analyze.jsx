import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Cpu,
  Layers,
  Zap,
  Code,
  Copy,
  Check,
  AlertCircle,
  Clock,
  RotateCcw
} from 'lucide-react';
import { predictSingleText } from '../services/api';
import { analyzeText } from '../services/sentimentService';
import SentimentBadge from '../components/SentimentBadge';
import EmotionBadge from '../components/EmotionBadge';
import ExplainabilityTokens from '../components/ExplainabilityTokens';
import AspectBadges from '../components/AspectBadges';

const samplePresets = [
  {
    title: 'Delighted Product Review',
    text: "The noise cancellation on these headphones is miraculous, and the battery lasts over 30 hours! Absolute perfection.",
  },
  {
    title: 'Critical Support Complaint',
    text: "Terrible customer support. I waited on hold for 50 minutes only to be disconnected without any resolution.",
  },
  {
    title: 'Mixed Multi-Aspect Review',
    text: "The camera captures breathtaking high-res photos, but the battery drains far too quickly and the app crashes often.",
  },
  {
    title: 'Neutral Specification',
    text: "The device features 16GB of unified memory, dual USB-C ports, and ships in Space Gray.",
  }
];

const availableModels = [
  { id: 'cardiffnlp/twitter-roberta-base-sentiment-latest', name: 'RoBERTa (Twitter Sentiment)', desc: 'Optimized for modern slang, sentiment & emoticons' },
  { id: 'distilbert-base-uncased-finetuned-sst-2-english', name: 'DistilBERT (SST-2)', desc: 'Lightweight, ultra-low latency binary/ternary' },
  { id: 'nlptown/bert-base-multilingual-uncased-sentiment', name: 'BERT Multilingual', desc: 'Deep contextual representation across domains' },
];

export default function Analyze() {
  const [text, setText] = useState(samplePresets[0].text);
  const [selectedModel, setSelectedModel] = useState(availableModels[0].id);
  const [includeXai, setIncludeXai] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('insights'); // 'insights' | 'json'

  const syncToLocalHistory = (data) => {
    try {
      const cached = JSON.parse(localStorage.getItem('sentix_predictions_history') || '[]');
      const newItem = {
        id: data.id || 'pred_' + Date.now(),
        text: data.text,
        sentiment: data.sentiment ? data.sentiment.charAt(0).toUpperCase() + data.sentiment.slice(1).toLowerCase() : 'Neutral',
        confidence: data.confidence || 0.9,
        probabilities: data.probabilities || {},
        emotion: data.emotion || 'Neutral',
        aspects: data.aspects || [],
        explanation: data.explanation || null,
        model_name: data.model_name || selectedModel,
        processing_time_ms: data.processing_time_ms || 25.0,
        created_at: data.created_at || new Date().toISOString()
      };
      localStorage.setItem('sentix_predictions_history', JSON.stringify([newItem, ...cached.filter(c => c.id !== newItem.id)].slice(0, 50)));
    } catch (e) {}
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await predictSingleText({
        text: text.trim(),
        model_name: selectedModel,
        include_xai: includeXai
      });

      if (response && response.success && response.data) {
        setResult(response.data);
        syncToLocalHistory(response.data);
      } else {
        throw new Error(response?.message || 'Inference returned empty response');
      }
    } catch (err) {
      console.warn('Backend predict API unreachable or degraded, using local transformer engine:', err.message);
      try {
        const localRes = await analyzeText(text.trim(), selectedModel, includeXai);
        const formatted = {
          id: 'local_' + Date.now(),
          text: text.trim(),
          sentiment: localRes.sentiment ? localRes.sentiment.charAt(0).toUpperCase() + localRes.sentiment.slice(1) : 'Neutral',
          confidence: localRes.confidence,
          probabilities: {
            Positive: localRes.probabilities?.positive || 0,
            Neutral: localRes.probabilities?.neutral || 0,
            Negative: localRes.probabilities?.negative || 0,
          },
          emotion: localRes.emotion,
          emotion_probabilities: localRes.emotion_probabilities,
          aspects: localRes.aspects,
          explanation: localRes.explanation,
          model_name: localRes.model_full_name || selectedModel,
          processing_time_ms: localRes.processing_time_ms,
          created_at: new Date().toISOString()
        };
        setResult(formatted);
        syncToLocalHistory(formatted);
      } catch (localErr) {
        console.error('Inference error:', localErr);
        setError(localErr.message || 'Server inference failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-400" />
            Single Text Intelligence Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Analyze nuanced sentiment, multi-class emotions, aspect targets, and token importance saliency.
          </p>
        </div>
      </div>

      {/* Preset Quick-Buttons */}
      <div className="space-y-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Try Benchmark Presets:
        </span>
        <div className="flex flex-wrap gap-2">
          {samplePresets.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setText(p.text);
                setResult(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 text-xs font-medium text-slate-300 transition-all"
            >
              {p.title}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Input Form & Live Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Input Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-5">
            {/* Model Architecture Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                Select Transformer Architecture
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-xs font-medium text-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all"
              >
                {availableModels.map((m) => (
                  <option key={m.id} value={m.id} className="bg-slate-900">
                    {m.name}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500">
                {availableModels.find((m) => m.id === selectedModel)?.desc}
              </p>
            </div>

            {/* Text Input Area */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Input Passage / Review Text
                </label>
                <span className={`text-[11px] font-mono ${text.length > 4500 ? 'text-amber-400' : 'text-slate-500'}`}>
                  {text.length} / 5000
                </span>
              </div>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={6}
                maxLength={5000}
                placeholder="Type or paste any customer review, tweet, product feedback, or article snippet here..."
                className="w-full p-4 rounded-2xl bg-slate-950/80 border border-slate-700/80 text-sm text-slate-100 placeholder-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none resize-none transition-all"
              />
            </div>

            {/* XAI Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/50 border border-slate-800">
              <div className="space-y-0.5">
                <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Explainable AI (Saliency Map)
                </span>
                <p className="text-[11px] text-slate-400">Compute token gradient importance weights</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeXai}
                  onChange={(e) => setIncludeXai(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={loading || !text.trim()}
                className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Inferring Neural Representation...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Run Full Inference</span>
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Live Results Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <div className="p-6 rounded-3xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-xl space-y-6">
              {/* Header Navigation: Insights vs. JSON */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('insights')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      activeTab === 'insights'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Neural Insights
                  </button>
                  <button
                    onClick={() => setActiveTab('json')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      activeTab === 'json'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Code className="w-3.5 h-3.5" />
                    <span>Raw Response JSON</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{result.processing_time_ms}ms</span>
                </div>
              </div>

              {activeTab === 'insights' ? (
                <div className="space-y-6">
                  {/* Top Level Sentiment & Emotion Result Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Primary Sentiment */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Primary Sentiment
                      </span>
                      <div className="flex items-center justify-between">
                        <SentimentBadge
                          sentiment={result.sentiment}
                          confidence={result.confidence}
                          size="lg"
                        />
                      </div>
                    </div>

                    {/* Detected Emotion */}
                    <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between gap-3">
                      <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                        Dominant Affective Emotion
                      </span>
                      <div className="flex items-center justify-between">
                        <EmotionBadge emotion={result.emotion} size="lg" />
                      </div>
                    </div>
                  </div>

                  {/* 3-Class Softmax Probabilities Breakdown */}
                  <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                    <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                      Softmax Sentiment Probability Distribution
                    </span>
                    <div className="space-y-2">
                      {['Positive', 'Neutral', 'Negative'].map((cls) => {
                        const prob = result.probabilities?.[cls] || 0;
                        const pct = Math.round(prob * 100);
                        const barColor =
                          cls === 'Positive'
                            ? 'bg-emerald-500'
                            : cls === 'Negative'
                            ? 'bg-rose-500'
                            : 'bg-amber-500';

                        return (
                          <div key={cls} className="space-y-1">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-slate-300">{cls}</span>
                              <span className="text-slate-400">{pct}% ({prob.toFixed(4)})</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* ABSA Aspect Badges */}
                  <AspectBadges aspects={result.aspects} />

                  {/* Explainable AI Heatmap */}
                  {result.explanation && (
                    <ExplainabilityTokens explanation={result.explanation} />
                  )}
                </div>
              ) : (
                /* Raw JSON Viewer */
                <div className="relative">
                  <button
                    onClick={handleCopyJson}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors z-10"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                  <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-indigo-300 overflow-x-auto max-h-[500px]">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            /* Empty State */
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 border-dashed text-center flex flex-col items-center justify-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-200">Awaiting Input Text</h4>
              <p className="text-xs text-slate-400 max-w-sm">
                Enter text in the left panel or click any of the preset review prompts to test the multi-modal transformer pipeline.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
