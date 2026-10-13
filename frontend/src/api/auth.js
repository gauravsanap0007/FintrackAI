import api from './client';

export const authApi = {
  login: async (email, password) => {
    const res = await api.post('/auth/login/', { email, password });
    return res.data;
  },

  register: async (email, username, password, passwordConfirm) => {
    const res = await api.post('/auth/register/', {
      email,
      username,
      password,
      password_confirm: passwordConfirm,
    });
    return res.data;
  },

  getProfile: async () => {
    const res = await api.get('/auth/me/');
    return res.data;
  },

  updateProfile: async (data) => {
    const res = await api.patch('/auth/me/', data);
    return res.data;
  },

  logout: async (refreshToken) => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout/', { refresh: refreshToken });
      }
    } finally {
      localStorage.removeItem('fintrack_tokens');
      localStorage.removeItem('fintrack_user');
    }
  },
};
