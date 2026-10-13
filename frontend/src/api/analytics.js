import api from './client';

export const analyticsApi = {
  getOverview: async (months = 6) => {
    const res = await api.get('/analytics/overview/', { params: { months } });
    return res.data;
  },

  getMonthlyTrends: async (months = 6) => {
    const res = await api.get('/analytics/monthly-trends/', { params: { months } });
    return res.data.trends;
  },

  getCategoryBreakdown: async (type = 'EXPENSE', startDate = '', endDate = '') => {
    const params = { type };
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    const res = await api.get('/analytics/category-breakdown/', { params });
    return res.data;
  },
};
