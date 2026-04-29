import { apiRequest } from "./apiClient.js";

export const lessonProgressApi = {
  /**
   * Get lesson status (test/practice scores, lock status)
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Response with lesson status
   */
  getLessonStatus: async (lessonId) => {
    return apiRequest(`/lessons/${lessonId}/status`, {
      method: "GET",
    });
  },

  /**
   * Get next lesson ID if current lesson is passed
   * @param {number} lessonId - Current lesson ID
   * @returns {Promise} Response with next lesson ID
   */
  getNextLesson: async (lessonId) => {
    return apiRequest(`/lessons/${lessonId}/next`, {
      method: "GET",
    });
  },
};

