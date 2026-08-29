import axios from 'axios';

/**
 * Dynamically resolves the API base URL.
 * Priority:
 * 1. import.meta.env.VITE_API_URL or VITE_BACKEND_URL if explicitly defined
 * 2. In browser environments: '/api' (routes through Vite proxy in dev, or same-origin / reverse proxy in prod)
 * 3. Fallback: 'http://127.0.0.1:8000/api'
 */
export const getApiBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
    const trimmed = envUrl.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  }
  // In browser, relative '/api' avoids CORS issues and works across all devices on LAN & proxies
  if (typeof window !== 'undefined') {
    return '/api';
  }
  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor for clear diagnostics
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      console.warn(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url} returned ${error.response.status}:`, error.response.data);
    } else if (error.request) {
      console.error(`[API Network Error] Could not reach backend at ${api.defaults.baseURL || ''}${error.config?.url || ''}. Check backend connectivity or VITE_API_URL configuration.`);
    } else {
      console.error('[API Setup Error]', error.message);
    }
    return Promise.reject(error);
  }
);

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
      'Content-Type': undefined, // Let Axios/browser automatically set multipart boundary
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
