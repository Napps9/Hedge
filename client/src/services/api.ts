import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  getAuthUrl: () => apiClient.get('/auth/url'),
  handleCallback: (code: string) => apiClient.post('/auth/callback', { code }),
  getCurrentUser: () => apiClient.get('/auth/me'),
  logout: () => {
    localStorage.removeItem('token');
    return Promise.resolve();
  },
};

export const recommendationAPI = {
  getRecommendations: (query: string) =>
    apiClient.post('/api/recommendations', { query }),
  getConversationHistory: () =>
    apiClient.get('/api/conversations'),
};

export default apiClient;
