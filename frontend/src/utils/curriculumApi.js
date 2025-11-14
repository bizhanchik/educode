import apiRequest from './apiClient.js';

export const fetchSubjects = async ({ page = 1, size = 50 } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  return apiRequest(`/subjects?${params.toString()}`);
};

export const fetchSubjectWithLessons = async (subjectId) => {
  if (!subjectId) {
    throw new Error('subjectId is required');
  }
  return apiRequest(`/subjects/${subjectId}?include_lessons=true`);
};

export const fetchLessons = async ({ page = 1, size = 50, subjectId, teacherId } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (subjectId) params.append('subject_id', String(subjectId));
  if (teacherId) params.append('teacher_id', String(teacherId));
  return apiRequest(`/lessons?${params.toString()}`);
};

export const createLesson = async (payload) => {
  if (!payload?.subject_id) {
    throw new Error('subject_id is required');
  }
  return apiRequest('/lessons', {
    method: 'POST',
    body: payload
  });
};

export const createLessonMaterial = async (lessonId, formData) => {
  if (!lessonId) throw new Error('lessonId is required');
  return apiRequest(`/lessons/${lessonId}/materials`, {
    method: 'POST',
    body: formData
  });
};
