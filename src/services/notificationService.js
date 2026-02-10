import api from './api';

export const notificationService = {
  // Get notifications
  getNotifications: (params = {}) => {
    return api.get('/notifications', { params });
  },

  // Get unread count
  getUnreadCount: () => {
    return api.get('/notifications/unread-count');
  },

  // Mark as read
  markAsRead: (id) => {
    return api.put(`/notifications/${id}/read`);
  }
};









