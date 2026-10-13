import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach access token to every outgoing request
api.interceptors.request.use(
  (config) => {
    const tokens = JSON.parse(localStorage.getItem('fintrack_tokens') || 'null');
    if (tokens?.access) {
      config.headers.Authorization = `Bearer ${tokens.access}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept 401s and attempt automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const tokens = JSON.parse(localStorage.getItem('fintrack_tokens') || 'null');

      if (tokens?.refresh) {
        try {
          const res = await axios.post('/api/auth/refresh/', { refresh: tokens.refresh });
          const newTokens = { ...tokens, access: res.data.access };
          localStorage.setItem('fintrack_tokens', JSON.stringify(newTokens));
          originalRequest.headers.Authorization = `Bearer ${res.data.access}`;
          return api(originalRequest);
        } catch (refreshErr) {
          localStorage.removeItem('fintrack_tokens');
          localStorage.removeItem('fintrack_user');
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      } else {
        localStorage.removeItem('fintrack_tokens');
        localStorage.removeItem('fintrack_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
