import axios from 'axios';

export const RENDER_BACKEND_URL = 'https://sentimend-analysis.onrender.com';

/**
 * Dynamically resolves the API base URL.
 * Priority:
 * 1. In production (e.g. deployed on Vercel, remote host):
 *    - Never connect to localhost or 127.0.0.1.
 *    - Use explicit remote URL or '/api' (proxied via vercel.json rewrite to Render).
 * 2. In local development:
 *    - Use '/api' (proxied via Vite dev server) or local backend URL.
 */
export const getApiBaseUrl = () => {
  const isBrowser = typeof window !== 'undefined';
  const isLocalhost = isBrowser && (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0'
  );

  const rawEnv = (import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL || '').trim();

  // On production domains (e.g. *.vercel.app, live sites):
  if (isBrowser && !isLocalhost) {
    // Strictly sanitize: ignore any config that points to localhost/127.0.0.1
    if (rawEnv && !rawEnv.includes('localhost') && !rawEnv.includes('127.0.0.1') && !rawEnv.includes('0.0.0.0')) {
      const clean = rawEnv.replace(/\/+$/, '');
      if (clean.startsWith('/')) {
        return clean;
      }
      return clean.endsWith('/api') ? clean : `${clean}/api`;
    }
    // Default in Vercel production: '/api' transparently rewrites to Render backend via vercel.json
    return '/api';
  }

  // Local development or SSR:
  if (rawEnv) {
    const clean = rawEnv.replace(/\/+$/, '');
    if (clean.startsWith('/')) {
      return clean;
    }
    return clean.endsWith('/api') ? clean : `${clean}/api`;
  }

  if (isLocalhost) {
    return '/api';
  }

  return 'http://127.0.0.1:8000/api';
};

export const API_BASE_URL = getApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes to accommodate Render free-tier cold-starts
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor with auto-fallback for Vercel proxy timeouts / errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    const isProxyTimeout = error.response && [500, 502, 503, 504].includes(error.response.status);
    const isNetworkError = !error.response && (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error'));

    // If using relative '/api' on a live deployed domain (e.g. Vercel) and the proxy failed:
    // Retry ONCE directly against the live Render backend URL
    if (
      config &&
      !config._isRetry &&
      (isProxyTimeout || isNetworkError) &&
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1' &&
      (api.defaults.baseURL === '/api' || !api.defaults.baseURL.startsWith('http'))
    ) {
      config._isRetry = true;
      const targetPath = config.url?.startsWith('/') ? config.url : `/${config.url || ''}`;
      const directUrl = `${RENDER_BACKEND_URL}/api${targetPath}`;
      console.warn(`[Vercel Proxy Fallback] Request failed (${error.response?.status || 'Network Error'}). Retrying directly against ${directUrl}...`);
      
      try {
        const retryResponse = await axios({
          ...config,
          url: directUrl,
          baseURL: '',
          timeout: 300000,
        });
        return retryResponse;
      } catch (retryError) {
        console.error('[Direct Backend Fallback Error]', retryError);
        return Promise.reject(retryError);
      }
    }

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

export const clearPredictions = async () => {
  const response = await api.delete('/predictions');
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
