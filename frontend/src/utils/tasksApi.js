import apiRequest from './apiClient.js';

// ============ TASKS API ============

export const fetchTasks = async ({ page = 1, size = 50, lessonId, language, activeOnly } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (lessonId) params.append('lesson_id', String(lessonId));
  if (language) params.append('language', language);
  if (activeOnly !== undefined) params.append('active_only', String(activeOnly));
  return apiRequest(`/tasks?${params.toString()}`);
};

export const fetchTask = async (taskId, options = {}) => {
  if (!taskId) throw new Error('taskId is required');
  const params = new URLSearchParams();
  if (options.includeSubmissions) params.append('include_submissions', 'true');
  if (options.includeAISolutions) params.append('include_ai_solutions', 'true');
  const query = params.toString();
  return apiRequest(`/tasks/${taskId}${query ? `?${query}` : ''}`);
};

export const createTask = async (payload) => {
  if (!payload?.lesson_id) throw new Error('lesson_id is required');
  if (!payload?.title) throw new Error('title is required');
  if (!payload?.language) throw new Error('language is required');
  if (!payload?.deadline_at) throw new Error('deadline_at is required');
  return apiRequest('/tasks', {
    method: 'POST',
    body: payload
  });
};

export const updateTask = async (taskId, payload) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/tasks/${taskId}`, {
    method: 'PUT',
    body: payload
  });
};

export const deleteTask = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/tasks/${taskId}`, { method: 'DELETE' });
};

export const prepareAISolutions = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/tasks/${taskId}/prepare-ai`, { method: 'POST' });
};

export const fetchAISolutions = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/tasks/${taskId}/ai-solutions`);
};

export const gradeTask = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/tasks/${taskId}/grade`, { method: 'POST' });
};

// ============ SUBMISSIONS API ============

export const fetchSubmissions = async ({ page = 1, size = 50, taskId, studentId, hasEvaluation } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (taskId) params.append('task_id', String(taskId));
  if (studentId) params.append('student_id', String(studentId));
  if (hasEvaluation !== undefined) params.append('has_evaluation', String(hasEvaluation));
  return apiRequest(`/submissions?${params.toString()}`);
};

export const fetchSubmission = async (submissionId, options = {}) => {
  if (!submissionId) throw new Error('submissionId is required');
  const params = new URLSearchParams();
  if (options.includeEvaluation) params.append('include_evaluation', 'true');
  const query = params.toString();
  return apiRequest(`/submissions/${submissionId}${query ? `?${query}` : ''}`);
};

export const createSubmission = async (payload) => {
  if (!payload?.task_id) throw new Error('task_id is required');
  if (!payload?.code) throw new Error('code is required');
  return apiRequest('/submissions', {
    method: 'POST',
    body: payload
  });
};

export const updateSubmission = async (submissionId, payload) => {
  if (!submissionId) throw new Error('submissionId is required');
  return apiRequest(`/submissions/${submissionId}`, {
    method: 'PUT',
    body: payload
  });
};

export const deleteSubmission = async (submissionId) => {
  if (!submissionId) throw new Error('submissionId is required');
  return apiRequest(`/submissions/${submissionId}`, { method: 'DELETE' });
};

export const fetchSubmissionStats = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/submissions/task/${taskId}/stats`);
};

// ============ EVALUATIONS API ============

export const fetchEvaluations = async ({ page = 1, size = 50, taskId, minScore, maxScore, suspiciousOnly } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (taskId) params.append('task_id', String(taskId));
  if (minScore !== undefined) params.append('min_score', String(minScore));
  if (maxScore !== undefined) params.append('max_score', String(maxScore));
  if (suspiciousOnly) params.append('suspicious_only', 'true');
  return apiRequest(`/evaluations?${params.toString()}`);
};

export const fetchEvaluation = async (evaluationId, options = {}) => {
  if (!evaluationId) throw new Error('evaluationId is required');
  const params = new URLSearchParams();
  if (options.includeSubmission) params.append('include_submission', 'true');
  const query = params.toString();
  return apiRequest(`/evaluations/${evaluationId}${query ? `?${query}` : ''}`);
};

export const fetchEvaluationSummary = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/evaluations/task/${taskId}/summary`);
};

export const updateEvaluation = async (evaluationId, payload) => {
  if (!evaluationId) throw new Error('evaluationId is required');
  return apiRequest(`/evaluations/${evaluationId}`, {
    method: 'PUT',
    body: payload
  });
};

export const deleteEvaluation = async (evaluationId) => {
  if (!evaluationId) throw new Error('evaluationId is required');
  return apiRequest(`/evaluations/${evaluationId}`, { method: 'DELETE' });
};

export const fetchGlobalEvaluationStats = async () => {
  return apiRequest('/evaluations/stats/global');
};

// ============ AI SOLUTIONS API ============

export const fetchAllAISolutions = async ({ page = 1, size = 50, taskId, provider } = {}) => {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (taskId) params.append('task_id', String(taskId));
  if (provider) params.append('provider', provider);
  return apiRequest(`/ai-solutions?${params.toString()}`);
};

export const fetchAISolution = async (aiSolutionId) => {
  if (!aiSolutionId) throw new Error('aiSolutionId is required');
  return apiRequest(`/ai-solutions/${aiSolutionId}`);
};

export const fetchAISolutionSummary = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/ai-solutions/task/${taskId}/summary`);
};

export const generateAISolutions = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/ai-solutions/task/${taskId}/generate`, { method: 'POST' });
};

export const deleteAllAISolutions = async (taskId) => {
  if (!taskId) throw new Error('taskId is required');
  return apiRequest(`/ai-solutions/task/${taskId}/all`, { method: 'DELETE' });
};
