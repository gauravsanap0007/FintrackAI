import api from './client';

export const transactionsApi = {
  getTransactions: async (params = {}) => {
    const res = await api.get('/transactions/', { params });
    return res.data;
  },

  getSummary: async (params = {}) => {
    const res = await api.get('/transactions/summary/', { params });
    return res.data;
  },

  createTransaction: async (data) => {
    const res = await api.post('/transactions/', data);
    return res.data;
  },

  updateTransaction: async (id, data) => {
    const res = await api.patch(`/transactions/${id}/`, data);
    return res.data;
  },

  deleteTransaction: async (id) => {
    const res = await api.delete(`/transactions/${id}/`);
    return res.data;
  },
};
