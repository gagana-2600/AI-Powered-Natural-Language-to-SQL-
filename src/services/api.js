import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('nl_sql_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clean error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token on 401 if expired
      // localStorage.removeItem('nl_sql_token');
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
};

export const schemaAPI = {
  getSchema: (refresh = false) => api.get(`/schema?refresh=${refresh}`),
};

export const queryAPI = {
  generate: (question) => api.post('/query/generate', { question }),
  validate: (sql) => api.post('/query/validate', { sql }),
  execute: (sql, question = null) => api.post('/query/execute', { sql, question }),
  explain: (sql) => api.post('/query/explain', { sql }),
  correct: (question, sql, error) => api.post('/query/correct', { question, sql, error }),
  getHistory: () => api.get('/query/history'),
  deleteHistory: (id) => api.delete(`/query/history/${id}`),
  getConfig: () => api.get('/query/config'),
  updateConfig: (data) => api.post('/query/config', data),
};

export const analyticsAPI = {
  getAnalytics: () => api.get('/analytics'),
};

export const filesAPI = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
  list: () => api.get('/files'),
  get: (fileId) => api.get(`/files/${fileId}`),
  delete: (fileId) => api.delete(`/files/${fileId}`),
  chat: (fileId, message) => api.post(`/files/${fileId}/chat`, { message }),
  getMessages: (fileId) => api.get(`/files/${fileId}/messages`),
  clearMessages: (fileId) => api.delete(`/files/${fileId}/messages`),
};

export default api;

