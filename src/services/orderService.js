import api from './api';

export const orderService = {
  // Get my orders
  getMyOrders: (params = {}) => {
    return api.get('/orders', { params });
  },

  // Get order by ID
  getOrderById: (id) => {
    return api.get(`/orders/${id}`);
  },

  // Get order tracking
  getOrderTracking: (id) => {
    return api.get(`/orders/my-orders/${id}/tracking`);
  },

  // Create order
  createOrder: (data) => {
    return api.post('/orders', data);
  }
};







