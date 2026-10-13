import api from './client';

export const aiApi = {
  parseTransaction: async (text) => {
    const res = await api.post('/ai/parse-transaction/', { text });
    return res.data;
  },

  getInsights: async () => {
    const res = await api.get('/ai/insights/');
    return res.data.insights;
  },

  chat: async (query, history = []) => {
    const res = await api.post('/ai/chat/', { query, history });
    return res.data;
  },
};
