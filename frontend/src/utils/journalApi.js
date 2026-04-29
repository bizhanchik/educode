/**
 * Journal API Client
 *
 * Handles journal entry management for EduCode frontend.
 * Tracks student learning analytics and lesson performance.
 */

import { apiRequest } from './apiClient.js';

export const journalApi = {
  /**
   * Get journal entries with optional filtering
   * @param {Object} params - Query parameters {user_id, lesson_id, page, size}
   * @returns {Promise} Promise resolving to journal entries
   */
  getEntries: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/journal?${queryString}`);
  },

  /**
   * Get journal entry for a specific user and lesson
   * @param {number} userId - User ID
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Promise resolving to journal entry
   */
  getEntry: (userId, lessonId) => {
    return apiRequest(`/journal?user_id=${userId}&lesson_id=${lessonId}`);
  },

  /**
   * Create a new journal entry
   * @param {Object} data - Journal data {user_id, lesson_id, started_at, completed_at, test_score, practice_score, average_score, notes}
   * @returns {Promise} Promise resolving to created journal entry
   */
  createEntry: (data) => {
    return apiRequest('/journal', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing journal entry
   * @param {number} entryId - Journal entry ID
   * @param {Object} data - Updated journal data
   * @returns {Promise} Promise resolving to updated journal entry
   */
  updateEntry: (entryId, data) => {
    return apiRequest(`/journal/${entryId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Get all journal entries for a user in a specific course
   * @param {number} userId - User ID
   * @param {number} courseId - Course/Subject ID
   * @returns {Promise} Promise resolving to course journal with statistics
   */
  getCourseJournal: (userId, courseId) => {
    return apiRequest(`/journal/user/${userId}/course/${courseId}`);
  },

  /**
   * Get lesson statistics across all students (teacher view)
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Promise resolving to lesson statistics
   */
  getLessonStats: (lessonId) => {
    return apiRequest(`/journal/lesson/${lessonId}/stats`);
  },
};
