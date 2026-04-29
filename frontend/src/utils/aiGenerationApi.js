import apiRequest from './apiClient.js';

const BASE_URL = '/ai-generation';


export async function generateTasksFromMaterials(data) {
  return apiRequest(`${BASE_URL}/generate-tasks`, {
    method: 'POST',
    body: data,
  });
}


export async function extractMaterialText(materialId) {
  return apiRequest(`${BASE_URL}/extract-material-text/${materialId}`, {
    method: 'POST',
  });
}

export async function previewGenerationMaterials(lessonId, materialIds = null) {
  const params = new URLSearchParams();
  if (materialIds && materialIds.length > 0) {
    params.append('material_ids', materialIds.join(','));
  }

  return apiRequest(`${BASE_URL}/preview-generation/${lessonId}?${params.toString()}`);
}
