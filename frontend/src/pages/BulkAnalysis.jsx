import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Cpu,
  Smile,
  Frown,
  Meh
} from 'lucide-react';
import api, { uploadBulkCSV } from '../services/api';
import SentimentBadge from '../components/SentimentBadge';
import EmotionBadge from '../components/EmotionBadge';

export default function BulkAnalysis() {
  const [file, setFile] = useState(null);
  const [modelName, setModelName] = useState('cardiffnlp/twitter-roberta-base-sentiment-latest');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please upload a valid .csv file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const selected = e.dataTransfer.files[0];
      if (!selected.name.endsWith('.csv')) {
        setError('Please drop a valid .csv file.');
        return;
      }
      setFile(selected);
      setError(null);
      setResult(null);
    }
  };

  const loadSampleDataset = async () => {
    const csvContent = `text
"The AI model's response time is exceptionally fast, and the dashboard UI is simply stunning!"
"Terrible customer service. Waited 45 minutes on hold just to get disconnected."
"The smartphone weighs 187 grams and has a 6.7-inch AMOLED screen."
"The noise cancellation on these headphones is miraculous on noisy flights."
"The touchscreen is unresponsive around the corners. Regret buying this."
"Seamless integration with our existing MongoDB cluster and effortless setup."
"Battery drains completely within 3 hours of moderate usage. Completely unacceptable."
"The product comes in three colors: Space Gray, Silver, and Midnight Blue."
"The camera captures breathtaking low-light photos with zero noise."
"Misleading product descriptions and poor packaging. Arrived with scratches."`;

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const sampleFile = new File([blob], 'sample_bulk_test.csv', { type: 'text/csv' });
    setFile(sampleFile);
    setError(null);
    setResult(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select or drop a CSV file first.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    setUploadProgress(15);

    const formData = new FormData();
    formData.append('file', file);
    if (modelName) {
      formData.append('model_name', modelName);
      formData.append('model', modelName);
    }

    try {
      const response = await uploadBulkCSV(formData, (progressEvent) => {
        const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
        setUploadProgress(Math.min(95, percent));
      });

      if (response && response.success && response.data) {
        setUploadProgress(100);
        setResult(response.data);
      } else {
        throw new Error(response?.message || 'Server batch inference returned empty');
      }
    } catch (err) {
      console.error('Batch inference error:', err);
      setError(err.response?.data?.message || err.message || 'CSV batch inference failed on backend.');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleExportCSV = (e) => {
    if (result?.all_results && result.all_results.length > 0) {
      if (e) e.preventDefault();
      const csvHeader = "Text,Sentiment,Emotion,Confidence,Model\n";
      const csvRows = result.all_results.map(r => 
        `"${(r.text || '').replace(/"/g, '""')}","${r.sentiment}","${r.emotion}",${r.confidence},"${r.model_name || ''}"`
      ).join("\n");
      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `enriched_sentiment_${result.dataset_id}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (result?.dataset_id) {
      window.open(`${api.defaults.baseURL || '/api'}/bulk-analysis/${result.dataset_id}/download`, '_blank');
    }
  };

  return (
    <div className="space-y-8 pb-16 pt-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#0A0A0A] font-display tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#EC4899]/10 text-[#EC4899] flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <span>Batch CSV Analysis</span>
          </h2>
          <p className="text-xs text-[#555555] mt-1">
            Perform true batched transformer inference with PyTorch acceleration and export enriched sentiment datasets.
          </p>
        </div>

        <button
          type="button"
          onClick={loadSampleDataset}
          className="px-4 py-2 rounded-xl bg-white hover:bg-[#FFF8F5] border border-[#E8E4E1] text-xs font-bold text-[#7C3AED] transition-all flex items-center gap-1.5 shadow-soft cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load Prepared Benchmark CSV</span>
        </button>
      </div>

      {/* Upload Dropzone Form */}
      <form onSubmit={handleSubmit} className="editorial-card p-8 rounded-[32px] shadow-floating space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`p-10 rounded-2xl border-2 border-dashed transition-all text-center flex flex-col items-center justify-center gap-3 cursor-pointer ${
            dragActive
              ? 'border-[#7C3AED] bg-[#7C3AED]/5'
              : file
              ? 'border-[#16A34A] bg-[#16A34A]/5'
              : 'border-[#E8E4E1] bg-[#FFF8F5] hover:border-[#7C3AED]/50'
          }`}
          onClick={() => document.getElementById('csv-file-input').click()}
        >
          <input
            id="csv-file-input"
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#7C3AED]/10 to-[#EC4899]/10 text-[#7C3AED] flex items-center justify-center">
            <Upload className="w-6 h-6" />
          </div>

          {file ? (
            <div className="space-y-1">
              <span className="text-sm font-bold text-[#16A34A] flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {file.name}
              </span>
              <p className="text-xs text-[#555555] font-mono">
                {(file.size / 1024).toFixed(1)} KB — Ready for neural batch inference
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-sm font-bold text-[#0A0A0A]">
                Drag and drop your dataset CSV here, or <span className="text-[#7C3AED] underline">browse files</span>
              </p>
              <p className="text-xs text-[#888888]">
                Requires a column named <span className="font-mono text-[#0A0A0A]">text</span>, <span className="font-mono text-[#0A0A0A]">review</span>, or <span className="font-mono text-[#0A0A0A]">comment</span>.
              </p>
            </div>
          )}
        </div>

        {/* Model Architecture Selection & Submit Button */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-[#555555] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#7C3AED]" />
              Batch Inference Model
            </label>
            <select
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8E4E1] text-xs font-semibold text-[#0A0A0A] outline-none focus:border-[#7C3AED]"
            >
              <option value="cardiffnlp/twitter-roberta-base-sentiment-latest">RoBERTa (High Contextual Accuracy)</option>
              <option value="distilbert-base-uncased-finetuned-sst-2-english">DistilBERT (Fast SST-2)</option>
              <option value="nlptown/bert-base-multilingual-uncased-sentiment">BERT (Multilingual Context)</option>
            </select>
          </div>

          <div className="pt-5 flex justify-end">
            <button
              type="submit"
              disabled={analyzing || !file}
              className="btn-gradient w-full md:w-auto px-7 py-3 rounded-full text-xs font-bold shadow-premium disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Batches...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Start Batch Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Progress Bar */}
        {analyzing && (
          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs font-mono text-[#555555]">
              <span>Tokenizing & Batched Tensor Execution...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F0ECE8] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#7C3AED] to-[#EC4899] rounded-full transition-all duration-300 animate-pulse"
                style={{ width: `${Math.max(uploadProgress, 35)}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-[#DC2626]/10 border border-[#DC2626]/20 text-[#DC2626] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Batch Results & Summary Statistics */}
      {result && (
        <div className="editorial-card p-8 rounded-[32px] shadow-floating space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E8E4E1] pb-4">
            <div>
              <h3 className="text-lg font-bold text-[#0A0A0A] font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#16A34A]" />
                Batch Processing Complete
              </h3>
              <p className="text-xs text-[#555555] mt-0.5 font-mono">
                Processed {result.processed_records} rows in {result.processing_time_ms}ms
              </p>
            </div>

            <button
              type="button"
              onClick={handleExportCSV}
              className="px-5 py-2.5 rounded-full bg-[#16A34A] hover:bg-[#15803D] text-white text-xs font-bold shadow-sm transition-all flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Enriched Results CSV</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#E8E4E1]">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#555555]">Total Analyzed</span>
              <p className="text-2xl font-extrabold text-[#0A0A0A] font-display mt-1">{result.total_records}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#16A34A]/20">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#16A34A]">Positive</span>
              <p className="text-2xl font-extrabold text-[#16A34A] font-display mt-1">{result.positive_count}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#DC2626]/20">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#DC2626]">Negative</span>
              <p className="text-2xl font-extrabold text-[#DC2626] font-display mt-1">{result.negative_count}</p>
            </div>
            <div className="p-4 rounded-2xl bg-[#FFF8F5] border border-[#7C3AED]/20">
              <span className="text-[11px] uppercase tracking-wider font-bold text-[#7C3AED]">Avg Confidence</span>
              <p className="text-2xl font-extrabold text-[#7C3AED] font-display mt-1">{Math.round(result.avg_confidence * 100)}%</p>
            </div>
          </div>

          {/* Sample Table Preview */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#555555]">
              Dataset Inference Preview (Top 10 Rows)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-[#E8E4E1]">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FFF8F5] text-[#555555] uppercase tracking-wider font-bold border-b border-[#E8E4E1]">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Text Snippet</th>
                    <th className="py-3 px-4">Sentiment</th>
                    <th className="py-3 px-4">Emotion</th>
                    <th className="py-3 px-4">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4E1] bg-white">
                  {result.sample_results?.map((row, i) => (
                    <tr key={i} className="hover:bg-[#FFF8F5] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#888888]">{i + 1}</td>
                      <td className="py-3 px-4 font-mono text-[#0A0A0A] max-w-md truncate">
                        {row.text}
                      </td>
                      <td className="py-3 px-4">
                        <SentimentBadge sentiment={row.sentiment} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <EmotionBadge emotion={row.emotion} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-mono text-[#0A0A0A]">
                        {Math.round(row.confidence * 100)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
