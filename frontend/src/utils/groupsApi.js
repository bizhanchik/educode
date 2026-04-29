/**
 * Groups API Client
 *
 * Handles group management operations for EduCode frontend.
 * Provides CRUD operations for student groups.
 */

import { apiRequest } from './apiClient.js';

export const groupsApi = {
  /**
   * Get paginated list of groups
   * @param {Object} params - Query parameters {page, size}
   * @returns {Promise} Promise resolving to groups list with pagination info
   */
  getGroups: (params = {}) => {
    const queryParams = new URLSearchParams();
    // Обрабатываем параметры явно, чтобы boolean правильно преобразовался
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== undefined && value !== null) {
        if (typeof value === 'boolean') {
          queryParams.append(key, value.toString());
        } else {
          queryParams.append(key, String(value));
        }
      }
    });
    const queryString = queryParams.toString();
    console.log('[groupsApi] getGroups query string:', queryString);
    return apiRequest(`/groups?${queryString}`);
  },

  /**
   * Get a single group by ID with optional users
   * @param {number} groupId - Group ID
   * @param {boolean} includeUsers - Whether to include group members
   * @returns {Promise} Promise resolving to group data
   */
  getGroup: (groupId, includeUsers = false) => {
    return apiRequest(`/groups/${groupId}?include_users=${includeUsers}`);
  },

  /**
   * Create a new group
   * @param {Object} data - Group data {name}
   * @returns {Promise} Promise resolving to created group
   */
  createGroup: (data) => {
    return apiRequest('/groups', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing group
   * @param {number} groupId - Group ID
   * @param {Object} data - Updated group data
   * @returns {Promise} Promise resolving to updated group
   */
  updateGroup: (groupId, data) => {
    return apiRequest(`/groups/${groupId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Delete a group
   * @param {number} groupId - Group ID
   * @returns {Promise} Promise resolving to success confirmation
   */
  deleteGroup: (groupId) => {
    return apiRequest(`/groups/${groupId}`, {
      method: 'DELETE',
    });
  },
};
