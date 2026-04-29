import React, { useState, useEffect } from "react";
import { ArrowLeft, Play, FileText, CheckSquare, Code, Edit, X, RefreshCw, Sparkles } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import { apiRequest } from "../utils/apiClient.js";
import { lessonProgressApi } from "../utils/lessonProgressApi.js";
import { createLessonMaterial, fetchLessonQuestions, generateQuestionsFromMaterials } from "../utils/curriculumApi.js";
import Testing from "../components/Testing.jsx";
import Practice from "../components/Practice.jsx";
import TheoryFormatter from "../components/TheoryFormatter.jsx";
import { useLanguage } from "../i18n.jsx";

const LessonDetail = ({ onPageChange, lessonId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [lesson, setLesson] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [allQuestions, setAllQuestions] = useState([]);
  const [activeTab, setActiveTab] = useState("video");
  const [lessonStatus, setLessonStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Модальные окна редактирования
  const [editVideoModalOpen, setEditVideoModalOpen] = useState(false);
  const [editTheoryModalOpen, setEditTheoryModalOpen] = useState(false);
  const [editTestingModalOpen, setEditTestingModalOpen] = useState(false);
  const [editPracticeModalOpen, setEditPracticeModalOpen] = useState(false);
  
  // Check if user is teacher or admin
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  useEffect(() => {
    loadLessonData();
    loadLessonStatus();
  }, [lessonId]);

  const loadLessonData = async () => {
    if (!lessonId) {
      console.error("LessonDetail: lessonId is missing!");
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log("LessonDetail: Loading lesson", lessonId);
      // Загружаем урок и материалы
      const lessonRes = await apiRequest(`/lessons/${lessonId}`, { method: "GET" });
      
      if (!lessonRes || !lessonRes.data) {
        throw new Error("Failed to load lesson");
      }

      console.log("LessonDetail: Lesson data loaded", lessonRes);
      setLesson(lessonRes.data);
      
      // Загружаем материалы - правильный endpoint: /lessons/{lesson_id}/materials
      let materialsRes = null;
      try {
        materialsRes = await apiRequest(`/lessons/${lessonId}/materials`, { method: "GET" });
        console.log("LessonDetail: Materials loaded from /lessons/{id}/materials", materialsRes);
      } catch (err) {
        console.warn("Failed to load materials:", err);
        // Пробуем альтернативный endpoint (на случай если структура изменилась)
        try {
          materialsRes = await apiRequest(`/lesson-materials?lesson_id=${lessonId}`, { method: "GET" });
          console.log("LessonDetail: Materials loaded from /lesson-materials", materialsRes);
        } catch (err2) {
          console.warn("Failed to load materials from both endpoints:", err2);
          materialsRes = null;
        }
      }
      
      console.log("LessonDetail: Materials raw data", materialsRes?.data);
      
      // Обрабатываем материалы - проверяем разные варианты структуры ответа
      let materialsArray = [];
      if (materialsRes && materialsRes.data) {
        // Проверяем разные варианты структуры ответа
        if (Array.isArray(materialsRes.data)) {
          materialsArray = materialsRes.data;
        } else if (materialsRes.data.materials && Array.isArray(materialsRes.data.materials)) {
          materialsArray = materialsRes.data.materials;
        } else if (materialsRes.data.data && Array.isArray(materialsRes.data.data)) {
          materialsArray = materialsRes.data.data;
        } else if (typeof materialsRes.data === 'object') {
          // Если это объект, попробуем найти массив внутри
          const keys = Object.keys(materialsRes.data);
          for (const key of keys) {
            if (Array.isArray(materialsRes.data[key])) {
              materialsArray = materialsRes.data[key];
              break;
            }
          }
        }
      } else if (materialsRes && Array.isArray(materialsRes)) {
        // Если ответ - это массив напрямую
        materialsArray = materialsRes;
      }
      
      console.log("LessonDetail: Processed materials array", materialsArray);
      console.log("LessonDetail: Video materials", materialsArray.filter(m => m.material_type === "YOUTUBE"));
      console.log("LessonDetail: Text materials", materialsArray.filter(m => m.material_type === "TEXT"));
      setMaterials(materialsArray);

      // Загружаем задачи отдельно, так как endpoint может не существовать
      try {
        const tasksRes = await apiRequest(`/tasks?lesson_id=${lessonId}&size=100`, { method: "GET" });
        const tasksList = tasksRes.data?.tasks || tasksRes.data?.data || tasksRes.data || [];
        setTasks(Array.isArray(tasksList) ? tasksList : []);
      } catch (error) {
        console.warn("Failed to load tasks (endpoint may not exist):", error);
        setTasks([]); // Устанавливаем пустой массив, если задачи не загрузились
      }

      // Загружаем все вопросы для учителя
      if (isTeacher) {
        try {
          const questionsRes = await fetchLessonQuestions(lessonId);
          const questionsList = questionsRes.data?.questions || questionsRes.data?.data?.questions || [];
          setAllQuestions(Array.isArray(questionsList) ? questionsList : []);
          console.log(`[LessonDetail] Loaded ${questionsList.length} questions for teacher`);
        } catch (error) {
          console.warn("Failed to load questions for teacher:", error);
          setAllQuestions([]);
        }
      }
    } catch (error) {
      console.error("Failed to load lesson:", error);
      console.error("Error details:", error.payload || error.message);
      // Don't set lesson to null on error, keep loading state
    } finally {
      setLoading(false);
    }
  };

  const loadLessonStatus = async () => {
    // Загружаем статус только для студентов
    if (user?.role !== "student") {
      return;
    }
    
    try {
      const response = await lessonProgressApi.getLessonStatus(lessonId);
      setLessonStatus(response.data);
    } catch (error) {
      console.error("Failed to load lesson status:", error);
      // Не критично, продолжаем работу
    }
  };

  const handleTestComplete = (result) => {
    loadLessonStatus();
  };

  const navigationItems = [
    { id: "video", label: "Видеоурок", icon: Play },
    { id: "theory", label: "Теория", icon: FileText },
    { id: "testing", label: "Тестирование", icon: CheckSquare },
    { id: "practice", label: "Решение задач", icon: Code },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!lesson && !loading) {
    return (
      <div className="bg-white min-h-screen">
        <section className="pt-20 pb-8 px-6">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => onPageChange && onPageChange("courses")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Назад к урокам</span>
            </button>
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg mb-4">Урок не найден</p>
              <p className="text-gray-500 text-sm">Lesson ID: {lessonId || "не указан"}</p>
              <p className="text-gray-500 text-sm mt-2">Проверьте консоль браузера для деталей ошибки</p>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={() => onPageChange && onPageChange("courses")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к урокам</span>
          </button>

          {/* Lesson Title */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{lesson.title}</h1>
          {lesson.description && (
            <p className="text-gray-600 text-lg mb-10">{lesson.description}</p>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {activeTab === "video" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Видеоурок</h3>
                    {isTeacher && (
                      <button
                        onClick={() => {
                          const videoMaterial = materials.find((m) => {
                            const type = (m.type || m.material_type || '').toLowerCase();
                            return type === "youtube" || type === "video";
                          });
                          setEditVideoModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать видео"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                    )}
                  </div>
                  {(() => {
                    console.log("LessonDetail: Looking for video in materials:", materials);
                    const videoMaterial = materials.find((m) => {
                      const type = (m.type || m.material_type || '').toLowerCase();
                      return type === "youtube" || type === "video";
                    });
                    console.log("LessonDetail: Found video material:", videoMaterial);
                    if (!videoMaterial) {
                      return <p className="text-gray-600">Видеоурок не добавлен</p>;
                    }

                    // Функция для извлечения ID видео из разных форматов YouTube URL
                    const extractYouTubeId = (url) => {
                      if (!url) return null;
                      
                      // Формат: https://www.youtube.com/watch?v=VIDEO_ID
                      const match1 = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
                      if (match1) return match1[1];
                      
                      // Формат: https://youtu.be/VIDEO_ID
                      const match2 = url.match(/youtu\.be\/([^&\n?#]+)/);
                      if (match2) return match2[1];
                      
                      // Если URL уже является ID
                      if (url.length === 11 && !url.includes('/') && !url.includes('?')) {
                        return url;
                      }
                      
                      return null;
                    };

                    // Пробуем разные поля для URL (youtube_url - правильное поле из бэкенда)
                    const videoUrl = videoMaterial.youtube_url || videoMaterial.url || videoMaterial.file_url || videoMaterial.link || '';
                    console.log("LessonDetail: Video URL:", videoUrl);
                    
                    const videoId = extractYouTubeId(videoUrl);
                    
                    if (!videoId) {
                      return (
                        <div className="text-gray-600">
                          <p>Не удалось извлечь ID видео из URL:</p>
                          <p className="text-sm mt-2 break-all">{videoUrl || "URL не найден"}</p>
                          <p className="text-xs mt-2 text-gray-500">Материал: {JSON.stringify(videoMaterial, null, 2)}</p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                    <div className="relative pb-[56.25%] h-0">
                      <iframe
                        className="absolute top-0 left-0 w-full h-full rounded-lg"
                            src={`https://www.youtube.com/embed/${videoId}`}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                        {videoMaterial.description && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">{videoMaterial.description}</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === "theory" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Теория</h3>
                    {isTeacher && (
                      <button
                        onClick={() => {
                          setEditTheoryModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать теорию"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                    )}
                  </div>
                  {(() => {
                    console.log("LessonDetail: Looking for theory in materials:", materials);
                    const textMaterial = materials.find((m) => {
                      const type = (m.type || m.material_type || '').toLowerCase();
                      return type === "text";
                    });
                    const docMaterials = materials.filter((m) => {
                      const type = (m.type || m.material_type || '').toLowerCase();
                      return type === "file" || type === "pdf" || type === "docx" || type === "pptx" || type === "txt";
                    });
                    console.log("LessonDetail: Found text material:", textMaterial);
                    console.log("LessonDetail: Found doc materials:", docMaterials);

                    if (!textMaterial && docMaterials.length === 0) {
                      return <p className="text-gray-600">Теоретический материал не добавлен</p>;
                    }

                    return (
                      <div className="space-y-6">
                        {/* Текстовая теория */}
                        {textMaterial && (textMaterial.content || textMaterial.text_content) && (
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <TheoryFormatter 
                              text={textMaterial.content || textMaterial.text_content} 
                              lessonTitle={lesson?.title}
                            />
                          </div>
                        )}

                        {/* Документы с извлеченным текстом и изображениями */}
                        {docMaterials.length > 0 && (
                          <div className="space-y-4">
                            {docMaterials.map((doc, docIndex) => {
                              // Парсим извлеченные изображения
                              let extractedImages = [];
                              try {
                                if (doc.extracted_images) {
                                  const imagesData = typeof doc.extracted_images === 'string' 
                                    ? JSON.parse(doc.extracted_images) 
                                    : doc.extracted_images;
                                  extractedImages = Array.isArray(imagesData) ? imagesData : [];
                                }
                              } catch (e) {
                                console.warn("Failed to parse extracted images:", e);
                              }

                              return (
                                <div key={doc.id || docIndex} className="border border-gray-200 rounded-lg p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                      <FileText className="w-5 h-5 text-blue-500" />
                                      <div>
                                        <p className="font-medium text-gray-900">{doc.title}</p>
                                        <p className="text-xs text-gray-500">{doc.type || doc.material_type || 'file'}</p>
                                      </div>
                                    </div>
                                    {(doc.file_download_url || doc.file_url || doc.url) && (
                                      <a
                                        href={doc.file_download_url || doc.file_url || doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                                      >
                                        Скачать
                                      </a>
                                    )}
                                  </div>
                                  
                                  {/* Извлеченный текст из документа */}
                                  {doc.extracted_text && (
                                    <div className="mb-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Текст из документа:</h5>
                                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                                        <TheoryFormatter 
                                          text={doc.extracted_text} 
                                          lessonTitle={lesson?.title}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* Изображения из документа */}
                                  {extractedImages.length > 0 && (
                                    <div className="mt-4">
                                      <h5 className="text-sm font-medium text-gray-700 mb-2">Изображения из документа:</h5>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {extractedImages.map((img, imgIndex) => (
                                          <div key={imgIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                            {img.presigned_url ? (
                                              <img 
                                                src={img.presigned_url} 
                                                alt={img.description || `Изображение ${imgIndex + 1}`}
                                                className="w-full h-auto object-contain max-h-96"
                                                onError={(e) => {
                                                  console.error("Failed to load image:", img.presigned_url);
                                                  e.target.style.display = 'none';
                                                }}
                                              />
                                            ) : (
                                              <div className="p-4 text-center text-gray-500 text-sm">
                                                Изображение недоступно
                                              </div>
                                            )}
                                            {img.description && (
                                              <div className="p-2 bg-gray-50 text-xs text-gray-600">
                                                {img.description}
                                              </div>
                  )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === "testing" && (
                <div className="bg-white border border-gray-200 rounded-lg p-8 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900">Тестирование</h3>
                    {isTeacher && (
                      <button
                        onClick={() => {
                          setEditTestingModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать тесты"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                    )}
                  </div>
                  <div className="-m-8 mt-0">
                <Testing 
                  lessonId={lessonId} 
                  onComplete={handleTestComplete} 
                  isTeacher={isTeacher} 
                  allQuestions={allQuestions}
                  onRegenerateQuestions={() => setEditTestingModalOpen(true)}
                />
                  </div>
                </div>
              )}

              {activeTab === "practice" && (
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Решение задач</h3>
                    {isTeacher && (
                      <button
                        onClick={() => {
                          setEditPracticeModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Редактировать задачи"
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                    )}
                  </div>
                  <div className="-m-6 mt-0">
                    <Practice lessonId={lessonId} tasks={tasks} isTeacher={isTeacher} />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="bg-white border border-gray-200 rounded-lg p-5">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Навигация</h3>
                <nav className="space-y-2">
                  {navigationItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                          activeTab === item.id
                            ? "bg-blue-100 text-blue-600 font-semibold"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        <Icon size={18} />
                        <span className="text-sm font-medium">{item.label}</span>
                      </button>
                    );
                  })}
                </nav>

                {/* Lesson Status */}
                {lessonStatus && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <div className="text-sm text-gray-600 mb-2">Статус урока</div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Тест:</span>
                        <span className="font-medium">{Math.round(lessonStatus.test_score)}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Практика:</span>
                        <span className="font-medium">{Math.round(lessonStatus.practice_score)}%</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold pt-2 border-t border-gray-200">
                        <span>Итого:</span>
                        <span
                          className={
                            lessonStatus.final_score >= 50 ? "text-green-600" : "text-red-600"
                          }
                        >
                          {Math.round(lessonStatus.final_score)}%
                        </span>
                      </div>
                      {lessonStatus.is_locked && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-xs text-red-800">
                            Урок не пройден. Необходимо набрать минимум 50% для доступа к следующему уроку.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Модальное окно редактирования видео */}
      {editVideoModalOpen && (
        <EditVideoModal
          isOpen={editVideoModalOpen}
          onClose={() => setEditVideoModalOpen(false)}
          lessonId={lessonId}
          material={materials.find((m) => {
            const type = (m.type || m.material_type || '').toLowerCase();
            return type === "youtube" || type === "video";
          })}
          onSave={async () => {
            await loadLessonData();
            setEditVideoModalOpen(false);
          }}
        />
      )}

      {/* Модальное окно редактирования теории */}
      {editTheoryModalOpen && (
        <EditTheoryModal
          isOpen={editTheoryModalOpen}
          onClose={() => setEditTheoryModalOpen(false)}
          lessonId={lessonId}
          materials={materials}
          onSave={async () => {
            await loadLessonData();
            setEditTheoryModalOpen(false);
          }}
        />
      )}

      {/* Модальное окно редактирования тестирования */}
      {editTestingModalOpen && (
        <EditTestingModal
          isOpen={editTestingModalOpen}
          onClose={() => setEditTestingModalOpen(false)}
          lessonId={lessonId}
          onQuestionsRegenerated={async () => {
            await loadLessonData();
          }}
        />
      )}

      {/* Модальное окно редактирования практики */}
      {editPracticeModalOpen && (
        <EditPracticeModal
          isOpen={editPracticeModalOpen}
          onClose={() => setEditPracticeModalOpen(false)}
          lessonId={lessonId}
        />
      )}
    </div>
  );
};

// Модальное окно редактирования видео
const EditVideoModal = ({ isOpen, onClose, lessonId, material, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    url: "",
    description: "",
  });

  useEffect(() => {
    if (isOpen) {
      if (material) {
        setFormData({
          url: material.youtube_url || material.url || "",
          description: material.description || "",
        });
      } else {
        setFormData({
          url: "",
          description: "",
        });
      }
    }
  }, [isOpen, material]);

  const handleSubmit = async () => {
    if (!formData.url || !formData.url.trim()) {
      alert("Пожалуйста, введите ссылку на видео");
      return;
    }

    try {
      setSaving(true);
      
      // Удаляем старый материал, если он есть
      if (material?.id) {
        try {
          await apiRequest(`/materials/${material.id}`, { method: "DELETE" });
        } catch (deleteError) {
          // Если материал уже удален или не найден, продолжаем создание нового
          console.warn("Material not found for deletion, creating new one:", deleteError);
        }
      }

      // Создаем новый материал
      const formDataObj = new FormData();
      formDataObj.append('title', 'Видео');
      formDataObj.append('type', 'youtube');
      formDataObj.append('youtube_url', formData.url.trim());
      if (formData.description && formData.description.trim()) {
        formDataObj.append('description', formData.description.trim());
      }

      await createLessonMaterial(lessonId, formDataObj);
      await onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update video:", error);
      const errorMessage = error.message || error.detail || "Неизвестная ошибка";
      alert("Не удалось обновить видео: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Редактировать видео</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Ссылка на видео <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={formData.url}
              onChange={(e) => setFormData((prev) => ({ ...prev, url: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={saving}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Описание видео
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Описание видео материала..."
              rows={4}
              disabled={saving}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !formData.url.trim()}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Модальное окно редактирования теории
const EditTheoryModal = ({ isOpen, onClose, lessonId, materials, onSave }) => {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    link: "",
    text: "",
  });

  useEffect(() => {
    if (isOpen) {
      const textMaterial = materials.find((m) => {
        const type = (m.type || m.material_type || '').toLowerCase();
        return type === "text";
      });
      const linkMaterial = materials.find((m) => {
        const type = (m.type || m.material_type || '').toLowerCase();
        return type === "youtube" && m.title?.toLowerCase().includes('теория');
      });

      setFormData({
        link: linkMaterial?.youtube_url || linkMaterial?.url || "",
        text: textMaterial?.content || textMaterial?.text_content || "",
      });
    }
  }, [isOpen, materials]);

  const handleSubmit = async () => {
    if (!formData.link.trim() && !formData.text.trim()) {
      alert("Пожалуйста, введите ссылку на видео или текст теории");
      return;
    }

    try {
      setSaving(true);
      // Удаляем старые материалы теории
      const textMaterial = materials.find((m) => {
        const type = (m.type || m.material_type || '').toLowerCase();
        return type === "text";
      });
      const linkMaterial = materials.find((m) => {
        const type = (m.type || m.material_type || '').toLowerCase();
        return type === "youtube" && m.title?.toLowerCase().includes('теория');
      });

      if (textMaterial?.id) {
        try {
          await apiRequest(`/materials/${textMaterial.id}`, { method: "DELETE" });
        } catch (deleteError) {
          console.warn("Text material not found for deletion:", deleteError);
        }
      }
      if (linkMaterial?.id) {
        try {
          await apiRequest(`/materials/${linkMaterial.id}`, { method: "DELETE" });
        } catch (deleteError) {
          console.warn("Link material not found for deletion:", deleteError);
        }
      }

      // Создаем новые материалы
      if (formData.link && formData.link.trim()) {
        const linkForm = new FormData();
        linkForm.append('title', 'Теория (ссылка)');
        linkForm.append('type', 'youtube');
        linkForm.append('youtube_url', formData.link.trim());
        linkForm.append('use_for_ai_generation', 'false');
        await createLessonMaterial(lessonId, linkForm);
      }

      if (formData.text && formData.text.trim()) {
        const textForm = new FormData();
        textForm.append('title', 'Теория (текст)');
        textForm.append('type', 'text');
        textForm.append('content', formData.text.trim());
        textForm.append('use_for_ai_generation', 'true');
        await createLessonMaterial(lessonId, textForm);
      }

      await onSave();
      onClose();
    } catch (error) {
      console.error("Failed to update theory:", error);
      const errorMessage = error.message || error.detail || "Неизвестная ошибка";
      alert("Не удалось обновить теорию: " + errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 my-8">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">Редактировать теорию</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            disabled={saving}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ссылка на теорию (YouTube)
            </label>
            <input
              type="url"
              value={formData.link}
              onChange={(e) => setFormData((prev) => ({ ...prev, link: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=... или https://youtu.be/..."
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Ссылка на видео с теорией (необязательно)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Текст теории <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.text}
              onChange={(e) => setFormData((prev) => ({ ...prev, text: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Введите текст теории урока..."
              rows={10}
              disabled={saving}
            />
            <p className="text-xs text-gray-500 mt-1">
              Текстовое объяснение теории урока
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || (!formData.text.trim() && !formData.link.trim())}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="animate-spin">⏳</span>
                Сохранение...
              </>
            ) : (
              "Сохранить"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Модальное окно редактирования тестирования
const EditTestingModal = ({ isOpen, onClose, lessonId, onQuestionsRegenerated }) => {
  const [questionsCount, setQuestionsCount] = useState(40);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setQuestionsCount(40);
      setError("");
    }
  }, [isOpen]);

  const handleRegenerateQuestions = async () => {
    if (!lessonId) {
      setError("ID урока не найден");
      return;
    }

    setGenerating(true);
    setError("");
    
    try {
      console.log(`[EditTestingModal] Regenerating ${questionsCount} questions for lesson ${lessonId}...`);
      
      // Небольшая задержка для обработки документов на сервере
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const response = await generateQuestionsFromMaterials(lessonId, questionsCount);
      const allQuestions = response.data?.questions || response.questions || [];
      const questions = allQuestions.slice(0, questionsCount);
      
      if (questions.length > 0) {
        console.log(`[EditTestingModal] Successfully regenerated ${questions.length} questions`);
        if (onQuestionsRegenerated) {
          await onQuestionsRegenerated();
        }
        alert(`Успешно сгенерировано ${questions.length} вопросов!`);
        onClose();
      } else {
        setError("Не удалось сгенерировать вопросы. Проверьте, что теория урока заполнена.");
      }
    } catch (error) {
      console.error("[EditTestingModal] Failed to regenerate questions:", error);
      setError(error.message || "Не удалось сгенерировать вопросы. Попробуйте позже.");
    } finally {
      setGenerating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Перегенерировать вопросы</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            disabled={generating}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Вопросы будут сгенерированы заново на основе теории урока с помощью ИИ.
          </p>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Количество вопросов
            </label>
            <input
              type="number"
              min="1"
              max="100"
              value={questionsCount}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 40;
                setQuestionsCount(Math.max(1, Math.min(100, value)));
              }}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={generating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Рекомендуется: 20-40 вопросов
            </p>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {generating && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-800">Генерация вопросов...</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
          <button
            onClick={onClose}
            disabled={generating}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleRegenerateQuestions}
            disabled={generating || !lessonId}
            className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {generating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Генерация...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Перегенерировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

// Модальное окно редактирования практики
const EditPracticeModal = ({ isOpen, onClose, lessonId }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Редактировать задачи</h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-gray-600 mb-4">
          Для редактирования задач используйте раздел управления задачами в панели преподавателя.
        </p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

export default LessonDetail;

