import { apiRequest } from "./apiClient.js";

export const practiceApi = {
  /**
   * Execute code in Docker sandbox
   * @param {string} code - Code to execute
   * @param {string} language - Programming language (default: "python")
   * @returns {Promise} Response with stdout, stderr, exit_code
   */
  executeCode: async (code, language = "python") => {
    return apiRequest("/code/execute", {
      method: "POST",
      body: { code, language },
    });
  },

  /**
   * Submit practice code for evaluation
   * @param {number} lessonId - Lesson ID
   * @param {Object} practiceData - Practice data with task_id, code, execution_result
   * @returns {Promise} Response with practice result
   */
  submitPractice: async (lessonId, practiceData) => {
    return apiRequest(`/code/lessons/${lessonId}/practice/submit`, {
      method: "POST",
      body: {
        lesson_id: lessonId,
        ...practiceData,
      },
    });
  },

  /**
   * Get practice results for a lesson
   * @param {number} lessonId - Lesson ID
   * @returns {Promise} Response with practice results
   */
  getPracticeResults: async (lessonId) => {
    return apiRequest(`/code/lessons/${lessonId}/practice/results`, {
      method: "GET",
    });
  },

  /**
   * Run code against task test cases (LeetCode-style)
   * @param {number} taskId - Task ID
   * @param {string} code - Code to test
   * @param {string} language - Programming language (default: "python")
   * @returns {Promise} Response with test results including verdict
   */
  runTests: async (taskId, code, language = "python") => {
    return apiRequest(`/code/tasks/${taskId}/run-tests`, {
      method: "POST",
      body: { code, language },
    });
  },
};

