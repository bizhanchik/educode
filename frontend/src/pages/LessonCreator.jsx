import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Save,
  Plus,
  Trash2,
  Upload,
  FileText,
  Video,
  File,
  AlertCircle,
  Sparkles,
  Eye,
  X,
  RefreshCw,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';
import apiRequest from '../utils/apiClient.js';
import { generateTasksFromMaterials, previewGenerationMaterials } from '../utils/aiGenerationApi.js';

const MATERIAL_TYPES = {
  TEXT: { label: 'Text', icon: FileText, color: 'blue', aiSupported: true },
  YOUTUBE: { label: 'YouTube', icon: Video, color: 'red', aiSupported: false },
  PDF: { label: 'PDF', icon: File, color: 'red', aiSupported: true },
  PPTX: { label: 'PowerPoint', icon: File, color: 'orange', aiSupported: true },
  DOCX: { label: 'Word', icon: File, color: 'blue', aiSupported: true }
};

const LessonCreator = ({ onPageChange, pageParams = {} }) => {
  const lessonId = pageParams.lessonId;
  const isEdit = Boolean(lessonId);

  // Lesson data
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject_id: ''
  });

  // Materials
  const [materials, setMaterials] = useState([]);
  const [materialModalOpen, setMaterialModalOpen] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    material_type: 'TEXT',
    url: '',
    text_content: '',
    file: null,
    use_for_ai_generation: true
  });

  // UI state
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // AI Generation
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiConfig, setAiConfig] = useState({
    num_tasks: 3,
    languages: ['python'],
    use_openai: true
  });
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiPreview, setAiPreview] = useState(null);
  const [aiPreviewLoading, setAiPreviewLoading] = useState(false);

  const LANGUAGES = ['python', 'javascript', 'java', 'cpp', 'c', 'csharp', 'go', 'rust'];

  useEffect(() => {
    fetchSubjects();
    if (isEdit) {
      fetchLesson();
    }
  }, [lessonId]);

  const fetchSubjects = async () => {
    try {
      const response = await apiRequest('/subjects?page=1&size=100');
      setSubjects(response.data?.subjects || []);
    } catch (err) {
      console.error('Failed to fetch subjects:', err);
    }
  };

  const fetchLesson = async () => {
    setLoading(true);
    try {
      const response = await apiRequest(`/lessons/${lessonId}`);
      const lesson = response.data;
      setFormData({
        title: lesson.title,
        description: lesson.description || '',
        subject_id: lesson.subject_id
      });

      // Fetch materials
      const materialsRes = await apiRequest(`/lesson-materials?lesson_id=${lessonId}`);
      setMaterials(materialsRes.data?.materials || []);
    } catch (err) {
      setError('Failed to load lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLesson = async () => {
    if (!formData.title || !formData.subject_id) {
      setError('Please fill in all required fields');
      return;
    }

    setSaving(true);
    setError('');

    try {
      let savedLessonId = lessonId;

      if (isEdit) {
        await apiRequest(`/lessons/${lessonId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        const response = await apiRequest('/lessons', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        savedLessonId = response.data.id;
      }

      // Save materials
      for (const material of materials) {
        if (material.id) continue; // Skip existing materials

        const formDataObj = new FormData();
        formDataObj.append('lesson_id', savedLessonId);
        formDataObj.append('title', material.title);
        formDataObj.append('material_type', material.material_type);
        formDataObj.append('use_for_ai_generation', material.use_for_ai_generation);

        if (material.file) {
          formDataObj.append('file', material.file);
        } else if (material.url) {
          formDataObj.append('url', material.url);
        } else if (material.text_content) {
          formDataObj.append('text_content', material.text_content);
        }

        await apiRequest('/lesson-materials', {
          method: 'POST',
          body: formDataObj,
          isFormData: true
        });
      }

      onPageChange('lesson-assign', { lessonId: savedLessonId });
    } catch (err) {
      setError(err.message || 'Failed to save lesson');
    } finally {
      setSaving(false);
    }
  };

  const handleAddMaterial = () => {
    if (!newMaterial.title) {
      alert('Please enter a material title');
      return;
    }

    // Validate based on type
    if (newMaterial.material_type === 'YOUTUBE' && !newMaterial.url) {
      alert('Please enter YouTube URL');
      return;
    }
    if (newMaterial.material_type === 'TEXT' && !newMaterial.text_content) {
      alert('Please enter text content');
      return;
    }
    if (['PDF', 'PPTX', 'DOCX'].includes(newMaterial.material_type) && !newMaterial.file) {
      alert('Please upload a file');
      return;
    }

    setMaterials([...materials, { ...newMaterial, tempId: Date.now() }]);
    setMaterialModalOpen(false);
    setNewMaterial({
      title: '',
      material_type: 'TEXT',
      url: '',
      text_content: '',
      file: null,
      use_for_ai_generation: true
    });
  };

  const handleRemoveMaterial = async (materialId, tempId) => {
    if (materialId) {
      // Delete from server
      try {
        await apiRequest(`/lesson-materials/${materialId}`, { method: 'DELETE' });
      } catch (err) {
        alert('Failed to delete material');
        return;
      }
    }
    setMaterials(materials.filter(m => m.id !== materialId && m.tempId !== tempId));
  };

  const handleToggleAIGeneration = async (materialId, tempId, currentValue) => {
    if (materialId) {
      // Update on server
      try {
        await apiRequest(`/lesson-materials/${materialId}`, {
          method: 'PUT',
          body: JSON.stringify({ use_for_ai_generation: !currentValue })
        });
      } catch (err) {
        alert('Failed to update material');
        return;
      }
    }
    setMaterials(materials.map(m =>
      (m.id === materialId || m.tempId === tempId)
        ? { ...m, use_for_ai_generation: !currentValue }
        : m
    ));
  };

  const handlePreviewAI = async () => {
    if (!lessonId) {
      alert('Please save the lesson first');
      return;
    }

    setAiPreviewLoading(true);
    try {
      const materialIds = materials
        .filter(m => m.use_for_ai_generation && m.id)
        .map(m => m.id);

      const response = await previewGenerationMaterials(lessonId, materialIds.length > 0 ? materialIds : null);
      setAiPreview(response.data);
    } catch (err) {
      alert(err.message || 'Failed to preview materials');
    } finally {
      setAiPreviewLoading(false);
    }
  };

  const handleGenerateWithAI = async () => {
    if (!lessonId) {
      alert('Please save the lesson first');
      return;
    }

    const aiSupportedMaterials = materials.filter(m =>
      m.use_for_ai_generation && MATERIAL_TYPES[m.material_type]?.aiSupported
    );

    if (aiSupportedMaterials.length === 0) {
      alert('No AI-compatible materials selected. Please mark PDF, PPTX, DOCX, or TEXT materials for AI generation.');
      return;
    }

    setAiGenerating(true);
    try {
      const materialIds = aiSupportedMaterials.filter(m => m.id).map(m => m.id);

      const response = await generateTasksFromMaterials({
        lesson_id: parseInt(lessonId),
        num_tasks: aiConfig.num_tasks,
        languages: aiConfig.languages,
        use_openai: aiConfig.use_openai,
        material_ids: materialIds.length > 0 ? materialIds : null
      });

      alert(`Successfully generated ${response.data.tasks_created} tasks in ${response.data.generation_time_seconds}s!`);
      setAiModalOpen(false);
    } catch (err) {
      alert(err.message || 'Failed to generate tasks');
    } finally {
      setAiGenerating(false);
    }
  };

  const toggleLanguage = (lang) => {
    if (aiConfig.languages.includes(lang)) {
      setAiConfig({ ...aiConfig, languages: aiConfig.languages.filter(l => l !== lang) });
    } else {
      setAiConfig({ ...aiConfig, languages: [...aiConfig.languages, lang] });
    }
  };

  const aiCompatibleCount = materials.filter(m =>
    m.use_for_ai_generation && MATERIAL_TYPES[m.material_type]?.aiSupported
  ).length;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => onPageChange('teacher-dashboard')}
              className="flex items-center gap-2 text-gray-300 hover:text-white mb-4 transition-colors"
            >
              <ArrowLeft size={20} />
              Back
            </button>
            <h1 className="text-4xl font-bold text-white">
              {isEdit ? 'Edit Lesson' : 'Create Lesson'}
            </h1>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-white rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle size={20} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Lesson Details */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <h2 className="text-2xl font-bold text-white mb-4">Lesson Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Introduction to Python Loops"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Subject *
              </label>
              <select
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="" className="text-gray-900">Select subject...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id} className="text-gray-900">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 bg-white/20 text-white rounded-lg border border-white/30 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe what students will learn..."
              />
            </div>
          </div>
        </div>

        {/* Materials */}
        <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white">Lesson Materials</h2>
              <p className="text-sm text-gray-300 mt-1">
                {aiCompatibleCount > 0 && (
                  <span className="text-green-400">
                    {aiCompatibleCount} material(s) ready for AI generation
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => setMaterialModalOpen(true)}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Plus size={18} />
              Add Material
            </button>
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <FileText size={48} className="mx-auto mb-4 opacity-50" />
              <p>No materials added yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((material) => {
                const typeInfo = MATERIAL_TYPES[material.material_type];
                const Icon = typeInfo.icon;

                return (
                  <div
                    key={material.id || material.tempId}
                    className="bg-white/10 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className={`p-3 bg-${typeInfo.color}-500/20 rounded-lg`}>
                        <Icon size={24} className={`text-${typeInfo.color}-400`} />
                      </div>

                      <div className="flex-1">
                        <h3 className="text-white font-medium">{material.title}</h3>
                        <p className="text-sm text-gray-400">{typeInfo.label}</p>
                        {!typeInfo.aiSupported && material.use_for_ai_generation && (
                          <p className="text-xs text-yellow-400 mt-1 flex items-center gap-1">
                            <AlertCircle size={12} />
                            Cannot be used for AI generation
                          </p>
                        )}
                      </div>

                      {typeInfo.aiSupported && (
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={material.use_for_ai_generation}
                            onChange={() => handleToggleAIGeneration(material.id, material.tempId, material.use_for_ai_generation)}
                            className="w-4 h-4 text-blue-500 bg-white/20 border-white/30 rounded focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-300">Use for AI</span>
                        </label>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemoveMaterial(material.id, material.tempId)}
                      className="ml-4 text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={handleSaveLesson}
            disabled={saving}
            className="flex-1 px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <RefreshCw className="animate-spin" size={20} />
                Saving...
              </>
            ) : (
              <>
                <Save size={20} />
                {isEdit ? 'Save & Continue' : 'Create & Continue'}
              </>
            )}
          </button>

          {isEdit && aiCompatibleCount > 0 && (
            <button
              onClick={() => setAiModalOpen(true)}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Sparkles size={20} />
              Generate Tasks with AI
            </button>
          )}
        </div>
      </div>

      {/* Add Material Modal */}
      <AnimatePresence>
        {materialModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setMaterialModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold text-white mb-4">Add Material</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Python Loops Tutorial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Type *
                  </label>
                  <select
                    value={newMaterial.material_type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, material_type: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(MATERIAL_TYPES).map(([key, value]) => (
                      <option key={key} value={key}>
                        {value.label} {!value.aiSupported && '(Cannot use for AI)'}
                      </option>
                    ))}
                  </select>
                </div>

                {newMaterial.material_type === 'YOUTUBE' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        YouTube URL *
                      </label>
                      <input
                        type="url"
                        value={newMaterial.url}
                        onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://youtube.com/watch?v=..."
                      />
                    </div>
                    <div className="bg-yellow-500/20 border border-yellow-500 text-yellow-300 rounded-lg p-3 text-sm flex items-start gap-2">
                      <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                      <span>YouTube materials cannot be used for AI task generation</span>
                    </div>
                  </>
                )}

                {newMaterial.material_type === 'TEXT' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Text Content *
                    </label>
                    <textarea
                      value={newMaterial.text_content}
                      onChange={(e) => setNewMaterial({ ...newMaterial, text_content: e.target.value })}
                      rows={8}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter lesson content..."
                    />
                  </div>
                )}

                {['PDF', 'PPTX', 'DOCX'].includes(newMaterial.material_type) && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Upload File *
                    </label>
                    <input
                      type="file"
                      accept={
                        newMaterial.material_type === 'PDF' ? '.pdf' :
                        newMaterial.material_type === 'PPTX' ? '.ppt,.pptx' :
                        '.doc,.docx'
                      }
                      onChange={(e) => setNewMaterial({ ...newMaterial, file: e.target.files[0] })}
                      className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                {MATERIAL_TYPES[newMaterial.material_type]?.aiSupported && (
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newMaterial.use_for_ai_generation}
                      onChange={(e) => setNewMaterial({ ...newMaterial, use_for_ai_generation: e.target.checked })}
                      className="w-4 h-4 text-blue-500 bg-gray-700 border-gray-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-300">Use this material for AI task generation</span>
                  </label>
                )}
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setMaterialModalOpen(false)}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMaterial}
                  className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
                >
                  Add Material
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Generation Modal */}
      <AnimatePresence>
        {aiModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => !aiGenerating && setAiModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-6">
                <Sparkles className="text-purple-400" size={32} />
                <h2 className="text-2xl font-bold text-white">AI Task Generation</h2>
              </div>

              <div className="space-y-6">
                {/* Preview Materials */}
                <div className="bg-white/10 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-medium">Materials to Use</h3>
                    <button
                      onClick={handlePreviewAI}
                      disabled={aiPreviewLoading}
                      className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      {aiPreviewLoading ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Eye size={14} />
                      )}
                      Preview
                    </button>
                  </div>
                  <div className="text-sm text-gray-300">
                    {aiCompatibleCount} AI-compatible material(s) selected
                  </div>
                  {aiPreview && (
                    <div className="mt-3 p-3 bg-black/30 rounded text-xs text-gray-400 max-h-32 overflow-y-auto">
                      {aiPreview.preview}
                    </div>
                  )}
                </div>

                {/* Number of Tasks */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Number of Tasks: {aiConfig.num_tasks}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={aiConfig.num_tasks}
                    onChange={(e) => setAiConfig({ ...aiConfig, num_tasks: parseInt(e.target.value) })}
                    className="w-full"
                  />
                </div>

                {/* Programming Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Programming Languages *
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {LANGUAGES.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => toggleLanguage(lang)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          aiConfig.languages.includes(lang)
                            ? 'bg-blue-500 text-white'
                            : 'bg-white/10 text-gray-300 hover:bg-white/20'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                {/* AI Provider */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    AI Provider
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setAiConfig({ ...aiConfig, use_openai: true })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        aiConfig.use_openai
                          ? 'bg-green-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      OpenAI GPT-4
                    </button>
                    <button
                      onClick={() => setAiConfig({ ...aiConfig, use_openai: false })}
                      className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                        !aiConfig.use_openai
                          ? 'bg-purple-500 text-white'
                          : 'bg-white/10 text-gray-300 hover:bg-white/20'
                      }`}
                    >
                      Anthropic Claude
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="bg-blue-500/20 border border-blue-500 text-blue-300 rounded-lg p-4 text-sm">
                  <p className="font-medium mb-1">What will be generated:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Task descriptions with clear requirements</li>
                    <li>Reference solutions for plagiarism detection</li>
                    <li>Test cases structure (for future automatic testing)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setAiModalOpen(false)}
                  disabled={aiGenerating}
                  className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateWithAI}
                  disabled={aiGenerating || aiConfig.languages.length === 0}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiGenerating ? (
                    <>
                      <RefreshCw className="animate-spin" size={18} />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Generate Tasks
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LessonCreator;
