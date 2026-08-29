import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const checkHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

// Single Text Prediction
export const predictSingleText = async (payload) => {
  const response = await api.post('/predict', payload);
  return response.data;
};

// Bulk CSV Analysis
export const uploadBulkCSV = async (formData, onUploadProgress) => {
  const response = await api.post('/bulk-analysis', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  return response.data;
};

// Prediction History
export const getPredictions = async (params = {}) => {
  const response = await api.get('/predictions', { params });
  return response.data;
};

export const getPredictionById = async (id) => {
  const response = await api.get(`/predictions/${id}`);
  return response.data;
};

export const deletePrediction = async (id) => {
  const response = await api.delete(`/predictions/${id}`);
  return response.data;
};

// Analytics
export const getAnalyticsOverview = async () => {
  const response = await api.get('/analytics/overview');
  return response.data;
};

export const getSentimentAnalytics = async () => {
  const response = await api.get('/analytics/sentiment');
  return response.data;
};

export const getEmotionAnalytics = async () => {
  const response = await api.get('/analytics/emotions');
  return response.data;
};

export const getAspectAnalytics = async () => {
  const response = await api.get('/analytics/aspects');
  return response.data;
};

// Model Performance & Comparison
export const getModelPerformance = async () => {
  const response = await api.get('/model-performance');
  return response.data;
};

export default api;
