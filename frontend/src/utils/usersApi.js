/**
 * Users API Client
 *
 * Handles user management operations for EduCode frontend.
 * Provides CRUD operations for users (admins, teachers, students).
 */

import { apiRequest } from './apiClient.js';

export const usersApi = {
  /**
   * Get paginated list of users with optional filters
   * @param {Object} params - Query parameters {page, size, role, group_id}
   * @returns {Promise} Promise resolving to users list with pagination info
   */
  getUsers: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/users?${queryString}`);
  },

  /**
   * Get a single user by ID
   * @param {number} userId - User ID
   * @returns {Promise} Promise resolving to user data
   */
  getUser: (userId) => {
    return apiRequest(`/users/${userId}`);
  },

  /**
   * Create a new user
   * @param {Object} data - User data {name, email, password, role, group_id}
   * @returns {Promise} Promise resolving to created user
   */
  createUser: (data) => {
    return apiRequest('/users', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing user
   * @param {number} userId - User ID
   * @param {Object} data - Updated user data
   * @returns {Promise} Promise resolving to updated user
   */
  updateUser: (userId, data) => {
    return apiRequest(`/users/${userId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Delete a user
   * @param {number} userId - User ID
   * @returns {Promise} Promise resolving to success confirmation
   */
  deleteUser: (userId) => {
    return apiRequest(`/users/${userId}`, {
      method: 'DELETE',
    });
  },
};
