

import apiRequest from './apiClient.js';

const BASE_URL = '/lesson-assignments';

export async function createLessonAssignment(data) {
  return apiRequest(`${BASE_URL}/`, {
    method: 'POST',
    body: data,
  });
}

export async function bulkCreateLessonAssignments(data) {
  return apiRequest(`${BASE_URL}/bulk`, {
    method: 'POST',
    body: data,
  });
}

export async function getLessonAssignments(filters = {}) {
  const params = new URLSearchParams();

  if (filters.lesson_id) params.append('lesson_id', filters.lesson_id);
  if (filters.group_id) params.append('group_id', filters.group_id);
  if (filters.page) params.append('page', filters.page);
  if (filters.size) params.append('size', filters.size);

  return apiRequest(`${BASE_URL}/?${params.toString()}`);
}

export async function getActiveAssignmentsForGroup(groupId) {
  return apiRequest(`${BASE_URL}/group/${groupId}/active`);
}


export async function updateLessonAssignment(assignmentId, deadlineAt) {
  return apiRequest(`${BASE_URL}/${assignmentId}`, {
    method: 'PUT',
    body: { deadline_at: deadlineAt },
  });
}

export async function deleteLessonAssignment(assignmentId) {
  return apiRequest(`${BASE_URL}/${assignmentId}`, {
    method: 'DELETE',
  });
}
