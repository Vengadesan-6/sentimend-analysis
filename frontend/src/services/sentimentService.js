import api from './api';

/**
 * Service to analyze text with real Transformer models via the backend API.
 * Dispatches inference requests to FastAPI + PyTorch/Transformers pipeline.
 */
export async function analyzeText(text, modelName = 'cardiffnlp/twitter-roberta-base-sentiment-latest', includeXai = true) {
  if (!text || !text.trim()) {
    throw new Error("Input text cannot be empty.");
  }

  const startTime = performance.now();

  const response = await api.post('/predict', {
    text: text.trim(),
    model_name: modelName,
    model: modelName,
    include_xai: includeXai,
  });

  if (!response.data || !response.data.success || !response.data.data) {
    throw new Error(response.data?.message || "Inference failed to return valid prediction data.");
  }

  const d = response.data.data;
  const elapsed = d.processing_time_ms || Math.round(performance.now() - startTime);

  const parsedRes = {
    id: d.id,
    text: d.text || text,
    sentiment: (d.sentiment || 'Neutral').toLowerCase(),
    confidence: d.confidence,
    probabilities: {
      positive: d.probabilities?.Positive || 0,
      neutral: d.probabilities?.Neutral || 0,
      negative: d.probabilities?.Negative || 0,
    },
    emotions: [
      { name: d.emotion || 'Neutral', confidence: d.confidence, icon: getEmotionIcon(d.emotion) }
    ],
    emotion: d.emotion || 'Neutral',
    emotion_probabilities: d.emotion_probabilities || {},
    keywords: d.aspects?.map(a => a.aspect) || [],
    aspects: d.aspects || [],
    explanation: d.explanation || null,
    model: d.model_name ? d.model_name.split('/').pop() : "Transformer",
    model_full_name: d.model_name || modelName,
    processing_time_ms: elapsed,
    created_at: d.created_at || new Date().toISOString(),
    is_live_backend: true,
  };

  return parsedRes;
}

export function getEmotionIcon(emotion) {
  const norm = String(emotion || '').toLowerCase();
  if (norm.includes('joy')) return '😊 Satisfaction';
  if (norm.includes('anger')) return '😠 Frustration';
  if (norm.includes('sadness')) return '😢 Disappointment';
  if (norm.includes('fear')) return '😨 Concern';
  if (norm.includes('surprise')) return '😲 Delight';
  if (norm.includes('disgust')) return '😒 Displeasure';
  return '😐 Neutral';
}

export default {
  analyzeText,
  getEmotionIcon
};
