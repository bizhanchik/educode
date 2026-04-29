/**
 * Notifications API Client
 *
 * Handles user notifications for EduCode frontend.
 * Manages notifications for grades, submissions, and system events.
 */

import { apiRequest } from './apiClient.js';

export const notificationsApi = {
  /**
   * Get user notifications with optional filtering
   * @param {number} userId - User ID
   * @param {boolean|null} readStatus - Filter by read status (true/false/null for all)
   * @param {Object} params - Additional params {page, size}
   * @returns {Promise} Promise resolving to notifications list
   */
  getNotifications: (userId, readStatus = null, params = {}) => {
    const queryParams = { user_id: userId, ...params };
    if (readStatus !== null) {
      queryParams.read = readStatus;
    }
    const queryString = new URLSearchParams(queryParams).toString();
    return apiRequest(`/notifications?${queryString}`);
  },

  /**
   * Create a new notification
   * @param {Object} data - Notification data {user_id, type, title, message, related_id, related_type}
   * @returns {Promise} Promise resolving to created notification
   */
  createNotification: (data) => {
    return apiRequest('/notifications', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Mark a notification as read
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Promise resolving to updated notification
   */
  markAsRead: (notificationId) => {
    return apiRequest(`/notifications/${notificationId}/read`, {
      method: 'PUT',
    });
  },

  /**
   * Delete a notification
   * @param {number} notificationId - Notification ID
   * @returns {Promise} Promise resolving to success confirmation
   */
  deleteNotification: (notificationId) => {
    return apiRequest(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get count of unread notifications for a user
   * @param {number} userId - User ID
   * @returns {Promise} Promise resolving to unread count
   */
  getUnreadCount: (userId) => {
    return apiRequest(`/notifications/user/${userId}/unread-count`);
  },
};
