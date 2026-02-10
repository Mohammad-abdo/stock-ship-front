import api from './api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const dealService = {
  // Get all deals (with optional filters like traderId)
  getDeals: async (params = {}) => {
    try {
      const response = await api.get('/deals', { params });
      return response;
    } catch (error) {
      console.error('Error fetching deals:', error);
      throw error;
    }
  },

  // Get single deal by ID
  getDealById: async (id) => {
    try {
      const response = await api.get(`/deals/${id}`);
      return response;
    } catch (error) {
      console.error(`Error fetching deal ${id}:`, error);
      throw error;
    }
  },

  // Create a new deal (Make Request flow usually handles this via offer)
  createDeal: async (data) => {
    try {
      const response = await api.post('/deals', data);
      return response;
    } catch (error) {
      console.error('Error creating deal:', error);
      throw error;
    }
  },

  // Add items to a deal
  addDealItems: async (dealId, items) => {
    try {
      const response = await api.post(`/deals/${dealId}/items`, { items });
      return response;
    } catch (error) {
      console.error('Error adding deal items:', error);
      throw error;
    }
  },

  // Negotiation methods
  // Get negotiation messages for a deal
  getNegotiationMessages: async (dealId, params = {}) => {
    try {
      const response = await api.get(`/deals/${dealId}/negotiations`, { params });
      return response;
    } catch (error) {
      console.error('Error fetching negotiation messages:', error);
      throw error;
    }
  },

  // Send a negotiation message
  sendNegotiationMessage: async (dealId, data) => {
    try {
      const response = await api.post(`/deals/${dealId}/negotiations`, data);
      return response;
    } catch (error) {
      console.error('Error sending negotiation message:', error);
      throw error;
    }
  },

  // Mark messages as read
  markMessagesAsRead: async (dealId) => {
    try {
      const response = await api.put(`/deals/${dealId}/negotiations/read`);
      return response;
    } catch (error) {
      console.error('Error marking messages as read:', error);
      throw error;
    }
  },

  // Approve a deal
  approveDeal: async (dealId, data = {}) => {
    try {
      const response = await api.put(`/traders/deals/${dealId}/approve`, data);
      return response;
    } catch (error) {
      console.error('Error approving deal:', error);
      throw error;
    }
  },

  // Reject a deal
  rejectDeal: async (dealId) => {
    try {
      const response = await api.put(`/deals/${dealId}/reject`);
      return response;
    } catch (error) {
      console.error('Error rejecting deal:', error);
      throw error;
    }
  },

  // Client accepts price quote (deal → APPROVED, then proceed to payment)
  clientAcceptDeal: async (dealId) => {
    const response = await api.put(`/deals/${dealId}/client-accept`);
    return response;
  },

  // Client rejects price quote
  clientRejectDeal: async (dealId, reason) => {
    const response = await api.put(`/deals/${dealId}/client-reject`, reason ? { reason } : {});
    return response;
  },

  // Client cancels the deal
  clientCancelDeal: async (dealId, reason) => {
    const response = await api.put(`/deals/${dealId}/client-cancel`, reason ? { reason } : {});
    return response;
  },

  // Process payment for a deal (client) - use fetch for FormData so browser sets multipart/form-data with boundary (axios default Content-Type breaks file upload)
  processDealPayment: async (dealId, data) => {
    const token = localStorage.getItem('token');
    if (!token) {
      const err = new Error('Unauthorized');
      err.response = { status: 401, data: { message: 'Please log in first.' } };
      throw err;
    }
    if (!(data instanceof FormData)) {
      return api.post(`/deals/${dealId}/payments`, data);
    }
    const url = `${API_URL}/deals/${dealId}/payments`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        // Do NOT set Content-Type - browser sets multipart/form-data with boundary
      },
      body: data,
    });
    if (!res.ok) {
      const err = new Error(res.statusText || `Request failed with status code ${res.status}`);
      err.response = {
        status: res.status,
        data: await res.json().catch(() => ({ message: res.statusText })),
      };
      throw err;
    }
    const json = await res.json().catch(() => ({}));
    return { data: json };
  }
};
