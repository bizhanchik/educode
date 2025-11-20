/**
 * API utilities for AI task generation
 * Used by teachers to generate tasks from lesson materials
 */

import apiRequest from './apiClient.js';

const BASE_URL = '/ai-generation';

/**
 * Generate tasks from lesson materials using AI
 */
export async function generateTasksFromMaterials(data) {
  return apiRequest(`${BASE_URL}/generate-tasks`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * Extract text from a material file (PDF, PPTX, DOCX)
 */
export async function extractMaterialText(materialId) {
  return apiRequest(`${BASE_URL}/extract-material-text/${materialId}`, {
    method: 'POST',
  });
}

/**
 * Preview what materials will be used for AI generation
 */
export async function previewGenerationMaterials(lessonId, materialIds = null) {
  const params = new URLSearchParams();
  if (materialIds && materialIds.length > 0) {
    params.append('material_ids', materialIds.join(','));
  }

  return apiRequest(`${BASE_URL}/preview-generation/${lessonId}?${params.toString()}`);
}
