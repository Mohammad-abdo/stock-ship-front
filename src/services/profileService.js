import api from './api';

export const profileService = {
  // Client Profile
  getClientProfile: () => {
    return api.get('/auth/me');
  },

  updateClientProfile: (data) => {
    return api.put('/auth/me', data);
  },

  // Trader Profile (if user is trader)
  getTraderProfile: () => {
    return api.get('/traders/:id', {
      // This will be handled by checking userType and using the correct endpoint
    });
  },

  // Get trader by ID (public)
  // Mediation routes are mounted at root level in /api, so path is /api/traders/:id/public
  getTraderById: (id) => {
    console.log("📡 Calling getTraderById with ID:", id);
    console.log("📡 Full URL will be:", `/api/traders/${id}/public`);
    return api.get(`/traders/${id}/public`);
  },

  // Get trader offers
  getTraderOffers: (id, params = {}) => {
    console.log("📡 Calling getTraderOffers with ID:", id, "params:", params);
    console.log("📡 Full URL will be:", `/api/traders/${id}/offers/public`);
    return api.get(`/traders/${id}/offers/public`, { params });
  },

  // Check if client has linked trader
  checkLinkedTrader: () => {
    return api.get('/traders/check-linked');
  }
};









