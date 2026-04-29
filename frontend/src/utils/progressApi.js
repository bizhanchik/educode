/**
 * Progress API Client
 *
 * Handles lesson progress tracking for EduCode frontend.
 * Tracks student progress through lessons and section completion.
 */

import { apiRequest } from './apiClient.js';

export const progressApi = {
  /**
   * Get progress records with optional filtering
   * @param {Object} params - Query parameters {user_id, lesson_id, page, size}
   * @returns {Promise} Promise resolving to progress records
   */
  getProgress: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/progress?${queryString}`);
  },

  /**
   * Get progress summary for a user across all lessons
   * @param {number} userId - User ID
   * @returns {Promise} Promise resolving to progress summary
   */
  getUserProgress: (userId) => {
    return apiRequest(`/progress/user/${userId}/summary`);
  },

  /**
   * Get progress for a specific user and lesson
   * @param {number} userId - User ID
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Promise resolving to lesson progress
   */
  getLessonProgress: (userId, lessonId) => {
    return apiRequest(`/progress?user_id=${userId}&lesson_id=${lessonId}`);
  },

  /**
   * Create a new progress record
   * @param {Object} data - Progress data {user_id, lesson_id, sections_completed}
   * @returns {Promise} Promise resolving to created progress
   */
  createProgress: (data) => {
    return apiRequest('/progress', {
      method: 'POST',
      body: data,
    });
  },

  /**
   * Update an existing progress record
   * @param {number} progressId - Progress record ID
   * @param {Object} data - Updated progress data {completed, sections_completed, completed_at}
   * @returns {Promise} Promise resolving to updated progress
   */
  updateProgress: (progressId, data) => {
    return apiRequest(`/progress/${progressId}`, {
      method: 'PUT',
      body: data,
    });
  },

  /**
   * Get lesson completion statistics across all students
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Promise resolving to lesson stats
   */
  getLessonStats: (lessonId) => {
    return apiRequest(`/progress/lesson/${lessonId}/stats`);
  },
};
