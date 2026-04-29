import React, { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, X, Edit2, Image, Palette } from "lucide-react";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  fetchSubjects,
  fetchSubjectWithLessons,
  createSubject,
  updateSubject,
  uploadSubjectImage,
} from "../utils/curriculumApi.js";
import { progressApi } from "../utils/progressApi.js";
import { getTeacherAssignments, createTeacherAssignment } from "../utils/teacherAssignmentsApi.js";
import { groupsApi } from "../utils/groupsApi.js";

const MyCourses = ({ onPageChange }) => {
  const { user } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [subjects, setSubjects] = useState([]);
  const [subjectsLoading, setSubjectsLoading] = useState(true);
  const [subjectsError, setSubjectsError] = useState("");

  const [subjectsWithLessons, setSubjectsWithLessons] = useState({});
  const [lessonProgress, setLessonProgress] = useState({});
  const [teacherGroups, setTeacherGroups] = useState([]);
  
  // Модальное окно создания курса
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseModalSaving, setCourseModalSaving] = useState(false);
  const [allGroups, setAllGroups] = useState([]);
  const [courseFormData, setCourseFormData] = useState({
    name: "",
    code: "",
    selectedGroups: [],
    color: "#3b82f6",
    image: null,
    imagePreview: null,
  });
  
  // Модальное окно редактирования курса
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editModalSaving, setEditModalSaving] = useState(false);

  // Load user progress from backend API instead of localStorage
  useEffect(() => {
    const loadProgress = async () => {
      if (!user?.id) {
        setLessonProgress({});
        return;
      }

      try {
        const summary = await progressApi.getUserProgress(user.id);
        const progressMap = {};

        if (summary?.lessons) {
          summary.lessons.forEach((lesson) => {
            progressMap[lesson.lesson_id] = lesson.completed;
          });
        }

        setLessonProgress(progressMap);
      } catch (error) {
        // Игнорируем ошибки прогресса (таблица может не существовать)
        console.warn("[MyCourses] Progress not available (table may not exist):", error.message);
        setLessonProgress({});
      }
    };

    loadProgress();
  }, [user?.id]);

  const loadSubjects = useCallback(async () => {
    setSubjectsLoading(true);
    setSubjectsError("");
    try {
      const response = await fetchSubjects({ size: 50 });
      const subjectsList = response.data?.subjects || [];
      // Логируем для отладки
      if (import.meta.env.DEV) {
        console.log('[MyCourses] Loaded subjects:', subjectsList.map(s => ({
          id: s.id,
          name: s.name,
          color: s.color,
          header_color: s.header_color,
          image_url: s.image_url,
          header_image: s.header_image,
          image_presigned_url: s.image_presigned_url,
          header_image_presigned_url: s.header_image_presigned_url,
          hasImage: !!(s.image || s.image_url || s.header_image),
          hasPresignedUrl: !!(s.image_presigned_url || s.header_image_presigned_url)
        })));
        // Проверяем первый subject с изображением
        const subjectWithImage = subjectsList.find(s => s.image || s.image_url || s.header_image);
        if (subjectWithImage) {
          console.log('[MyCourses] Sample subject with image:', {
            id: subjectWithImage.id,
            image: subjectWithImage.image,
            image_url: subjectWithImage.image_url,
            image_presigned_url: subjectWithImage.image_presigned_url,
            allKeys: Object.keys(subjectWithImage)
          });
        }
      }
      setSubjects(subjectsList);
    } catch (error) {
      setSubjectsError(error.message || "Не удалось загрузить список курсов");
    } finally {
      setSubjectsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSubjects();
  }, [loadSubjects]);

  const loadSubjectLessons = useCallback(
    async (subjectId) => {
      if (!subjectId || subjectsWithLessons[subjectId]) return;
      try {
        const response = await fetchSubjectWithLessons(subjectId);
        setSubjectsWithLessons((prev) => ({
          ...prev,
          [subjectId]: response.data?.lessons || [],
        }));
      } catch (error) {
        console.error("Не удалось загрузить уроки предмета:", error);
      }
    },
    [subjectsWithLessons]
  );

  useEffect(() => {
    subjects.forEach((subject) => {
      loadSubjectLessons(subject.id);
    });
  }, [subjects, loadSubjectLessons]);

  // Загружаем ВСЕ группы для выбора при создании курса
  useEffect(() => {
    const loadAllGroups = async () => {
      if (!isTeacher) return;
      
      try {
        // Загружаем ВСЕ группы с параметром all_groups=true
        // Загружаем все страницы, если групп больше чем size
        let allGroupsList = [];
        let page = 1;
        const size = 100;
        let hasMore = true;
        
        while (hasMore) {
          console.log(`[MyCourses] Loading groups page ${page}...`);
          const response = await groupsApi.getGroups({ 
            page: page, 
            size: size, 
            all_groups: true
          });
          
          console.log('[MyCourses] Groups API response:', response);
          const groups = response.data?.groups || [];
          const total = response.data?.total || 0;
          
          allGroupsList = [...allGroupsList, ...groups];
          console.log(`[MyCourses] Loaded ${groups.length} groups (total so far: ${allGroupsList.length}, total in DB: ${total})`);
          
          // Проверяем, есть ли еще страницы
          if (allGroupsList.length >= total || groups.length < size) {
            hasMore = false;
          } else {
            page++;
          }
        }
        
        console.log('[MyCourses] All groups loaded:', allGroupsList.length, allGroupsList);
        setAllGroups(allGroupsList);
      } catch (error) {
        console.error("Failed to load groups:", error);
        console.error("Error details:", error.message, error.status);
        setAllGroups([]);
      }
    };
    
    loadAllGroups();
  }, [isTeacher]);

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 mt-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Назначенные курсы
            </h1>
            <p className="text-gray-600">
              Изучайте назначенные вам курсы и развивайте свои навыки
              программирования
            </p>
          </div>

          {subjectsError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              {subjectsError}
            </div>
          )}

          {subjectsLoading ? (
            <div className="text-center text-gray-500 py-24">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              Загрузка курсов...
            </div>
          ) : subjects.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Курсы пока не созданы
              </h3>
              <p className="text-gray-600">Обратитесь к администратору</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-items-start">
              {subjects.map((subject) => {
                const subjectLessons = subjectsWithLessons[subject.id] || [];
                const subjectCompleted = subjectLessons.filter(
                  (l) => lessonProgress[l.id]
                ).length;
                const subjectProgress =
                  subjectLessons.length > 0
                    ? Math.round(
                        (subjectCompleted / subjectLessons.length) * 100
                      )
                    : 0;

                return (
                  <div
                    key={subject.id}
                    className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow flex flex-col h-full"
                    style={{ width: '384px' }}
                  >
                    <div 
                      className="h-40 flex items-center justify-center flex-shrink-0 relative overflow-hidden"
                      style={{ 
                        backgroundColor: subject.color || subject.header_color || '#3b82f6',
                      }}
                    >
                      {/* Показываем изображение через proxy endpoint на backend */}
                      {(() => {
                        const hasImage = subject.image || subject.image_url || subject.header_image;
                        
                        if (hasImage) {
                          // Всегда используем proxy endpoint на backend с полным URL
                          const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                          const imageUrl = `${apiBaseUrl}/api/v1/subjects/${subject.id}/image`;
                          
                          return (
                            <img 
                              src={imageUrl}
                              alt={subject.name}
                              className="absolute inset-0 w-full h-full object-cover"
                              onError={(e) => {
                                console.error('[MyCourses] Failed to load image:', imageUrl, e);
                                e.target.style.display = 'none';
                              }}
                              onLoad={() => {
                                console.log('[MyCourses] Image loaded successfully for subject:', subject.id);
                              }}
                            />
                          );
                        } else {
                          return (
                            <BookOpen className="w-12 h-12 text-white relative z-10" />
                          );
                        }
                      })()}
                      {isTeacher && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSubject(subject);
                            setEditModalOpen(true);
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-white/20 hover:bg-white/30 rounded backdrop-blur-sm transition-colors"
                          title="Редактировать курс"
                        >
                          <Edit2 className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-grow">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 break-words line-clamp-3 min-h-[4.5rem]">
                        {subject.name}
                      </h3>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">
                            Прогресс
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {subjectProgress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${subjectProgress}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-2 mb-4 text-sm text-gray-600 flex-grow">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span>
                            {subjectCompleted}/{subjectLessons.length || 0}{" "}
                            уроков
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onPageChange &&
                            onPageChange("journal-detail", {
                              courseId: subject.id,
                            });
                        }}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium mt-auto"
                      >
                        Продолжить
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Кнопка "Добавить курс" для преподавателей */}
          {isTeacher && (
            <div className="fixed bottom-8 right-8 z-40">
              <button
                onClick={() => {
                  setCourseModalOpen(true);
                  setCourseFormData({ name: "", code: "", selectedGroups: [] });
                }}
                className="bg-blue-600 text-white rounded-lg px-6 py-3 shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                title="Добавить курс для групп"
              >
                <Plus className="w-5 h-5" />
                Добавить курс
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Модальное окно создания курса */}
      {courseModalOpen && (
        <CourseModal
          isOpen={courseModalOpen}
          onClose={() => {
            setCourseModalOpen(false);
            setCourseFormData({ name: "", code: "", selectedGroups: [] });
          }}
          onSubmit={async (formData) => {
            setCourseModalSaving(true);
            let subjectCreated = false;
            let createdSubject = null;
            try {
              const codeValue = formData.code?.trim() || formData.name.substring(0, 4).toUpperCase();
              const payload = {
                name: formData.name.trim(),
                code: codeValue.length > 100 ? codeValue.substring(0, 100) : codeValue,
              };

              // Добавляем color в payload, если он был изменен
              if (formData.color && formData.color !== "#3b82f6") {
                payload.color = formData.color;
              }

              // Создаем subject — основная операция
              const response = await createSubject(payload);
              const newSubject = response.data;
              createdSubject = newSubject;
              subjectCreated = true;

              // Закрываем модалку сразу после успешного создания курса
              setCourseModalOpen(false);
              setCourseFormData({ name: "", code: "", selectedGroups: [] });

              // Если выбрано изображение, загружаем его (не блокирует)
              if (formData.image && formData.image instanceof File && newSubject?.id) {
                try {
                  await uploadSubjectImage(newSubject.id, formData.image);
                } catch (imageError) {
                  console.error('[MyCourses] Failed to upload image for new subject:', imageError);
                }
              }

              // Назначаем курс выбранным группам (отдельный блок try — не блокирует отображение)
              if (formData.selectedGroups.length > 0 && user?.id && newSubject?.id) {
                try {
                  const assignmentPromises = formData.selectedGroups.map(groupId =>
                    createTeacherAssignment({
                      teacher_id: user.id,
                      subject_id: newSubject.id,
                      group_id: Number(groupId),
                      is_curator: false,
                    })
                  );
                  await Promise.all(assignmentPromises);
                } catch (assignError) {
                  console.warn('[MyCourses] Failed to assign groups (course was created):', assignError);
                  // Курс создан — просто тихо логируем, курс уже виден в списке
                }
              }
            } catch (error) {
              // Сюда попадаем только если упало создание самого курса
              if (!subjectCreated) {
                console.error("Failed to create course:", error);
                let errorMessage = "Неизвестная ошибка";
                if (error.isCorsError || (error.isNetworkError && error.message?.includes('CORS'))) {
                  errorMessage = "Ошибка CORS: Backend не настроен для работы с фронтендом. Обратитесь к администратору.";
                } else if (error.isNetworkError) {
                  errorMessage = `Не удалось подключиться к API. Проверьте, что backend запущен (${import.meta.env.VITE_API_URL || 'http://localhost:8000'})`;
                } else if (error.status === 413) {
                  errorMessage = "Файл изображения слишком большой.";
                } else if (error.status === 422) {
                  errorMessage = "Ошибка валидации. Проверьте введённые данные.";
                } else if (error.message) {
                  errorMessage = error.message;
                }
                alert("Не удалось создать курс: " + errorMessage);
              }
            } finally {
              setCourseModalSaving(false);
              // Обновляем список курсов с бэкенда
              await loadSubjects();
              // Если курс создан но бэкенд его не вернул (нет teacher_assignment) — добавляем вручную
              if (createdSubject) {
                setSubjects(prev => {
                  const exists = prev.some(s => s.id === createdSubject.id);
                  return exists ? prev : [...prev, createdSubject];
                });
              }
            }
          }}
          groups={allGroups}
          loading={courseModalSaving}
        />
      )}

      {/* Модальное окно редактирования курса */}
      {editModalOpen && editingSubject && (
        <CourseModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setEditingSubject(null);
          }}
          onSubmit={async (formData) => {
            setEditModalSaving(true);
            try {
              const payload = {
                name: formData.name.trim(),
                code: formData.code?.trim() || editingSubject.code,
              };
              
              // Добавляем color в payload, если он был изменен
              if (formData.color && formData.color !== "#3b82f6") {
                payload.color = formData.color;
              } else if (formData.color === "#3b82f6" && editingSubject?.color && editingSubject.color !== "#3b82f6") {
                // Если цвет сброшен к дефолтному, отправляем дефолтный
                payload.color = "#3b82f6";
              }
              
              // Обрабатываем изображение
              if (formData.removeImage) {
                // Удаляем изображение - отправляем null
                payload.image = null;
              } else if (formData.image && formData.image instanceof File) {
                // Загружаем новое изображение на сервер
                try {
                  console.log('[MyCourses] Uploading image for subject:', editingSubject.id, 'File:', formData.image.name, formData.image.size);
                  const imageUploadResponse = await uploadSubjectImage(editingSubject.id, formData.image);
                  console.log('[MyCourses] Image uploaded successfully:', imageUploadResponse);
                  console.log('[MyCourses] Full response structure:', JSON.stringify(imageUploadResponse, null, 2));
                  
                  // Response от загрузки изображения содержит обновленный subject
                  const updatedSubjectFromImage = imageUploadResponse?.data || imageUploadResponse;
                  console.log('[MyCourses] Extracted subject data:', updatedSubjectFromImage);
                  
                  if (updatedSubjectFromImage) {
                    // Получаем presigned URL из response (приоритет) или обычный URL
                    const presignedUrl = imageUploadResponse?.image_presigned_url || 
                                        updatedSubjectFromImage.image_presigned_url ||
                                        updatedSubjectFromImage.header_image_presigned_url;
                    
                    const imageUrl = presignedUrl || 
                                    updatedSubjectFromImage.image_url || 
                                    updatedSubjectFromImage.header_image || 
                                    updatedSubjectFromImage.image ||
                                    updatedSubjectFromImage.header_image_url;
                    
                    console.log('[MyCourses] Extracted image URL:', imageUrl);
                    console.log('[MyCourses] Presigned URL:', presignedUrl);
                    
                    // Обновляем состояние сразу после загрузки изображения
                    setSubjects((prevSubjects) => {
                      const updated = prevSubjects.map((subject) =>
                        subject.id === editingSubject.id
                          ? {
                              ...subject,
                              image_url: imageUrl || subject.image_url,
                              header_image: imageUrl || subject.header_image,
                              image_presigned_url: presignedUrl || subject.image_presigned_url,
                              header_image_presigned_url: presignedUrl || subject.header_image_presigned_url,
                            }
                          : subject
                      );
                      console.log('[MyCourses] Updated subjects state after image upload:', updated.find(s => s.id === editingSubject.id));
                      return updated;
                    });
                  }
                } catch (imageError) {
                  console.error('[MyCourses] Failed to upload image:', imageError);
                  // Не блокируем обновление курса, просто логируем
                }
              }
              
              // Обновляем subject (name, code, color)
              const updateResponse = await updateSubject(editingSubject.id, payload);
              
              // Обновляем состояние из response обновления (может содержать актуальные данные)
              const updatedSubjectFromUpdate = updateResponse.data || updateResponse;
              if (updatedSubjectFromUpdate) {
                setSubjects((prevSubjects) =>
                  prevSubjects.map((subject) =>
                    subject.id === editingSubject.id
                      ? {
                          ...subject,
                          name: updatedSubjectFromUpdate.name || subject.name,
                          code: updatedSubjectFromUpdate.code || subject.code,
                          color: updatedSubjectFromUpdate.color || updatedSubjectFromUpdate.header_color || subject.color || subject.header_color,
                          // Сохраняем presigned URL если он был установлен при загрузке изображения
                          image_presigned_url: subject.image_presigned_url || updatedSubjectFromUpdate.image_presigned_url,
                          header_image_presigned_url: subject.header_image_presigned_url || updatedSubjectFromUpdate.header_image_presigned_url,
                        }
                      : subject
                  )
                );
              }
              
              setEditModalOpen(false);
              setEditingSubject(null);
              
              // Обновляем список курсов для получения актуальных данных (включая presigned URLs)
              // Backend должен вернуть presigned URLs для всех subjects с изображениями
              await loadSubjects();
            } catch (error) {
              console.error("Failed to update course:", error);
              console.error("Error details:", {
                message: error.message,
                status: error.status,
                isNetworkError: error.isNetworkError,
                isCorsError: error.isCorsError,
                payload: error.payload
              });
              
              let errorMessage = "Неизвестная ошибка";
              if (error.isCorsError || (error.isNetworkError && error.message.includes('CORS'))) {
                errorMessage = "Ошибка CORS: Backend не настроен для работы с фронтендом. Обратитесь к администратору.";
              } else if (error.isNetworkError) {
                errorMessage = `Не удалось подключиться к API. Проверьте, что backend запущен (${import.meta.env.VITE_API_URL || 'http://localhost:8000'})`;
              } else if (error.message) {
                errorMessage = error.message;
              } else if (error.status === 413) {
                errorMessage = "Файл изображения слишком большой. Попробуйте загрузить изображение меньшего размера.";
              } else if (error.status === 422) {
                errorMessage = "Ошибка валидации данных. Проверьте введенные данные.";
              } else if (error.status === 404) {
                errorMessage = "Курс не найден. Возможно, он был удален.";
              } else if (error.status === 500) {
                errorMessage = "Внутренняя ошибка сервера. Возможно, проблема с обработкой данных.";
              }
              
              alert("Не удалось обновить курс: " + errorMessage);
            } finally {
              setEditModalSaving(false);
            }
          }}
          groups={allGroups}
          loading={editModalSaving}
          editingSubject={editingSubject}
        />
      )}
    </div>
  );
};

// Модальное окно создания/редактирования курса
const CourseModal = ({ isOpen, onClose, onSubmit, groups, loading, editingSubject = null }) => {
  const [formData, setFormData] = useState({
    name: "",
    code: "",
    selectedGroups: [],
    color: "#3b82f6",
    image: null,
    imagePreview: null,
    removeImage: false, // Флаг для удаления существующего изображения
  });

  useEffect(() => {
    if (isOpen) {
      if (editingSubject) {
        setFormData({
          name: editingSubject.name || "",
          code: editingSubject.code || "",
          selectedGroups: [],
          color: editingSubject.color || editingSubject.header_color || "#3b82f6",
          image: null,
          imagePreview: editingSubject.image_url || editingSubject.header_image || null,
          removeImage: false,
        });
      } else {
        setFormData({ 
          name: "", 
          code: "", 
          selectedGroups: [],
          color: "#3b82f6",
          image: null,
          imagePreview: null,
          removeImage: false,
        });
      }
    }
  }, [isOpen, editingSubject]);

  const handleGroupToggle = (groupId) => {
    setFormData((prev) => {
      const currentGroups = prev.selectedGroups || [];
      if (currentGroups.includes(groupId)) {
        return { ...prev, selectedGroups: currentGroups.filter(id => id !== groupId) };
      } else {
        return { ...prev, selectedGroups: [...currentGroups, groupId] };
      }
    });
  };

  const handleSubmit = () => {
    if (!formData.name || !formData.name.trim()) {
      alert("Пожалуйста, введите название курса");
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl p-6 my-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            {editingSubject ? "Редактировать курс" : "Новый курс"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600 transition-colors"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Название курса <span className="text-red-500">*</span>
            </label>
            <input
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Введите название курса"
              disabled={loading}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Код курса <span className="text-gray-500 text-xs">(максимум 100 символов)</span>
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => {
                const value = e.target.value;
                // Ограничиваем до 100 символов
                if (value.length <= 100) {
                  setFormData((prev) => ({ ...prev, code: value }));
                }
              }}
              maxLength={100}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Автоматически или введите вручную"
              disabled={loading}
            />
            {formData.code && formData.code.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.code.length}/100 символов
              </p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Оформление курса
            </label>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Цвет фона
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                    disabled={loading}
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (/^#[0-9A-Fa-f]{0,6}$/.test(value) || value === '') {
                        setFormData((prev) => ({ ...prev, color: value || '#3b82f6' }));
                      }
                    }}
                    className="flex-1 rounded border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="#3b82f6"
                    disabled={loading}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1.5 flex items-center gap-1">
                  <Image className="w-3 h-3" />
                  Изображение (опционально)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData((prev) => ({
                          ...prev,
                          image: file,
                          imagePreview: reader.result,
                        }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-xs text-gray-600 file:mr-4 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  disabled={loading}
                />
                {formData.imagePreview && (
                  <div className="mt-2 relative">
                    <img
                      src={formData.imagePreview}
                      alt="Preview"
                      className="w-full h-20 object-cover rounded border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (editingSubject && (editingSubject.image_url || editingSubject.header_image)) {
                          // Если редактируем и было изображение, помечаем для удаления
                          setFormData((prev) => ({ 
                            ...prev, 
                            image: null, 
                            imagePreview: null,
                            removeImage: true 
                          }));
                        } else {
                          // Если просто новое изображение, просто удаляем
                          setFormData((prev) => ({ 
                            ...prev, 
                            image: null, 
                            imagePreview: null,
                            removeImage: false 
                          }));
                        }
                      }}
                      className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      disabled={loading}
                      title="Удалить изображение"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Выберите цвет фона или загрузите изображение. Изображение имеет приоритет над цветом.
            </p>
          </div>

          {!editingSubject && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Выберите группы
              </label>
            <div className="border border-gray-300 rounded max-h-60 overflow-y-auto p-3 space-y-2">
              {groups.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-4">Группы не найдены</p>
              ) : (
                groups.map((group) => (
                  <label
                    key={group.id}
                    className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.selectedGroups.includes(group.id)}
                      onChange={() => handleGroupToggle(group.id)}
                      disabled={loading}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{group.name}</span>
                    {group.student_count !== undefined && (
                      <span className="text-xs text-gray-500 ml-auto">
                        ({group.student_count} студентов)
                      </span>
                    )}
                  </label>
                ))
              )}
            </div>
          </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4 mt-6 border-t">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-2 rounded bg-blue-600 text-sm text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (editingSubject ? "Сохранение..." : "Создание...") : (editingSubject ? "Сохранить" : "Создать")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyCourses;
