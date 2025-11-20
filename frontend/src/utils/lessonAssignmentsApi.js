/**
 * API utilities for lesson assignments
 * Used by teachers to assign lessons to groups with deadlines
 */

import apiRequest from './apiClient.js';

const BASE_URL = '/lesson-assignments';

/**
 * Create a new lesson assignment
 */
export async function createLessonAssignment(data) {
  return apiRequest(`${BASE_URL}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Bulk create lesson assignments to multiple groups
 */
export async function bulkCreateLessonAssignments(data) {
  return apiRequest(`${BASE_URL}/bulk`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get paginated lesson assignments with optional filters
 */
export async function getLessonAssignments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.lesson_id) params.append('lesson_id', filters.lesson_id);
  if (filters.group_id) params.append('group_id', filters.group_id);
  if (filters.page) params.append('page', filters.page);
  if (filters.size) params.append('size', filters.size);

  return apiRequest(`${BASE_URL}/?${params.toString()}`);
}

/**
 * Get active assignments for a specific group
 */
export async function getActiveAssignmentsForGroup(groupId) {
  return apiRequest(`${BASE_URL}/group/${groupId}/active`);
}

/**
 * Update a lesson assignment's deadline
 */
export async function updateLessonAssignment(assignmentId, deadlineAt) {
  return apiRequest(`${BASE_URL}/${assignmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ deadline_at: deadlineAt }),
  });
}

/**
 * Delete a lesson assignment
 */
export async function deleteLessonAssignment(assignmentId) {
  return apiRequest(`${BASE_URL}/${assignmentId}`, {
    method: 'DELETE',
  });
}
