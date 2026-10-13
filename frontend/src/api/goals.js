import api from './client';

export const goalsApi = {
  getGoals: async (completed = null) => {
    const params = completed !== null ? { completed } : {};
    const res = await api.get('/goals/', { params });
    return res.data.results || res.data;
  },

  getSummary: async () => {
    const res = await api.get('/goals/summary/');
    return res.data;
  },

  createGoal: async (data) => {
    const res = await api.post('/goals/', data);
    return res.data;
  },

  updateGoal: async (id, data) => {
    const res = await api.patch(`/goals/${id}/`, data);
    return res.data;
  },

  deleteGoal: async (id) => {
    const res = await api.delete(`/goals/${id}/`);
    return res.data;
  },

  contribute: async (id, amount) => {
    const res = await api.post(`/goals/${id}/contribute/`, { amount });
    return res.data;
  },
};
