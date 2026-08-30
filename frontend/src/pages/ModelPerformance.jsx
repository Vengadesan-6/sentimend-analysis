import React, { useState, useEffect } from 'react';
import {
  Gauge,
  Cpu,
  Zap,
  TrendingUp,
  Award,
  CheckCircle,
  Clock,
  Layers,
  RefreshCw
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { getModelPerformance } from '../services/api';

export default function ModelPerformance() {
  const [loading, setLoading] = useState(true);
  const [models, setModels] = useState([]);
  const [selectedModelIdx, setSelectedModelIdx] = useState(0);

  const fetchMetrics = async () => {
    setLoading(true);
    try {
      const res = await getModelPerformance();
      if (res.data?.models) {
        setModels(res.data.models);
      }
    } catch (err) {
      console.error('Failed to load model performance:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const comparisonBarData = models.map((m) => ({
    name: m.display_name,
    Accuracy: Math.round(m.accuracy * 100),
    Precision: Math.round(m.precision * 100),
    Recall: Math.round(m.recall * 100),
    F1: Math.round(m.f1_score * 100),
    Latency: m.inference_time_ms
  }));

  const selectedModel = models[selectedModelIdx] || null;

  return (
    <div className="space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0A0A0A] font-display tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#7C3AED]/10 text-[#7C3AED] flex items-center justify-center">
              <Gauge className="w-5 h-5" />
            </div>
            <span>Transformer Model Benchmarks</span>
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Real evaluated performance metrics (Accuracy, Precision, Recall, F1, Latency) across RoBERTa, DistilBERT, and BERT.
          </p>
        </div>

        <button
          onClick={fetchMetrics}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-bold text-[#555555] transition-all flex items-center gap-1.5 shadow-soft cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Benchmarks</span>
        </button>
      </div>

      {/* Model Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {models.map((m, idx) => {
          const isSelected = idx === selectedModelIdx;
          return (
            <div
              key={idx}
              onClick={() => setSelectedModelIdx(idx)}
              className={`p-7 rounded-[32px] border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                isSelected
                  ? 'bg-white border-[#7C3AED] shadow-premium ring-2 ring-[#7C3AED]/20'
                  : 'editorial-card'
              }`}
            >
              {idx === 0 && (
                <div className="absolute top-4 right-4 px-2.5 py-0.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] border border-[#16A34A]/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                  <Award className="w-3 h-3" />
                  <span>Top Model</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-[#7C3AED]/10 text-[#7C3AED]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#0A0A0A] font-display">{m.display_name}</h3>
                  <p className="text-[11px] text-[#888888] font-mono">{m.model_name.split('/').pop()}</p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
                  <span className="text-[10px] text-[#555555] uppercase font-bold">Accuracy</span>
                  <p className="text-xl font-extrabold text-[#16A34A] font-mono mt-0.5">
                    {(m.accuracy * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
                  <span className="text-[10px] text-[#555555] uppercase font-bold">Weighted F1</span>
                  <p className="text-xl font-extrabold text-[#7C3AED] font-mono mt-0.5">
                    {(m.f1_score * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
                  <span className="text-[10px] text-[#555555] uppercase font-bold">Precision</span>
                  <p className="text-sm font-bold text-[#0A0A0A] font-mono mt-0.5">
                    {(m.precision * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
                  <span className="text-[10px] text-[#555555] uppercase font-bold">Avg Latency</span>
                  <p className="text-sm font-bold text-[#F97316] font-mono mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {m.inference_time_ms}ms
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comparative Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Metric Comparison BarChart */}
        <div className="editorial-card p-6 rounded-3xl space-y-4 shadow-floating">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#7C3AED]" />
            Comparative Metrics (Accuracy, Precision, Recall, F1)
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} domain={[0, 100]} />
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="Accuracy" fill="#16A34A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Precision" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Recall" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="F1" fill="#7C3AED" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Inference Latency Comparison */}
        <div className="editorial-card p-6 rounded-3xl space-y-4 shadow-floating">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#0A0A0A] flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#F97316]" />
            Inference Latency (Lower is Better)
          </h3>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonBarData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4E1" vertical={false} />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip />
                <Bar dataKey="Latency" fill="#F97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Selected Model Confusion Matrix Detail */}
      {selectedModel && selectedModel.confusion_matrix && (() => {
        const rawCm = selectedModel.confusion_matrix;
        const labels = rawCm.labels || ['Positive', 'Neutral', 'Negative'];
        const matrix = Array.isArray(rawCm) ? rawCm : rawCm.matrix || [];
        const evaluatedDate = selectedModel.evaluated_at
          ? isNaN(Date.parse(selectedModel.evaluated_at))
            ? selectedModel.evaluated_at
            : new Date(selectedModel.evaluated_at).toLocaleDateString()
          : 'Benchmark Baseline';

        return (
          <div className="editorial-card p-8 rounded-[32px] space-y-4 shadow-floating">
            <div className="flex items-center justify-between border-b border-[#E8E4E1] pb-3">
              <div>
                <h3 className="text-base font-bold text-[#0A0A0A] font-display flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#7C3AED]" />
                  Confusion Matrix: {selectedModel.display_name}
                </h3>
                <p className="text-xs text-[#555555] mt-0.5">
                  Evaluated on {selectedModel.test_sample_count} real test samples
                </p>
              </div>
              <span className="text-xs font-mono text-[#888888]">
                {evaluatedDate}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full max-w-md mx-auto text-center text-xs border-collapse font-mono">
                <thead>
                  <tr>
                    <th className="p-2 text-[#888888]">Actual \ Predicted</th>
                    {labels.map((lbl) => (
                      <th key={lbl} className="p-2 text-[#7C3AED] font-bold border-b border-[#E8E4E1]">
                        {lbl}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map((row, rIdx) => (
                    <tr key={rIdx} className="border-b border-[#E8E4E1]">
                      <td className="p-2 font-bold text-[#7C3AED] text-left border-r border-[#E8E4E1]">
                        {labels[rIdx] || `Class ${rIdx}`}
                      </td>
                      {row.map((val, cIdx) => (
                        <td
                          key={cIdx}
                          className={`p-3 font-bold transition-all ${
                            rIdx === cIdx
                              ? 'bg-[#16A34A]/20 text-[#16A34A]'
                              : val > 0
                              ? 'bg-[#DC2626]/10 text-[#DC2626]'
                              : 'text-[#888888]'
                          }`}
                        >
                          {val}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
