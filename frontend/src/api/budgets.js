import api from './client';

export const budgetsApi = {
  getBudgets: async (month = '') => {
    const params = month ? { month } : {};
    const res = await api.get('/budgets/', { params });
    return res.data.results || res.data;
  },

  getSummary: async (month = '') => {
    const params = month ? { month } : {};
    const res = await api.get('/budgets/summary/', { params });
    return res.data;
  },

  createBudget: async (data) => {
    const res = await api.post('/budgets/', data);
    return res.data;
  },

  updateBudget: async (id, data) => {
    const res = await api.patch(`/budgets/${id}/`, data);
    return res.data;
  },

  deleteBudget: async (id) => {
    const res = await api.delete(`/budgets/${id}/`);
    return res.data;
  },
};
