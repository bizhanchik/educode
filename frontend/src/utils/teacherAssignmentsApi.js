/**
 * API utilities for teacher-subject-group assignments
 * Used by admins to assign teachers to subjects in specific groups
 */

import apiRequest from './apiClient.js';

const BASE_URL = '/teacher-assignments';

/**
 * Create a new teacher assignment
 */
export async function createTeacherAssignment(data) {
  return apiRequest(`${BASE_URL}/`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Get paginated teacher assignments with optional filters
 */
export async function getTeacherAssignments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.teacher_id) params.append('teacher_id', filters.teacher_id);
  if (filters.subject_id) params.append('subject_id', filters.subject_id);
  if (filters.group_id) params.append('group_id', filters.group_id);
  if (filters.page) params.append('page', filters.page);
  if (filters.size) params.append('size', filters.size);

  return apiRequest(`${BASE_URL}/?${params.toString()}`);
}

/**
 * Get subjects assigned to a teacher in a specific group
 */
export async function getTeacherSubjectsByGroup(teacherId, groupId) {
  return apiRequest(`${BASE_URL}/teacher/${teacherId}/subjects?group_id=${groupId}`);
}

/**
 * Get groups assigned to a teacher for a specific subject
 */
export async function getTeacherGroupsBySubject(teacherId, subjectId) {
  return apiRequest(`${BASE_URL}/teacher/${teacherId}/groups?subject_id=${subjectId}`);
}

/**
 * Delete a teacher assignment
 */
export async function deleteTeacherAssignment(assignmentId) {
  return apiRequest(`${BASE_URL}/${assignmentId}`, {
    method: 'DELETE',
  });
}

/**
 * Bulk delete teacher assignments
 */
export async function bulkDeleteTeacherAssignments(teacherId, filters = {}) {
  const params = new URLSearchParams();

  if (filters.subject_id) params.append('subject_id', filters.subject_id);
  if (filters.group_id) params.append('group_id', filters.group_id);

  return apiRequest(`${BASE_URL}/teacher/${teacherId}/bulk?${params.toString()}`, {
    method: 'DELETE',
  });
}
