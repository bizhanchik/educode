import apiRequest from "./apiClient.js";

export const fetchSubjects = async ({ page = 1, size = 50 } = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  return apiRequest(`/subjects?${params.toString()}`);
};

export const fetchSubjectWithLessons = async (subjectId) => {
  if (!subjectId) {
    throw new Error("subjectId is required");
  }
  return apiRequest(`/subjects/${subjectId}?include_lessons=true`);
};

export const fetchLessons = async ({
  page = 1,
  size = 50,
  subjectId,
  teacherId,
} = {}) => {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
  });
  if (subjectId) params.append("subject_id", String(subjectId));
  if (teacherId) params.append("teacher_id", String(teacherId));
  return apiRequest(`/lessons?${params.toString()}`);
};

export const createLesson = async (payload) => {
  if (!payload?.subject_id) {
    throw new Error("subject_id is required");
  }
  console.log('[curriculumApi] Creating lesson with payload:', payload);
  console.log('[curriculumApi] Endpoint: /lessons, method: POST');
  try {
    const response = await apiRequest("/lessons", {
    method: "POST",
      body: payload,
    });
    console.log('[curriculumApi] Lesson created successfully:', response);
    return response;
  } catch (error) {
    console.error('[curriculumApi] Error creating lesson:', error);
    console.error('[curriculumApi] Error status:', error.status);
    console.error('[curriculumApi] Error message:', error.message);
    throw error;
  }
};

export const updateLesson = async (lessonId, payload) => {
  if (!lessonId) throw new Error("lessonId is required");
  return apiRequest(`/lessons/${lessonId}`, {
    method: "PUT",
    body: payload,
  });
};

export const deleteLesson = async (lessonId) => {
  if (!lessonId) throw new Error("lessonId is required");
  return apiRequest(`/lessons/${lessonId}`, {
    method: "DELETE",
  });
};

export const createLessonMaterial = async (lessonId, formData) => {
  if (!lessonId) throw new Error("lessonId is required");
  return apiRequest(`/lessons/${lessonId}/materials`, {
    method: "POST",
    body: formData,
  });
};

export const createSubject = async (data) => {
  return apiRequest("/subjects", {
    method: "POST",
    body: data,
  });
};

export const updateSubject = async (subjectId, data) => {
  return apiRequest(`/subjects/${subjectId}`, {
    method: "PUT",
    body: data,
  });
};

export const uploadSubjectImage = async (subjectId, imageFile) => {
  if (!subjectId) throw new Error("subjectId is required");
  if (!imageFile) throw new Error("imageFile is required");
  
  console.log('[curriculumApi] Uploading image for subject:', subjectId, 'File:', imageFile.name, imageFile.size, imageFile.type);
  
  const formData = new FormData();
  formData.append("image", imageFile);
  
  console.log('[curriculumApi] FormData created, calling API:', `/subjects/${subjectId}/image`);
  
  try {
    const response = await apiRequest(`/subjects/${subjectId}/image`, {
      method: "POST",
      body: formData,
    });
    console.log('[curriculumApi] Image upload response:', response);
    return response;
  } catch (error) {
    console.error('[curriculumApi] Image upload error:', error);
    console.error('[curriculumApi] Error status:', error.status);
    console.error('[curriculumApi] Error message:', error.message);
    throw error;
  }
};

export const deleteSubject = async (subjectId, password) => {
  return apiRequest(`/subjects/${subjectId}`, {
    method: "DELETE",
    body: { password },
  });
};

// Questions API
export const fetchLessonQuestions = async (lessonId) => {
  if (!lessonId) throw new Error("lessonId is required");
  console.log('[curriculumApi] Fetching all questions for lesson:', lessonId);
  try {
    const response = await apiRequest(`/lessons/${lessonId}/questions`);
    console.log('[curriculumApi] Questions fetched successfully:', response);
    return response;
  } catch (error) {
    console.error('[curriculumApi] Error fetching questions:', error);
    throw error;
  }
};

export const createQuestion = async (lessonId, questionData) => {
  if (!lessonId) throw new Error("lessonId is required");
  console.log('[curriculumApi] Creating question:', { lessonId, questionData });
  console.log('[curriculumApi] Endpoint:', `/lessons/${lessonId}/questions`);
  try {
    const response = await apiRequest(`/lessons/${lessonId}/questions`, {
    method: "POST",
    body: questionData,
  });
    console.log('[curriculumApi] Question created successfully:', response);
    return response;
  } catch (error) {
    console.error('[curriculumApi] Error creating question:', error);
    console.error('[curriculumApi] Error status:', error.status);
    console.error('[curriculumApi] Error message:', error.message);
    console.error('[curriculumApi] Error payload:', error.payload);
    throw error;
  }
};

export const updateQuestion = async (questionId, questionData) => {
  if (!questionId) throw new Error("questionId is required");
  return apiRequest(`/questions/${questionId}`, {
    method: "PUT",
    body: questionData,
  });
};

export const deleteQuestion = async (questionId) => {
  if (!questionId) throw new Error("questionId is required");
  return apiRequest(`/questions/${questionId}`, {
    method: "DELETE",
  });
};

export const generateQuestionsFromMaterials = async (lessonId, count = 10) => {
  if (!lessonId) throw new Error("lessonId is required");
  return apiRequest(`/lessons/${lessonId}/generate-questions`, {
    method: "POST",
    body: { count },
  });
};

export const generatePracticeTasksFromMaterials = async (lessonId, count = 30) => {
  if (!lessonId) throw new Error("lessonId is required");
  console.log('[curriculumApi] Generating practice tasks:', { lessonId, count });
  try {
    const response = await apiRequest(`/lessons/${lessonId}/generate-practice-tasks`, {
      method: "POST",
      body: { count },
    });
    console.log('[curriculumApi] Practice tasks generated successfully:', response);
    return response;
  } catch (error) {
    console.error('[curriculumApi] Error generating practice tasks:', error);
    throw error;
  }
};
