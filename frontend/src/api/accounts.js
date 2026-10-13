import api from './client';

export const accountsApi = {
  getAccounts: async () => {
    const res = await api.get('/accounts/');
    return res.data.results || res.data;
  },

  getSummary: async () => {
    const res = await api.get('/accounts/summary/');
    return res.data;
  },

  createAccount: async (data) => {
    const res = await api.post('/accounts/', data);
    return res.data;
  },

  updateAccount: async (id, data) => {
    const res = await api.patch(`/accounts/${id}/`, data);
    return res.data;
  },

  deleteAccount: async (id) => {
    const res = await api.delete(`/accounts/${id}/`);
    return res.data;
  },
};
