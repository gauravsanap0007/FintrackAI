import api from './client';

export const categoriesApi = {
  getCategories: async (type = '') => {
    const params = type ? { type } : {};
    const res = await api.get('/categories/', { params });
    return res.data.results || res.data;
  },

  createCategory: async (data) => {
    const res = await api.post('/categories/', data);
    return res.data;
  },

  updateCategory: async (id, data) => {
    const res = await api.patch(`/categories/${id}/`, data);
    return res.data;
  },

  deleteCategory: async (id) => {
    const res = await api.delete(`/categories/${id}/`);
    return res.data;
  },
};
