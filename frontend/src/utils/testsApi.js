import { apiRequest } from "./apiClient.js";

export const testsApi = {
  /**
   * Get random questions for a test
   * @param {number} lessonId - Lesson ID
   * @param {number} count - Number of questions (10-15)
   * @returns {Promise} Response with questions
   */
  getRandomQuestions: async (lessonId, count = 12) => {
    return apiRequest(`/tests/lessons/${lessonId}/questions?count=${count}`, {
      method: "GET",
    });
  },

  /**
   * Submit completed test
   * @param {number} lessonId - Lesson ID
   * @param {Object} testData - Test data with attempts, time_taken_seconds, started_at
   * @returns {Promise} Response with test result
   */
  submitTest: async (lessonId, testData) => {
    return apiRequest(`/tests/lessons/${lessonId}/submit`, {
      method: "POST",
      body: {
        lesson_id: lessonId,
        attempts: testData.attempts || [],
        time_taken_seconds: testData.time_taken_seconds || 0,
        started_at: testData.started_at,
      },
    });
  },

  /**
   * Get test results for a lesson
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Response with test results
   */
  getTestResults: async (lessonId) => {
    return apiRequest(`/tests/lessons/${lessonId}/results`, {
      method: "GET",
    });
  },
};

