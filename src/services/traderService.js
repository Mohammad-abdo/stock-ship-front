import api from './api';

export const traderService = {
  // Get trader profile by ID (typically current user's trader ID)
  getTraderById: async (id) => {
    try {
      // Typically /traders/:id or /traders/me
      // Using the mediation route or direct route depending on backend exposure
      // Providing exact ID as per previous dashboard logic
      const response = await api.get(`/traders/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching trader ${id}:`, error);
      throw error;
    }
  },

  // Get current trader stats (if separate endpoint exists, otherwise commonly included in getTraderById)
  getDashboardStats: async () => {
    try {
      const response = await api.get('/traders/stats');
      return response;
    } catch (error) {
      console.error('Error fetching trader stats:', error);
      throw error;
    }
  }
};
