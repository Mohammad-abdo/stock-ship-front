import api from './api';

export const categoryService = {
  // Get all categories
  getCategories: (params = {}) => {
    return api.get('/categories', { params });
  },

  // Get featured categories
  getFeaturedCategories: () => {
    return api.get('/categories', { params: { featured: 'true' } });
  },

  // Get category by ID
  getCategoryById: (id) => {
    return api.get(`/categories/${id}`);
  },

  // Get category tree
  getCategoryTree: () => {
    return api.get('/categories/tree');
  },

  // Get subcategories
  getSubCategories: (id) => {
    return api.get(`/categories/${id}/subcategories`);
  },

  // Get products in category
  getCategoryProducts: (id, params = {}) => {
    return api.get(`/categories/${id}/products`, { params });
  },
};









