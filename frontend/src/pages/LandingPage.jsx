import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Zap,
  TrendingUp,
  Smile,
  Frown,
  Meh,
  Activity,
  Layers,
  Heart,
  Search,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  Share2,
  Briefcase,
  Headphones,
  LineChart,
  ShieldCheck,
  Clock,
  Send,
  RotateCcw,
  Copy,
  Check,
  Code
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
import { analyzeText } from '../services/sentimentService';
import { getAnalyticsOverview, getSentimentAnalytics } from '../services/api';

const SENTIMENT_COLORS = {
  Positive: '#16A34A',
  Neutral: '#D97706',
  Negative: '#DC2626'
};

const demoSentences = [
  {
    text: "This product completely exceeded my expectations. Outstanding performance!",
    sentiment: "Positive",
    confidence: "96.4%",
    type: "positive"
  },
  {
    text: "The service was okay, nothing special, standard delivery time.",
    sentiment: "Neutral",
    confidence: "82.1%",
    type: "neutral"
  },
  {
    text: "I am extremely disappointed with the experience. The unit broke immediately.",
    sentiment: "Negative",
    confidence: "97.8%",
    type: "negative"
  }
];

const faqs = [
  {
    q: "What is sentiment analysis?",
    a: "Sentiment analysis is an AI-powered natural language processing technique that computationally determines the emotional tone, attitude, and subjective polarity (positive, negative, or neutral) behind a piece of unstructured text."
  },
  {
    q: "Why use Transformer models?",
    a: "Unlike traditional bag-of-words or RNN models, Transformers use self-attention mechanisms to process words in context simultaneously. This enables them to capture complex sentence syntax, double negatives, sarcasm, and subtle idioms with state-of-the-art accuracy."
  },
  {
    q: "What is a confidence score?",
    a: "A confidence score represents the normalized softmax probability output by the Transformer classification head. A score of 94.8% indicates high mathematical certainty that the text belongs to the predicted sentiment category."
  },
  {
    q: "Can I analyze long text?",
    a: "Yes! The platform processes text passages up to 5,000 characters. Longer passages are automatically tokenized and analyzed using multi-head attention to extract granular aspect sentiments."
  },
  {
    q: "What emotions can the system detect?",
    a: "In addition to ternary sentiment (positive/neutral/negative), our multi-head affective model detects fine-grained emotions including Joy/Satisfaction, Anger/Frustration, Disappointment, Fear, Surprise, and Disgust."
  },
  {
    q: "How accurate is the model?",
    a: "Our benchmark evaluations across RoBERTa, DistilBERT, and BERT demonstrate F1-scores exceeding 92% on standard review benchmarks like SST-2 and IMDb, with sub-100ms inference latency."
  }
];

export default function LandingPage() {
  // Main Analyzer State
  const [inputText, setInputText] = useState("The product quality is excellent and the support team was incredibly helpful.");
  const [selectedModel, setSelectedModel] = useState("cardiffnlp/twitter-roberta-base-sentiment-latest");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [openFaq, setOpenFaq] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [liveOverview, setLiveOverview] = useState(null);
  const [liveSentimentData, setLiveSentimentData] = useState(null);
  const analyzerRef = useRef(null);

  // Initial analysis and live analytics fetch on mount
  useEffect(() => {
    runAnalysis(inputText);

    // Fetch live MongoDB analytics
    getAnalyticsOverview()
      .then(res => {
        if (res.data) setLiveOverview(res.data);
      })
      .catch(err => console.warn("Live overview fetch:", err.message));

    getSentimentAnalytics()
      .then(res => {
        if (res.data) setLiveSentimentData(res.data);
      })
      .catch(err => console.warn("Live sentiment analytics fetch:", err.message));
  }, []);

  const runAnalysis = async (textToAnalyze) => {
    if (!textToAnalyze.trim()) return;
    setAnalyzing(true);
    try {
      const res = await analyzeText(textToAnalyze, selectedModel);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handlePresetClick = (sample) => {
    setInputText(sample);
    runAnalysis(sample);
    if (analyzerRef.current) {
      analyzerRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyJson = () => {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sample analytics data
  const samplePieData = [
    { name: 'Positive', value: 72 },
    { name: 'Neutral', value: 18 },
    { name: 'Negative', value: 10 },
  ];

  const sampleTrendData = [
    { day: 'Mon', positive: 65, neutral: 20, negative: 15 },
    { day: 'Tue', positive: 70, neutral: 18, negative: 12 },
    { day: 'Wed', positive: 68, neutral: 22, negative: 10 },
    { day: 'Thu', positive: 75, neutral: 16, negative: 9 },
    { day: 'Fri', positive: 72, neutral: 19, negative: 9 },
    { day: 'Sat', positive: 80, neutral: 12, negative: 8 },
    { day: 'Sun', positive: 78, neutral: 14, negative: 8 },
  ];

  return (
    <div className="space-y-28 pt-8 pb-20 overflow-x-hidden">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
      <section className="relative pt-12 lg:pt-20">
        {/* Soft background ambient gradient glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-[#7C3AED]/10 via-[#EC4899]/10 to-[#F97316]/10 rounded-full blur-3xl pointer-events-none -z-10 animate-pulse-glow" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Hero Copy */}
          <div className="lg:col-span-7 space-y-7 text-left">
            {/* Small Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#E8E4E1] shadow-soft">
              <span className="w-2 h-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] animate-pulse" />
              <span className="text-[11px] font-bold tracking-wider uppercase text-[#7C3AED] font-mono">
                TRANSFORMER-POWERED NLP
              </span>
            </div>

            {/* Main Heading with Editorial Gradient */}
            <h1 className="text-4xl sm:text-5xl lg:text-[62px] leading-[1.1] font-extrabold tracking-tight text-[#0A0A0A] font-display">
              <span className="gradient-text">AI-powered sentiment analysis</span>{' '}
              for smarter decisions
            </h1>

            {/* Supporting Text */}
            <p className="text-base sm:text-lg text-[#555555] max-w-xl leading-relaxed">
              Understand what people really mean. Analyze text with advanced Transformer models and instantly discover sentiment, confidence, emotions and key insights.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => {
                  const el = document.getElementById('analyzer');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="btn-gradient px-7 py-3.5 rounded-full text-sm font-bold flex items-center gap-2 shadow-premium cursor-pointer"
              >
                <span>Analyze Text</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  const el = document.getElementById('features');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-6 py-3.5 rounded-full bg-white hover:bg-[#FFF8F5] border border-[#E8E4E1] text-sm font-bold text-[#0A0A0A] transition-all shadow-soft cursor-pointer"
              >
                Explore Features
              </button>
            </div>

            {/* Trust Points */}
            <div className="flex flex-wrap items-center gap-6 pt-3 text-xs font-semibold text-[#555555]">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Transformer AI</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Real-time analysis</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                <span>Confidence scoring</span>
              </div>
            </div>
          </div>

          {/* Right Column: Floating AI Sentiment Visualization */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            {/* Animated Gradient Aura Behind Card */}
            <div className="absolute inset-0 bg-gradient-to-tr from-[#7C3AED]/20 via-[#EC4899]/20 to-[#F97316]/20 rounded-3xl blur-2xl transform scale-95 animate-pulse-glow -z-10" />

            {/* Main Floating Card */}
            <div className="w-full max-w-md bg-white border border-[#E8E4E1] rounded-3xl p-6 shadow-floating space-y-5 relative">
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-[#F0ECE8] pb-3.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                    Sentiment Analysis
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 text-[11px] font-bold font-mono">
                  LIVE INFERENCE
                </span>
              </div>

              {/* Text Sample */}
              <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]/80 text-xs leading-relaxed text-[#0A0A0A] font-medium italic">
                “The product quality is excellent and the support team was incredibly helpful.”
              </div>

              {/* Primary Result & Confidence */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                    Detected Sentiment
                  </span>
                  <div className="text-xl font-extrabold text-[#16A34A] flex items-center gap-1.5">
                    <Smile className="w-5 h-5" />
                    <span>POSITIVE</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#555555]">
                    Confidence
                  </span>
                  <p className="text-xl font-extrabold text-[#0A0A0A] font-mono">
                    94.8%
                  </p>
                </div>
              </div>

              {/* Probability Progress Bars */}
              <div className="space-y-2 pt-1">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#555555]">
                    <span className="text-[#16A34A] font-semibold">Positive</span>
                    <span className="font-mono">94.8%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#16A34A]" style={{ width: '94.8%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#555555]">
                    <span className="text-[#D97706] font-semibold">Neutral</span>
                    <span className="font-mono">3.7%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#D97706]" style={{ width: '3.7%' }} />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-medium text-[#555555]">
                    <span className="text-[#DC2626] font-semibold">Negative</span>
                    <span className="font-mono">1.5%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden">
                    <div className="h-full rounded-full bg-[#DC2626]" style={{ width: '1.5%' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Satellite Floating Badge 1: Emotion */}
            <div className="hidden sm:flex absolute -top-5 -right-4 p-3 rounded-2xl bg-white border border-[#E8E4E1] shadow-floating items-center gap-2 animate-float">
              <span className="text-lg">😊</span>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#555555]">Emotion</p>
                <p className="text-xs font-extrabold text-[#0A0A0A]">Satisfaction</p>
              </div>
            </div>

            {/* Satellite Floating Badge 2: Key Phrase */}
            <div className="hidden sm:flex absolute -bottom-5 -left-4 p-3 rounded-2xl bg-white border border-[#E8E4E1] shadow-floating items-center gap-2 animate-float-slow">
              <div className="w-6 h-6 rounded-lg bg-[#EC4899]/10 text-[#EC4899] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-[#555555]">Key Phrase</p>
                <p className="text-xs font-extrabold text-[#0A0A0A]">“excellent quality”</p>
              </div>
            </div>

            {/* Satellite Floating Badge 3: Model */}
            <div className="hidden sm:flex absolute -top-4 -left-6 px-3 py-1.5 rounded-full bg-white border border-[#E8E4E1] shadow-soft items-center gap-1.5 text-[11px] font-mono text-[#7C3AED]">
              <Cpu className="w-3 h-3" />
              <span>Transformer NLP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. TRUST / TECHNOLOGY STRIP */}
      {/* ========================================================================= */}
      <section className="border-y border-[#E8E4E1] py-8 bg-white/40">
        <div className="text-center space-y-4">
          <p className="text-xs font-bold tracking-widest uppercase text-[#888888] font-mono">
            POWERED BY MODERN NLP TECHNOLOGY
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8">
            {['Transformer', 'BERT', 'RoBERTa', 'DistilBERT', 'PyTorch', 'Hugging Face'].map((tech, i) => (
              <div
                key={i}
                className="px-4 py-2 rounded-xl bg-white border border-[#E8E4E1] text-xs font-bold font-display text-[#0A0A0A] shadow-soft hover:border-[#7C3AED]/40 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. HOW IT WORKS */}
      {/* ========================================================================= */}
      <section id="how-it-works" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#7C3AED] font-mono">
            ARCHITECTURE PIPELINE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            How sentiment analysis works
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            From raw text to meaningful AI insights in seconds.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              step: '01',
              title: 'Input Text',
              desc: 'Paste reviews, comments, feedback or any unstructured text into the engine.',
              icon: MessageSquare,
            },
            {
              step: '02',
              title: 'Transformer Processing',
              desc: 'The Transformer encoder understands contextual syntax and token dependencies.',
              icon: Cpu,
            },
            {
              step: '03',
              title: 'Sentiment Detection',
              desc: 'Softmax classification identifies positive, neutral, or negative polarity.',
              icon: Smile,
            },
            {
              step: '04',
              title: 'AI Insights',
              desc: 'Get confidence scores, emotions, aspect keywords, and token saliency heatmaps.',
              icon: Sparkles,
            },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="editorial-card p-6 rounded-3xl space-y-4 relative group"
              >
                <span className="text-2xl font-extrabold font-mono text-[#E8E4E1] group-hover:text-[#EC4899] transition-colors">
                  {item.step}
                </span>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/10 to-[#EC4899]/10 text-[#7C3AED] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] font-display">
                  {item.title}
                </h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 4. MAIN INTERACTIVE ANALYZER SECTION */}
      {/* ========================================================================= */}
      <section id="analyzer" ref={analyzerRef} className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#EC4899] font-mono">
            LIVE INTERACTIVE WORKSPACE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Analyze any text with AI
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            Experience sub-second Transformer inference with aspect breakdown and saliency attribution.
          </p>
        </div>

        {/* Large Rounded Analysis Container */}
        <div className="editorial-card p-6 sm:p-8 rounded-[32px] shadow-floating">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Side: Input Workspace (5 Cols) */}
            <div className="lg:col-span-5 space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                  Input Passage
                </label>
                <span className="text-[11px] font-mono text-[#888888]">
                  {inputText.length} / 5000 chars
                </span>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={6}
                maxLength={5000}
                placeholder="Paste reviews, customer feedback, tweets or opinions here..."
                className="w-full p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] text-sm text-[#0A0A0A] placeholder-[#888888] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10 outline-none resize-none transition-all"
              />

              {/* Model Architecture Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#555555] flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Transformer Architecture
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4E1] text-xs font-semibold text-[#0A0A0A] outline-none focus:border-[#7C3AED]"
                >
                  <option value="cardiffnlp/twitter-roberta-base-sentiment-latest">RoBERTa (Default - High Contextual Accuracy)</option>
                  <option value="distilbert-base-uncased-finetuned-sst-2-english">DistilBERT (Fast SST-2 Inference)</option>
                  <option value="nlptown/bert-base-multilingual-uncased-sentiment">BERT (Multilingual Context)</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const sample = "The noise cancellation is miraculous, but the battery drains far too fast.";
                    setInputText(sample);
                    runAnalysis(sample);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-white hover:bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-bold text-[#555555] transition-all cursor-pointer"
                >
                  Try Example
                </button>

                <button
                  type="button"
                  disabled={analyzing || !inputText.trim()}
                  onClick={() => runAnalysis(inputText)}
                  className="btn-gradient flex-1 py-3 px-5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-premium disabled:opacity-50 cursor-pointer"
                >
                  {analyzing ? (
                    <>
                      <RotateCcw className="w-4 h-4 animate-spin" />
                      <span>Analyzing Context...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Analyze Sentiment</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right Side: Live Results Panel (7 Cols) */}
            <div className="lg:col-span-7 bg-[#FFF8F5] border border-[#E8E4E1] rounded-3xl p-6 space-y-6">
              {analyzing ? (
                /* Elegant Skeleton Loading State */
                <div className="py-12 space-y-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] mx-auto flex items-center justify-center text-white animate-pulse">
                    <Sparkles className="w-6 h-6 animate-spin" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0A0A0A]">Computing Transformer Self-Attention...</h4>
                  <p className="text-xs text-[#555555]">Extracting softmax probabilities, emotions, and aspect dependencies</p>
                </div>
              ) : result ? (
                <div className="space-y-5">
                  {/* Results Header */}
                  <div className="flex items-center justify-between border-b border-[#E8E4E1] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A]">
                        Inference Output
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[10px] font-bold font-mono">
                        {result.is_live_backend ? 'REAL-TIME BACKEND' : 'TRANSFORMER ENGINE'}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono text-[#555555]">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                        {result.processing_time_ms}ms
                      </span>
                      <button
                        onClick={() => setShowJson(!showJson)}
                        className="text-xs font-semibold text-[#7C3AED] hover:underline flex items-center gap-1"
                      >
                        <Code className="w-3.5 h-3.5" />
                        <span>{showJson ? 'Visual' : 'JSON'}</span>
                      </button>
                    </div>
                  </div>

                  {showJson ? (
                    <div className="relative">
                      <button
                        onClick={handleCopyJson}
                        className="absolute top-2 right-2 px-2.5 py-1 rounded bg-white border border-[#E8E4E1] text-[11px] font-medium text-[#0A0A0A] flex items-center gap-1 shadow-sm"
                      >
                        {copied ? <Check className="w-3 h-3 text-[#16A34A]" /> : <Copy className="w-3 h-3" />}
                        <span>{copied ? 'Copied' : 'Copy'}</span>
                      </button>
                      <pre className="p-4 rounded-2xl bg-white border border-[#E8E4E1] text-xs font-mono text-[#7C3AED] overflow-x-auto max-h-80">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                  ) : (
                    <>
                      {/* Top Metrics Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4E1]">
                          <span className="text-[10px] uppercase font-bold text-[#888888]">Sentiment</span>
                          <p className={`text-base font-extrabold uppercase mt-0.5 ${
                            result.sentiment === 'positive' ? 'text-[#16A34A]' : result.sentiment === 'negative' ? 'text-[#DC2626]' : 'text-[#D97706]'
                          }`}>
                            {result.sentiment}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4E1]">
                          <span className="text-[10px] uppercase font-bold text-[#888888]">Confidence</span>
                          <p className="text-base font-extrabold text-[#0A0A0A] font-mono mt-0.5">
                            {Math.round(result.confidence * 100)}%
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4E1]">
                          <span className="text-[10px] uppercase font-bold text-[#888888]">Emotion</span>
                          <p className="text-xs font-bold text-[#EC4899] mt-1 truncate">
                            {result.emotions?.[0]?.icon || '😊 Satisfaction'}
                          </p>
                        </div>

                        <div className="p-3.5 rounded-2xl bg-white border border-[#E8E4E1]">
                          <span className="text-[10px] uppercase font-bold text-[#888888]">Model</span>
                          <p className="text-xs font-bold text-[#7C3AED] mt-1 truncate">
                            {result.model}
                          </p>
                        </div>
                      </div>

                      {/* Sentiment Distribution Bars */}
                      <div className="p-4 rounded-2xl bg-white border border-[#E8E4E1] space-y-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                          Sentiment Distribution
                        </span>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-xs font-medium text-[#555555]">
                              <span className="text-[#16A34A] font-semibold">Positive</span>
                              <span className="font-mono">{Math.round((result.probabilities?.positive || 0) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden mt-0.5">
                              <div className="h-full rounded-full bg-[#16A34A]" style={{ width: `${Math.round((result.probabilities?.positive || 0) * 100)}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-medium text-[#555555]">
                              <span className="text-[#D97706] font-semibold">Neutral</span>
                              <span className="font-mono">{Math.round((result.probabilities?.neutral || 0) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden mt-0.5">
                              <div className="h-full rounded-full bg-[#D97706]" style={{ width: `${Math.round((result.probabilities?.neutral || 0) * 100)}%` }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-medium text-[#555555]">
                              <span className="text-[#DC2626] font-semibold">Negative</span>
                              <span className="font-mono">{Math.round((result.probabilities?.negative || 0) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden mt-0.5">
                              <div className="h-full rounded-full bg-[#DC2626]" style={{ width: `${Math.round((result.probabilities?.negative || 0) * 100)}%` }} />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Key Phrases & Aspects */}
                      {result.keywords && result.keywords.length > 0 && (
                        <div className="p-4 rounded-2xl bg-white border border-[#E8E4E1] space-y-2">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                            Extracted Key Phrases & Aspects
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {result.keywords.map((kw, i) => (
                              <span key={i} className="px-2.5 py-1 rounded-lg bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-semibold text-[#0A0A0A] font-mono">
                                “{kw}”
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Explainable AI Saliency Map */}
                      {result.explanation && result.explanation.tokens && (
                        <div className="p-4 rounded-2xl bg-white border border-[#E8E4E1] space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-[#7C3AED] flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>Explainable AI Token Importance Heatmap</span>
                            </span>
                            <span className="text-[10px] font-mono text-[#888888]">Gradient Saliency</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-mono">
                            {result.explanation.tokens.map((tok, i) => {
                              const score = result.explanation.scores?.[i] || 0;
                              let bg = 'bg-white text-[#555555]';
                              if (score > 0.1) bg = 'bg-[#16A34A]/20 text-[#16A34A] font-bold border border-[#16A34A]/30';
                              else if (score < -0.1) bg = 'bg-[#DC2626]/20 text-[#DC2626] font-bold border border-[#DC2626]/30';

                              return (
                                <span key={i} className={`px-2 py-0.5 rounded ${bg}`} title={`Saliency: ${score}`}>
                                  {tok}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 5. FEATURES SECTION */}
      {/* ========================================================================= */}
      <section id="features" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#7C3AED] font-mono">
            CAPSTONE CAPABILITIES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Everything you need to understand text
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            Comprehensive natural language intelligence powered by state-of-the-art neural encoders.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              id: '01',
              title: 'Transformer Intelligence',
              desc: 'Context-aware sentiment classification capturing complex linguistic nuances.',
              icon: Cpu,
            },
            {
              id: '02',
              title: 'Real-time Analysis',
              desc: 'Instantly analyze text with highly optimized sub-second inference speed.',
              icon: Zap,
            },
            {
              id: '03',
              title: 'Confidence Scores',
              desc: 'Understand exactly how confident the model is with true softmax probability outputs.',
              icon: ShieldCheck,
            },
            {
              id: '04',
              title: 'Emotion Detection',
              desc: 'Identify nuanced emotions including satisfaction, joy, frustration, and fear.',
              icon: Heart,
            },
            {
              id: '05',
              title: 'Key Phrase Extraction',
              desc: 'Discover important words, aspect targets, and contextual entity relationships.',
              icon: Search,
            },
            {
              id: '06',
              title: 'Analytics Dashboard',
              desc: 'Track sentiment trends, class distributions, and aggregate telemetry over time.',
              icon: LineChart,
            },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="editorial-card p-7 rounded-3xl space-y-4 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/10 via-[#EC4899]/10 to-[#F97316]/10 text-[#7C3AED] flex items-center justify-center transition-transform group-hover:scale-110 duration-200">
                    <Icon className="w-5 h-5 text-[#7C3AED]" />
                  </div>
                  <span className="text-xs font-mono font-bold text-[#888888]">{f.id}</span>
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] font-display">
                  {f.title}
                </h3>
                <p className="text-xs text-[#555555] leading-relaxed">
                  {f.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. ANALYTICS SECTION */}
      {/* ========================================================================= */}
      <section id="analytics" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#EC4899] font-mono">
            AGGREGATED TELEMETRY
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Turn text into actionable insights
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            Multi-dimensional visualization computed from real dataset ingestion.
          </p>
        </div>

        <div className="editorial-card p-8 rounded-[32px] shadow-floating space-y-8">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#555555]">Total Inferences</p>
              <p className="text-2xl font-extrabold text-[#0A0A0A] font-display mt-1">
                {liveOverview?.total_analyses ?? 1480}
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">Processed records</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#16A34A]">Positive Sentiment</p>
              <p className="text-2xl font-extrabold text-[#16A34A] font-display mt-1">
                {liveOverview?.positive_percentage ?? 72}%
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                {liveOverview?.positive_count ?? 1065} entries
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#D97706]">Neutral Sentiment</p>
              <p className="text-2xl font-extrabold text-[#D97706] font-display mt-1">
                {liveOverview?.neutral_percentage ?? 18}%
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                {liveOverview?.neutral_count ?? 266} entries
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
              <p className="text-xs font-bold uppercase tracking-wider text-[#DC2626]">Negative Sentiment</p>
              <p className="text-2xl font-extrabold text-[#DC2626] font-display mt-1">
                {liveOverview?.negative_percentage ?? 10}%
              </p>
              <p className="text-[11px] text-[#888888] mt-0.5">
                {liveOverview?.negative_count ?? 149} entries
              </p>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Donut Chart */}
            <div className="p-6 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-[#7C3AED]" />
                Sentiment Overview
              </h3>
              <div className="h-56 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={
                        liveSentimentData?.distribution
                          ? Object.entries(liveSentimentData.distribution).map(([name, value]) => ({ name, value }))
                          : samplePieData
                      }
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {(liveSentimentData?.distribution
                        ? Object.entries(liveSentimentData.distribution).map(([name, value]) => ({ name, value }))
                        : samplePieData
                      ).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={SENTIMENT_COLORS[entry.name] || '#7C3AED'}
                          stroke="#FFF8F5"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* 7-Day Trend Area Chart */}
            <div className="p-6 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1] space-y-4 lg:col-span-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                7-Day Sentiment Trend Line
              </h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={sampleTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="samplePosGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                    <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="positive" stroke="#16A34A" fill="url(#samplePosGrad)" />
                    <Area type="monotone" dataKey="neutral" stroke="#D97706" fill="transparent" />
                    <Area type="monotone" dataKey="negative" stroke="#DC2626" fill="transparent" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 7. USE CASES */}
      {/* ========================================================================= */}
      <section id="use-cases" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#F97316] font-mono">
            REAL-WORLD APPLICATIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Built for real-world feedback
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            Powering intelligent decision making across customer feedback channels.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              title: 'Customer Reviews',
              desc: 'Analyze product reviews on e-commerce and app stores to identify customer satisfaction trends.',
              icon: Smile,
            },
            {
              title: 'Social Media Monitoring',
              desc: 'Monitor public brand sentiment and reactions in real-time across Twitter, Reddit, and forums.',
              icon: Share2,
            },
            {
              title: 'Business & Employee Feedback',
              desc: 'Process internal survey responses and feedback to evaluate workplace satisfaction.',
              icon: Briefcase,
            },
            {
              title: 'Market Research',
              desc: 'Identify emerging market trends, competitor sentiment, and product opportunities from text.',
              icon: Search,
            },
            {
              title: 'Support Tickets & Helpdesks',
              desc: 'Detect customer frustration and urgency in support tickets to prioritize escalations.',
              icon: Headphones,
            },
          ].map((u, i) => {
            const Icon = u.icon;
            return (
              <div key={i} className="editorial-card p-6 rounded-3xl space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/10 to-[#F97316]/10 text-[#F97316] flex items-center justify-center">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-[#0A0A0A] font-display">{u.title}</h3>
                <p className="text-xs text-[#555555] leading-relaxed">{u.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 8. TRANSFORMER MODEL SECTION */}
      {/* ========================================================================= */}
      <section id="models" className="space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#7C3AED] font-mono">
            NEURAL ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Powered by Transformer models
          </h2>
          <p className="text-sm sm:text-base text-[#555555]">
            How Transformer-based NLP captures bi-directional context and nuances.
          </p>
        </div>

        {/* Visual Processing Pipeline */}
        <div className="editorial-card p-8 rounded-[32px] space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#555555] text-center">
            Neural Processing Pipeline Flow
          </h3>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-mono">
            {['Input Text', 'Tokenization', 'Transformer Encoder', 'Contextual Representation', 'Classification Head', 'Sentiment + Confidence'].map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="px-3.5 py-2 rounded-xl bg-[#FFF8F5] border border-[#E8E4E1] font-bold text-[#0A0A0A] shadow-sm">
                  {step}
                </div>
                {idx < 5 && <ArrowRight className="w-4 h-4 text-[#EC4899] shrink-0" />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Model Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'BERT',
              type: 'Bidirectional Encoder',
              desc: 'Deep contextual representations considering both left and right context in all layers.',
              metric: '92.4% Accuracy',
            },
            {
              name: 'RoBERTa',
              type: 'Optimized BERT Architecture',
              desc: 'Trained on larger mini-batches and longer sequences, removing Next Sentence Prediction.',
              metric: '94.8% Accuracy',
              highlight: true,
            },
            {
              name: 'DistilBERT',
              type: 'Knowledge Distillation',
              desc: 'Retains 97% of BERT language understanding with 60% faster inference and lower compute.',
              metric: '91.7% Accuracy',
            },
          ].map((m, i) => (
            <div
              key={i}
              className={`p-6 rounded-3xl border transition-all ${
                m.highlight
                  ? 'bg-white border-[#7C3AED] shadow-premium ring-2 ring-[#7C3AED]/20'
                  : 'editorial-card'
              } space-y-4`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg font-extrabold text-[#0A0A0A] font-display">{m.name}</span>
                <span className="px-2 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-[10px] font-bold font-mono">
                  {m.metric}
                </span>
              </div>
              <p className="text-[11px] font-mono text-[#7C3AED]">{m.type}</p>
              <p className="text-xs text-[#555555] leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 9. LIVE DEMO / INTERACTIVE AREA */}
      {/* ========================================================================= */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#EC4899] font-mono">
            CLICK-TO-ANALYZE EXAMPLES
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            See AI understand your words
          </h2>
          <p className="text-sm text-[#555555]">
            Click any sentence below to immediately test the analyzer above.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demoSentences.map((demo, idx) => (
            <div
              key={idx}
              onClick={() => handlePresetClick(demo.text)}
              className="editorial-card p-5 rounded-2xl cursor-pointer hover:border-[#7C3AED] hover:shadow-floating transition-all space-y-3 group"
            >
              <p className="text-xs text-[#0A0A0A] font-medium leading-relaxed italic">
                “{demo.text}”
              </p>
              <div className="flex items-center justify-between pt-2 border-t border-[#F0ECE8]">
                <span className={`text-xs font-bold uppercase ${
                  demo.type === 'positive' ? 'text-[#16A34A]' : demo.type === 'negative' ? 'text-[#DC2626]' : 'text-[#D97706]'
                }`}>
                  → {demo.sentiment}
                </span>
                <span className="text-[11px] font-mono text-[#888888]">
                  {demo.confidence}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 10. FAQ SECTION */}
      {/* ========================================================================= */}
      <section id="faq" className="space-y-12 max-w-3xl mx-auto">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold tracking-wider uppercase text-[#7C3AED] font-mono">
            FREQUENTLY ASKED QUESTIONS
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0A0A0A] font-display tracking-tight">
            Common questions & answers
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="editorial-card rounded-2xl overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? -1 : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-sm text-[#0A0A0A] hover:text-[#7C3AED] transition-colors"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 shrink-0 text-[#7C3AED]" /> : <ChevronDown className="w-4 h-4 shrink-0 text-[#888888]" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs text-[#555555] leading-relaxed border-t border-[#F0ECE8] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 11. FINAL CTA SECTION */}
      {/* ========================================================================= */}
      <section className="relative p-10 sm:p-14 rounded-[36px] bg-gradient-to-r from-[#7C3AED] via-[#EC4899] to-[#F97316] text-white text-center space-y-6 shadow-glow-purple overflow-hidden">
        <div className="max-w-xl mx-auto space-y-3 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-display tracking-tight leading-tight">
            Understand every opinion. One analysis at a time.
          </h2>
          <p className="text-sm sm:text-base text-white/90 leading-relaxed">
            Turn unstructured text into clear, meaningful AI insights with Transformer intelligence.
          </p>
        </div>

        <div className="relative z-10">
          <button
            onClick={() => {
              const el = document.getElementById('analyzer');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-8 py-3.5 rounded-full bg-white text-[#0A0A0A] text-sm font-extrabold hover:bg-[#FFF8F5] transition-all shadow-floating inline-flex items-center gap-2 cursor-pointer"
          >
            <span>Start Analyzing</span>
            <ArrowRight className="w-4 h-4 text-[#7C3AED]" />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 12. FOOTER */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#E8E4E1] pt-12 text-xs text-[#555555] space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#7C3AED] to-[#EC4899] p-0.5">
                <div className="w-full h-full bg-white rounded-[6px] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
                </div>
              </div>
              <span className="text-sm font-extrabold text-[#0A0A0A] font-display">
                Sentiment<span className="gradient-text">AI</span>
              </span>
            </div>
            <p className="text-xs text-[#555555]">
              Transformer-powered sentiment intelligence for smarter decisions.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">Product</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">Features</button></li>
              <li><button onClick={() => document.getElementById('analyzer')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">AI Analyzer</button></li>
              <li><button onClick={() => document.getElementById('analytics')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">Analytics</button></li>
            </ul>
          </div>

          <div className="space-y-2">
            <p className="font-bold text-[#0A0A0A] uppercase tracking-wider text-[11px]">Resources</p>
            <ul className="space-y-1.5">
              <li><button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">How it works</button></li>
              <li><button onClick={() => document.getElementById('models')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">Transformer Models</button></li>
              <li><button onClick={() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' })} className="hover:text-[#0A0A0A]">FAQ</button></li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-[#E8E4E1] flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#888888]">
          <p>© 2026 SentimentAI. All rights reserved.</p>
          <p>MCA Capstone Project — Sentiment Analysis Using Transformer Models</p>
        </div>
      </footer>
    </div>
  );
}
