import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../hooks/useAuth.jsx";
import { getCourseJournal } from "../utils/auth.js";
import { fetchSubjectWithLessons, createLesson, createLessonMaterial, generateQuestionsFromMaterials, createQuestion, generatePracticeTasksFromMaterials } from "../utils/curriculumApi.js";
import { createTask } from "../utils/tasksApi.js";
import { lessonProgressApi } from "../utils/lessonProgressApi.js";
import { ArrowLeft, Plus, FileText, Video, File, Upload, X, BookOpen, RefreshCw, CheckCircle, Play, CheckSquare, Code, ArrowRight, Sparkles, Search } from "lucide-react";
import { useLanguage } from "../i18n.jsx";

// AI Skeleton Loader Component for Question Generation
const QuestionSkeletonLoader = () => {
  const [statusIndex, setStatusIndex] = useState(0);
  
  const statusMessages = [
    "Анализируем теорию…",
    "Подбираем вопросы под материал…",
    "Генерация уникальных заданий…",
    "Почти готово…"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStatusIndex((prev) => (prev + 1) % statusMessages.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 w-full">
      {/* Dynamic Status Text */}
      <div className="mb-4 min-h-[20px]">
        <div 
          key={statusIndex}
          className="text-sm font-medium text-blue-700"
          style={{
            animation: 'fadeInOut 0.8s ease-in-out'
          }}
        >
          {statusMessages[statusIndex]}
        </div>
      </div>

      {/* Skeleton Question Cards - matches actual question layout */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {[1, 2, 3, 4, 5].map((cardIndex) => (
          <div
            key={cardIndex}
            className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
            style={{
              animation: `fadeInUp 0.4s ease-out forwards`,
              animationDelay: `${cardIndex * 0.08}s`,
              opacity: 0
            }}
          >
            {/* Question Text Skeleton - matches text-sm font-medium */}
            <div className="mb-2">
              <div className="h-4 bg-gray-200 rounded skeleton-shimmer" style={{ width: '90%' }}></div>
              <div className="h-4 bg-gray-200 rounded skeleton-shimmer mt-1.5" style={{ width: '75%' }}></div>
            </div>

            {/* Answer Options Skeleton - matches space-y-1 and p-2 rounded text-sm */}
            <div className="space-y-1">
              {[1, 2, 3, 4].map((optIndex) => (
                <div
                  key={optIndex}
                  className="p-2 rounded bg-white border border-gray-200"
                  style={{
                    animation: `fadeIn 0.3s ease-out forwards`,
                    animationDelay: `${(cardIndex * 0.08) + (optIndex * 0.04)}s`,
                    opacity: 0
                  }}
                >
                  <div className="h-3.5 bg-gray-200 rounded skeleton-shimmer" style={{ width: `${65 + optIndex * 8}%` }}></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fadeInOut {
          0% {
            opacity: 0;
            transform: translateY(4px);
          }
          15%, 85% {
            opacity: 1;
            transform: translateY(0);
          }
          100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }
        
        .skeleton-shimmer {
          position: relative;
          overflow: hidden;
        }
        
        .skeleton-shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.6),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }
        
        @keyframes shimmer {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }
        
        .animate-fade-in {
          animation: fadeInOut 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};

const JournalDetail = ({ onPageChange, courseId }) => {
  const { t } = useLanguage();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [lessonStatuses, setLessonStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Lesson creation state
  const [lessonModalOpen, setLessonModalOpen] = useState(false);
  const [lessonModalSaving, setLessonModalSaving] = useState(false);
  
  // Check if user is teacher
  const isTeacher = user?.role === "teacher";

    const loadData = useCallback(async () => {
      if (!user || !courseId) return;

      setLoading(true);
      setError(null);

      try {
        // 1. Fetch Course Details and Lessons
        const subjectResponse = await fetchSubjectWithLessons(courseId);
        const subjectData = subjectResponse.data || {};
        setCourse(subjectData);

      const lessonsList = subjectData.lessons || [];
      setLessons(lessonsList);

      // 2. Load lesson statuses for each lesson (only for students)
      // Оптимизация: загружаем статусы параллельно, но с ограничением на количество одновременных запросов
      if (user?.role === "student" && lessonsList.length > 0) {
        // Загружаем статусы параллельно (браузер сам ограничит количество одновременных соединений)
        const statusPromises = lessonsList.map(async (lesson) => {
          try {
            const status = await lessonProgressApi.getLessonStatus(lesson.id);
            return { lessonId: lesson.id, status: status.data };
          } catch (err) {
            console.error(`Failed to load status for lesson ${lesson.id}:`, err);
            return { lessonId: lesson.id, status: null };
          }
        });

        const statuses = await Promise.all(statusPromises);
        const statusMap = {};
        statuses.forEach(({ lessonId, status }) => {
          statusMap[lessonId] = status;
        });
        setLessonStatuses(statusMap);
      } else {
        // Для преподавателей и админов не загружаем статус
        setLessonStatuses({});
      }
      } catch (err) {
        console.error("Failed to load course details:", err);
        setError("Не удалось загрузить данные курса.");
      } finally {
        setLoading(false);
      }
    }, [user, courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBack = () => {
    // Переходим в раздел "Мои курсы" вместо "Журнал"
    if (onPageChange) {
      onPageChange("courses");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Загрузка данных курса...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={handleBack}
            className="mt-4 text-blue-600 hover:underline"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Назад к курсам</span>
          </button>

          {/* Course Header */}
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course?.code ? `${course.code} - ` : ""}{course?.name || "Курс"}
            </h1>
            {course?.description && (
              <p className="text-gray-600 text-lg">
                {course.description}
              </p>
            )}
          </div>

          {/* Course Progress */}
          {lessons.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-900">Прогресс курса</h2>
                <span className="text-lg font-semibold text-gray-900">
                  {Math.round(
                    (lessons.filter((l) => lessonStatuses[l.id]?.completed).length / lessons.length) * 100
                  )}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${Math.round(
                      (lessons.filter((l) => lessonStatuses[l.id]?.completed).length / lessons.length) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Lessons List */}
          {lessons.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">
                В этом курсе пока нет уроков.
              </p>
            </div>
          ) : (
            <div className="space-y-6 mb-20">
              {lessons.map((lesson, index) => {
                const status = lessonStatuses[lesson.id];
                // Для преподавателей и админов показываем, что урок не завершен
                const isCompleted = user?.role === "student" ? (status?.completed || false) : false;
                const testScore = user?.role === "student" ? (status?.test_score || 0) : 0;
                const practiceScore = user?.role === "student" ? (status?.practice_score || 0) : 0;

                return (
                  <div
                    key={lesson.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 flex items-start gap-4 hover:shadow-md transition-shadow mb-4"
                  >
                    {/* Icon */}
                    <div className="flex-shrink-0">
                      {isCompleted ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <BookOpen className="w-8 h-8 text-blue-500" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Урок {index + 1} - {lesson.title}
                      </h3>
                      {lesson.description && (
                        <p className="text-gray-600 mb-4">{lesson.description}</p>
                      )}

                      {/* Progress Indicators */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Тестирование</span>
                          {testScore > 0 ? (
                            <span className="ml-2 text-blue-600 font-semibold">{testScore}%</span>
                          ) : (
                            <span className="ml-2 text-gray-400">—</span>
                          )}
                        </div>
                        <div>
                          <span className="font-medium">Решение задач</span>
                          {practiceScore > 0 ? (
                            <span className="ml-2 text-blue-600 font-semibold">{practiceScore}%</span>
                          ) : (
                            <span className="ml-2 text-gray-400">—</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0">
                        <button
                          onClick={() => {
                            onPageChange &&
                              onPageChange("lesson-detail", {
                              lessonId: lesson.id,
                              });
                          }}
                        className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                          isCompleted
                            ? "bg-green-600 text-white hover:bg-green-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        }`}
                        >
                        {isCompleted ? "Повторить" : "Начать урок"}
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Add Lesson Button at bottom (only for teachers) */}
      {isTeacher && (
        <div className="fixed bottom-8 right-8 z-40">
          <button
            onClick={() => {
              console.log('[JournalDetail] Opening lesson modal, courseId:', courseId);
              if (!courseId) {
                alert("Ошибка: курс не выбран");
                return;
              }
              setLessonModalOpen(true);
            }}
            className="bg-blue-600 text-white rounded-lg px-6 py-3 shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            title="Добавить урок"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Добавить урок</span>
          </button>
        </div>
      )}

      {/* Lesson Modal */}
      {isTeacher && lessonModalOpen && (
        <LessonModal
          isOpen={lessonModalOpen}
          onClose={() => {
            setLessonModalOpen(false);
          }}
          course={{ id: courseId }}
          onLessonCreated={async () => {
            await loadData();
            setLessonModalOpen(false);
          }}
          initialData={null}
          loading={lessonModalSaving}
        />
      )}
    </div>
  );
};

// LessonModal component
const LessonModal = ({ isOpen, onClose, initialData, course, loading, onLessonCreated }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    theory_text: "",
    theory_link: "",
    theory_document: null,
    video_url: "",
    // Этап 2: Тестирование
    questionsCount: 40,
    testing_topic: "",
    testing_info: "",
    generatedQuestions: [],
  });
  const [error, setError] = useState("");
  const [documentFileName, setDocumentFileName] = useState("");
  const [generatingQuestions, setGeneratingQuestions] = useState(false);
  const [savingLesson, setSavingLesson] = useState(false);
  const [savedLessonId, setSavedLessonId] = useState(null);
  const [generatingTasks, setGeneratingTasks] = useState(false);
  const [practiceDocumentFileName, setPracticeDocumentFileName] = useState("");
  const [backgroundGenerating, setBackgroundGenerating] = useState(false); // Фоновая генерация

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: initialData?.title || "",
        description: initialData?.description || "",
        theory_text: "",
        theory_document: null,
        video_url: initialData?.video_url || "",
        questionsCount: 40,
        testing_topic: "",
        testing_info: "",
        generatedQuestions: [],
        practiceMode: null, // "upload" or "ai"
        practiceDocument: null,
        practiceDocumentFileName: "",
        generatedTasks: [],
      });
      setDocumentFileName("");
      setPracticeDocumentFileName("");
      setError("");
      setCurrentStep(1);
      setSavedLessonId(null);
      setSavingLesson(false);
      setGeneratingQuestions(false);
      setGeneratingTasks(false);
    }
  }, [isOpen, initialData]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedExtensions = ['pdf', 'docx', 'pptx', 'txt'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedExtensions.includes(fileExtension)) {
        setError("Поддерживаются только файлы: PDF, DOCX, PPTX, TXT");
        return;
      }
      
      if (file.size > 50 * 1024 * 1024) { // 50MB
        setError("Размер файла не должен превышать 50 МБ");
        return;
      }
      
      setFormData((prev) => ({ ...prev, theory_document: file }));
      setDocumentFileName(file.name);
      setError("");
    }
  };

  const handleRemoveDocument = () => {
    setFormData((prev) => ({ ...prev, theory_document: null }));
    setDocumentFileName("");
  };

  // Функция очистки теории от артефактов и повторений
  const cleanTheoryText = (text) => {
    if (!text || typeof text !== 'string') return '';
    
    let cleaned = text;
    
    // Удаляем HTML теги
    cleaned = cleaned.replace(/<[^>]+>/g, '');
    
    // Удаляем артефакты типа code-keyword='code-keyword'
    cleaned = cleaned.replace(/code-keyword\s*=\s*['"]code-keyword['"]/g, '');
    cleaned = cleaned.replace(/code-keyword\s*=\s*code-keyword/g, '');
    cleaned = cleaned.replace(/"code-keyword">/g, '');
    cleaned = cleaned.replace(/'code-keyword'>/g, '');
    cleaned = cleaned.replace(/code-keyword">/g, '');
    cleaned = cleaned.replace(/="code-keyword">/g, '');
    cleaned = cleaned.replace(/='code-keyword'>/g, '');
    
    // Удаляем все code-* и line-* артефакты
    cleaned = cleaned.replace(/[\w-]+\s*=\s*['"][\w-]+['"]/g, '');
    cleaned = cleaned.replace(/"code-[\w-]+">/g, '');
    cleaned = cleaned.replace(/'code-[\w-]+'>/g, '');
    cleaned = cleaned.replace(/code-[\w-]+">/g, '');
    cleaned = cleaned.replace(/"line-[\w-]+">/g, '');
    cleaned = cleaned.replace(/line-[\w-]+">/g, '');
    
    // Удаляем повторяющиеся слова (3+ раза подряд)
    cleaned = cleaned.replace(/\b(\w+)(\s+\1){2,}\b/gi, '$1');
    
    // Удаляем множественные пробелы
    cleaned = cleaned.replace(/\s+/g, ' ');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
    
    return cleaned.trim();
  };

  // Сохранение урока на этапе 1 (чтобы получить lessonId для генерации вопросов)
  const handleSaveLessonForQuestions = async () => {
    setError("");
    if (!formData.title || !formData.title.trim()) {
      setError("Пожалуйста, введите название урока");
      return;
    }

    if (!course?.id) {
      setError("Ошибка: курс не выбран");
      return;
    }

    setSavingLesson(true);
    try {
      const lessonData = {
        title: formData.title.trim(),
        description: formData.description?.trim() || "",
        subject_id: course.id,
      };

      const response = await createLesson(lessonData);
      const newLessonId = response.data?.id || response.id;
      
      if (!newLessonId) {
        throw new Error("Не удалось получить ID созданного урока");
      }
      
      setSavedLessonId(newLessonId);

      // Сохраняем материалы
      const materialPromises = [];
      
      if (formData.theory_text?.trim()) {
        let trimmedText = formData.theory_text.trim();
        
        // Очистка теории от артефактов и повторений перед сохранением
        trimmedText = cleanTheoryText(trimmedText);
        
        if (trimmedText.length < 100) {
          console.warn(`[JournalDetail] Theory text is too short: ${trimmedText.length} characters (minimum 100 required for AI generation)`);
          // Все равно сохраняем, но предупреждаем
        }
        const textForm = new FormData();
        textForm.append('title', 'Теория (текст)');
        textForm.append('type', 'text');
        textForm.append('content', trimmedText);
        textForm.append('use_for_ai_generation', 'true'); // Помечаем для генерации вопросов
        console.log(`[JournalDetail] Creating text material with ${trimmedText.length} characters`);
        materialPromises.push(createLessonMaterial(newLessonId, textForm));
      }

      if (formData.theory_document) {
        const docForm = new FormData();
        // Определяем тип файла по расширению
        const fileExtension = formData.theory_document.name.split('.').pop().toLowerCase();
        let materialType = 'file'; // По умолчанию
        if (fileExtension === 'pdf') materialType = 'pdf';
        else if (fileExtension === 'docx') materialType = 'docx';
        else if (fileExtension === 'pptx') materialType = 'pptx';
        else if (fileExtension === 'txt') materialType = 'txt';
        
        docForm.append('title', formData.theory_document.name);
        docForm.append('type', materialType);
        docForm.append('file', formData.theory_document);
        docForm.append('use_for_ai_generation', 'true'); // Помечаем для генерации вопросов
        materialPromises.push(createLessonMaterial(newLessonId, docForm));
      }

      if (formData.video_url?.trim()) {
        const videoForm = new FormData();
        videoForm.append('title', 'Видео');
        videoForm.append('type', 'youtube');
        videoForm.append('youtube_url', formData.video_url.trim());
        materialPromises.push(createLessonMaterial(newLessonId, videoForm));
      }

      // Сохраняем все материалы параллельно
      if (materialPromises.length > 0) {
        try {
          const savedMaterials = await Promise.all(materialPromises);
          console.log(`[JournalDetail] Successfully saved ${materialPromises.length} materials:`, savedMaterials);
          
          // Проверяем, что хотя бы один материал помечен для AI генерации
          const textMaterial = formData.theory_text?.trim();
          const hasDocument = formData.theory_document;
          const hasTextForAI = textMaterial && textMaterial.length >= 100;
          
          if (!hasTextForAI && !hasDocument) {
            setError("Для генерации вопросов необходимо добавить текст теории (минимум 100 символов) или загрузить документ с теорией.");
            setSavingLesson(false);
            return;
          }
          
          // Небольшая задержка для обработки документов на сервере (уменьшено с 2000ms до 500ms)
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Начинаем фоновую генерацию вопросов и задач сразу после сохранения материалов
          console.log('[JournalDetail] Starting background generation of questions and tasks...');
          setBackgroundGenerating(true);
          
          // Запускаем генерацию вопросов и задач параллельно в фоне
          Promise.all([
            // Генерация вопросов - ТОЧНОЕ количество
            (async () => {
              try {
                const requestedCount = formData.questionsCount || 40;
                
                // ВАЖНО: Очищаем старые вопросы ПЕРЕД генерацией новых
                setFormData((prev) => ({ ...prev, generatedQuestions: [] }));
                
                console.log(`[JournalDetail] Background: Generating exactly ${requestedCount} questions (old questions cleared)...`);
                const response = await generateQuestionsFromMaterials(newLessonId, requestedCount);
                const allQuestions = response.data?.questions || response.questions || [];
                
                // Берем ТОЛЬКО указанное количество (не больше, не меньше)
                const questions = allQuestions.slice(0, requestedCount);
                
                if (questions.length === requestedCount) {
                  // Генерировано ровно столько, сколько нужно
                  setFormData((prev) => ({ ...prev, generatedQuestions: questions }));
                  setGeneratingQuestions(false);
                  setBackgroundGenerating(false);
                  console.log(`[JournalDetail] Background: Generated exactly ${questions.length} questions as requested`);
                } else if (questions.length > 0) {
                  // Генерировано меньше чем запрошено - используем что есть
                  setFormData((prev) => ({ ...prev, generatedQuestions: questions }));
                  setGeneratingQuestions(false);
                  setBackgroundGenerating(false);
                  console.warn(`[JournalDetail] Background: Generated only ${questions.length} questions (requested: ${requestedCount})`);
                }
              } catch (error) {
                console.warn('[JournalDetail] Background question generation failed:', error);
                setGeneratingQuestions(false);
                setBackgroundGenerating(false);
              }
            })(),
            // Генерация практических задач
            (async () => {
              try {
                console.log('[JournalDetail] Background: Generating practice tasks...');
                const response = await generatePracticeTasksFromMaterials(newLessonId, 30);
                const tasks = response.data?.tasks || response.tasks || [];
                if (tasks.length > 0) {
                  setFormData((prev) => ({ ...prev, generatedTasks: tasks }));
                  console.log(`[JournalDetail] Background: Generated ${tasks.length} practice tasks`);
                }
              } catch (error) {
                console.warn('[JournalDetail] Background task generation failed:', error);
                // Не показываем ошибку пользователю, просто логируем
              }
            })()
          ]).finally(() => {
            setBackgroundGenerating(false);
            console.log('[JournalDetail] Background generation completed');
          });
          
        } catch (error) {
          console.error('[JournalDetail] Error saving materials:', error);
          throw new Error("Не удалось сохранить материалы урока: " + (error.message || "Неизвестная ошибка"));
        }
      } else {
        // Предупреждаем пользователя, что нужно добавить материалы
        console.warn('[JournalDetail] No materials to save');
        const hasAnyContent = formData.theory_text?.trim() || formData.theory_document || formData.video_url?.trim();
        if (!hasAnyContent) {
          setError("Пожалуйста, добавьте хотя бы один материал (текст теории, документ или видео) перед переходом к следующему этапу.");
          setSavingLesson(false);
          return;
        }
        // Если есть контент, но он не был сохранен (например, только видео), предупреждаем
        if (!formData.theory_text?.trim() && !formData.theory_document) {
          setError("Для генерации вопросов необходимо добавить текст теории (минимум 100 символов) или загрузить документ. Видео не используется для генерации вопросов.");
          setSavingLesson(false);
          return;
        }
      }

      setCurrentStep(2);
    } catch (error) {
      console.error("Failed to save lesson:", error);
      setError("Не удалось сохранить урок: " + (error.message || "Неизвестная ошибка"));
      throw error; // Пробрасываем ошибку, чтобы handleNext мог её обработать
    } finally {
      setSavingLesson(false);
    }
  };

  // Генерация вопросов (можно вызывать несколько раз для перегенерации)
  const handleGenerateQuestions = async () => {
    if (!savedLessonId) {
      setError("Сначала сохраните урок");
      return;
    }

    // Очищаем старые вопросы перед генерацией (чтобы не суммировались)
    setFormData((prev) => ({ ...prev, generatedQuestions: [] }));
    
    setGeneratingQuestions(true);
    setError("");
    try {
      console.log(`[JournalDetail] Generating questions for lesson ${savedLessonId}`);
      
      // Небольшая задержка для обработки документов на сервере (уменьшено с 2000ms до 500ms)
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Генерируем ТОЧНОЕ количество вопросов, указанное преподавателем
      const requestedCount = formData.questionsCount || 40;
      
      // ВАЖНО: Очищаем старые вопросы ПЕРЕД генерацией новых
      setFormData((prev) => ({ ...prev, generatedQuestions: [] }));
      
      console.log(`[JournalDetail] Generating exactly ${requestedCount} questions (old questions cleared)...`);
      const response = await generateQuestionsFromMaterials(savedLessonId, requestedCount);
      console.log('[JournalDetail] Generate questions response:', response);
      
      // Обрабатываем ответ от нового эндпоинта
      const allQuestions = response.data?.questions || response.questions || [];
      
      // Берем ТОЛЬКО указанное количество (не больше, не меньше)
      const questions = allQuestions.slice(0, requestedCount);
      
      if (!questions || questions.length === 0) {
        setError("Не удалось сгенерировать вопросы. Убедитесь, что материалы урока содержат достаточно текста (минимум 100 символов).");
        setGeneratingQuestions(false);
        return;
      }
      
      // Сохраняем ТОЛЬКО указанное количество вопросов (заменяем, не добавляем)
      setFormData((prev) => ({ ...prev, generatedQuestions: questions }));
      setGeneratingQuestions(false);
      
      if (questions.length < requestedCount) {
        console.warn(`[JournalDetail] Generated only ${questions.length} questions (requested: ${requestedCount})`);
      } else {
        console.log(`[JournalDetail] Generated exactly ${questions.length} questions as requested`);
      }
    } catch (error) {
      console.error("Failed to generate questions:", error);
      let errorMessage = "Не удалось сгенерировать вопросы: ";
      
      if (error.message?.includes("Insufficient text")) {
        errorMessage += "Материалы урока содержат недостаточно текста (минимум 100 символов). Убедитесь, что вы добавили текст теории или загрузили документ.";
      } else if (error.message?.includes("No materials available")) {
        errorMessage += "Нет материалов, помеченных для AI генерации. Убедитесь, что материалы урока сохранены.";
      } else {
        errorMessage += error.message || "Неизвестная ошибка";
      }
      
      setError(errorMessage);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  // Сохранение вопросов
  const handleSaveQuestions = async () => {
    if (!savedLessonId || formData.generatedQuestions.length === 0) {
      setError("Нет вопросов для сохранения");
      return;
    }

    try {
      setSavingLesson(true);
      setError("");
      
      // Берем ТОЛЬКО указанное количество вопросов (не больше!)
      const requestedCount = formData.questionsCount || 40;
      const questionsToSave = formData.generatedQuestions.slice(0, requestedCount);
      
      console.log(`[JournalDetail] Saving EXACTLY ${questionsToSave.length} questions (requested: ${requestedCount}, available: ${formData.generatedQuestions.length}) for lesson ${savedLessonId}`);
      
      // Сохраняем только нужное количество вопросов последовательно
      for (let i = 0; i < questionsToSave.length; i++) {
        const question = questionsToSave[i];
        const questionData = {
          question: question.question_text || question.text || question.question,
          options: question.options || question.answers || [],
          correct_answer: question.correct_answer_index !== undefined 
            ? question.correct_answer_index 
            : (question.correct_index !== undefined ? question.correct_index : 0),
          explanation: question.explanation || "",
          topic: question.topic || null,
          difficulty: question.difficulty || "medium"
        };
        
        console.log(`[JournalDetail] Saving question ${i + 1}/${questionsToSave.length}:`, questionData);
        
        try {
          await createQuestion(savedLessonId, questionData);
          console.log(`[JournalDetail] Question ${i + 1} saved successfully`);
        } catch (error) {
          console.error(`[JournalDetail] Failed to save question ${i + 1}:`, error);
          throw new Error(`Ошибка при сохранении вопроса ${i + 1}: ${error.message || "Неизвестная ошибка"}`);
        }
      }
      
      console.log(`[JournalDetail] Successfully saved exactly ${questionsToSave.length} questions (as requested)`);
      
      // Переход на следующий этап только после успешного сохранения всех вопросов
      setCurrentStep(3);
    } catch (error) {
      console.error("Failed to save questions:", error);
      setError("Не удалось сохранить вопросы: " + (error.message || "Неизвестная ошибка"));
      throw error;
    } finally {
      setSavingLesson(false);
    }
  };

  // Обработка загрузки документа с практическими задачами
  const handlePracticeDocumentChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, practiceDocument: file }));
      setPracticeDocumentFileName(file.name);
    }
  };

  // Разбиение документа на задания (пока простое разбиение по параграфам)
  const parseDocumentToTasks = async (file) => {
    // Для начала простое разбиение - в будущем можно использовать AI для более умного разбиения
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Простое разбиение по двойным переносам строк или нумерации
        const tasks = text
          .split(/\n\s*\n|\d+[\.\)]\s+/)
          .filter((task) => task.trim().length > 20)
          .map((task, index) => ({
            title: `Задача ${index + 1}`,
            body: task.trim(),
            language: "python", // По умолчанию Python
          }));
        resolve(tasks);
      };
      reader.readAsText(file);
    });
  };

  // Сохранение практических задач
  const handleSavePracticeTasks = async () => {
    if (!savedLessonId) {
      setError("Ошибка: урок не сохранен");
      return;
    }

    try {
      setSavingLesson(true);
      setError("");

      let tasksToSave = [];

      // Практические задачи опциональны - если они выбраны, сохраняем их
      if (formData.practiceMode === "upload" && formData.practiceDocument) {
        // Вариант 1: Загрузка документа
        tasksToSave = await parseDocumentToTasks(formData.practiceDocument);
      } else if (formData.practiceMode === "ai" && formData.generatedTasks.length > 0) {
        // Вариант 2: AI генерация
        tasksToSave = formData.generatedTasks;
      }
      // Если практические задачи не выбраны, просто пропускаем их сохранение

      // Сохраняем задачи только если они есть
      if (tasksToSave.length > 0) {
        const taskPromises = tasksToSave.map((task, index) => {
          const taskBody = task.body || task.description || "";
          if (!taskBody || taskBody.trim().length === 0) {
            throw new Error(`Задача ${index + 1} не имеет описания`);
          }
          
          const taskData = {
            lesson_id: savedLessonId,
            title: task.title || `Задача ${index + 1}`,
            body: taskBody.trim(),
            language: task.language || "python",
          };
          
          // deadline_at обязателен, устанавливаем дедлайн на 30 дней вперед по умолчанию
          if (task.deadline_at) {
            taskData.deadline_at = task.deadline_at;
          } else {
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + 30);
            taskData.deadline_at = futureDate.toISOString();
          }
          
          console.log(`[JournalDetail] Saving task ${index + 1}:`, taskData);
          return createTask(taskData);
        });

        await Promise.all(taskPromises);
        console.log(`[JournalDetail] Successfully saved ${tasksToSave.length} practice tasks`);
      } else {
        console.log(`[JournalDetail] No practice tasks to save, lesson will be created without tasks`);
      }

      // Обновляем список уроков и закрываем модальное окно
      if (onLessonCreated) {
        await onLessonCreated();
      }
      onClose();
    } catch (error) {
      console.error("Failed to save practice tasks:", error);
      setError("Не удалось сохранить практические задачи: " + (error.message || "Неизвестная ошибка"));
    } finally {
      setSavingLesson(false);
    }
  };

  // AI генерация практических заданий
  const handleGeneratePracticeTasks = async () => {
    if (!savedLessonId) {
      setError("Ошибка: урок не сохранен");
      return;
    }

    setGeneratingTasks(true);
    setError("");

    try {
      console.log(`[JournalDetail] Generating practice tasks for lesson ${savedLessonId}`);
      
      // Минимальная задержка для обработки на сервере (уменьшено с 300ms до 100ms)
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Генерируем 30 практических задач
      const response = await generatePracticeTasksFromMaterials(savedLessonId, 30);
      console.log('[JournalDetail] Generate practice tasks response:', response);
      
      // Обрабатываем ответ от эндпоинта
      const tasks = response.data?.tasks || response.tasks || [];
      
      if (!tasks || tasks.length === 0) {
        setError("Не удалось сгенерировать практические задачи. Убедитесь, что материалы урока содержат достаточно текста (минимум 100 символов).");
        return;
      }
      
      setFormData((prev) => ({ ...prev, generatedTasks: tasks }));
      console.log(`[JournalDetail] Generated ${tasks.length} practice tasks`);
    } catch (error) {
      console.error("Failed to generate practice tasks:", error);
      let errorMessage = "Не удалось сгенерировать практические задачи: ";
      
      if (error.message?.includes("Insufficient text")) {
        errorMessage += "Материалы урока содержат недостаточно текста (минимум 100 символов). Убедитесь, что вы добавили текст теории или загрузили документ.";
      } else if (error.message?.includes("No materials available")) {
        errorMessage += "Нет материалов, помеченных для AI генерации. Убедитесь, что материалы урока сохранены.";
      } else {
        errorMessage += error.message || "Неизвестная ошибка";
      }
      
      setError(errorMessage);
    } finally {
      setGeneratingTasks(false);
    }
  };

  // Финальное сохранение
  const handleFinalSubmit = async () => {
    try {
      // Убеждаемся, что вопросы сохранены (если они были сгенерированы)
      if (formData.generatedQuestions.length > 0 && savedLessonId) {
        console.log('[JournalDetail] Checking if questions need to be saved...');
        try {
          // Сохраняем вопросы, если они еще не сохранены
          // handleSaveQuestions проверяет наличие вопросов и сохраняет их
          await handleSaveQuestions();
          console.log('[JournalDetail] Questions saved successfully');
        } catch (error) {
          // Если ошибка "Нет вопросов для сохранения", значит они уже сохранены
          if (error.message && error.message.includes("Нет вопросов для сохранения")) {
            console.log('[JournalDetail] Questions already saved or empty');
          } else {
            console.warn("Error saving questions:", error);
            // Не блокируем создание урока, если вопросы не сохранились
            // Пользователь может добавить их позже
          }
        }
      }
      
      // Сохраняем практические задачи
      await handleSavePracticeTasks();
    } catch (error) {
      console.error("Failed to finalize lesson:", error);
      setError("Не удалось завершить создание урока: " + (error.message || "Неизвестная ошибка"));
    }
  };

  const handleNext = async () => {
    try {
      if (currentStep === 1) {
        await handleSaveLessonForQuestions();
        // После сохранения материалов фоновая генерация уже запущена
        // Переходим на этап 2, где проверим наличие вопросов
      } else if (currentStep === 2) {
        // Проверяем, есть ли уже сгенерированные вопросы
        if (formData.generatedQuestions.length === 0) {
          // Если вопросов нет, быстро генерируем ТОЧНОЕ количество
          console.log('[JournalDetail] Questions not ready, generating quickly...');
          setGeneratingQuestions(true);
          try {
            const requestedCount = formData.questionsCount || 40;
            
            // ВАЖНО: Очищаем старые вопросы ПЕРЕД генерацией новых
            setFormData((prev) => ({ ...prev, generatedQuestions: [] }));
            
            console.log(`[JournalDetail] Generating exactly ${requestedCount} questions (old questions cleared)...`);
            const response = await generateQuestionsFromMaterials(savedLessonId, requestedCount);
            const allQuestions = response.data?.questions || response.questions || [];
            
            // Берем ТОЛЬКО указанное количество (не больше, не меньше)
            const questions = allQuestions.slice(0, requestedCount);
            
            if (questions.length > 0) {
              setFormData((prev) => ({ ...prev, generatedQuestions: questions }));
              setGeneratingQuestions(false);
              if (questions.length < requestedCount) {
                console.warn(`[JournalDetail] Generated only ${questions.length} questions (requested: ${requestedCount})`);
              } else {
                console.log(`[JournalDetail] Generated exactly ${questions.length} questions as requested`);
              }
            } else {
              setError("Не удалось сгенерировать вопросы. Попробуйте еще раз.");
              setGeneratingQuestions(false);
              return;
            }
          } catch (error) {
            console.error("Failed to generate questions:", error);
            setError("Не удалось сгенерировать вопросы: " + (error.message || "Неизвестная ошибка"));
            setGeneratingQuestions(false);
            return;
          } finally {
            // Дополнительная гарантия что анимация остановится
            setGeneratingQuestions(false);
          }
        }
        
        await handleSaveQuestions();
        // Переход на следующий этап происходит внутри handleSaveQuestions после успешного сохранения
      } else if (currentStep === 3) {
        // Если задачи уже сгенерированы в фоне, автоматически выбираем режим "ai"
        if (formData.generatedTasks.length > 0 && !formData.practiceMode) {
          setFormData((prev) => ({ ...prev, practiceMode: "ai" }));
        }
        
        // Проверяем, есть ли уже сгенерированные задачи
        if (formData.practiceMode === "ai" && formData.generatedTasks.length === 0) {
          // Если задач нет, быстро генерируем (большая часть должна быть уже готова)
          console.log('[JournalDetail] Tasks not ready, generating quickly...');
          setGeneratingTasks(true);
          try {
            const response = await generatePracticeTasksFromMaterials(savedLessonId, 30);
            const tasks = response.data?.tasks || response.tasks || [];
            if (tasks.length > 0) {
              setFormData((prev) => ({ ...prev, generatedTasks: tasks }));
            } else {
              setError("Не удалось сгенерировать задачи. Попробуйте еще раз.");
              setGeneratingTasks(false);
              return;
            }
          } catch (error) {
            console.error("Failed to generate tasks:", error);
            setError("Не удалось сгенерировать задачи: " + (error.message || "Неизвестная ошибка"));
            setGeneratingTasks(false);
            return;
          } finally {
            setGeneratingTasks(false);
          }
        }
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
      // Ошибка уже обработана в handleSaveQuestions или handleSaveLessonForQuestions
      // Не нужно дублировать обработку
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  };

  if (!isOpen) return null;

  const steps = [
    { number: 1, title: "Теория и видео", icon: FileText },
    { number: 2, title: "Тестирование", icon: CheckSquare },
    { number: 3, title: "Практика", icon: Code },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4 my-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? "Редактирование урока" : "Новый урок"}
          </h3>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.number;
            const isCompleted = currentStep > step.number;
            return (
              <React.Fragment key={step.number}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white"
                        : isCompleted
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckSquare className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <div className="hidden sm:block">
                    <div className={`text-sm font-medium ${isActive ? "text-blue-600" : "text-gray-600"}`}>
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      isCompleted ? "bg-green-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Content based on currentStep */}
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded border border-red-200">
              {error}
            </div>
          )}

          {/* Этап 1: Теория и видео */}
          {currentStep === 1 && (
            <>
              {/* Основная информация */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Основная информация</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Название урока <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={formData.title}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, title: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Например, Введение в алгоритмы"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Описание
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, description: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Описание урока"
                      rows={3}
                      disabled={loading}
                    />
                  </div>
                </div>
              </div>

              {/* Теория */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Теория
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Теория (текст)
                    </label>
                    <textarea
                      value={formData.theory_text}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, theory_text: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Введите теоретический материал урока..."
                      rows={5}
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Текстовое объяснение теории урока
                    </p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Теория (документ)
                    </label>
                    {!documentFileName ? (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 mb-2 text-gray-400" />
                          <p className="mb-2 text-sm text-gray-500">
                            <span className="font-semibold">Нажмите для загрузки</span> или перетащите файл
                          </p>
                          <p className="text-xs text-gray-500">PDF, DOCX, PPTX, TXT (макс. 50 МБ)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.docx,.pptx"
                          onChange={handleFileChange}
                          disabled={loading}
                        />
                      </label>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-2">
                          <File className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-gray-700">{documentFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveDocument}
                          className="text-red-500 hover:text-red-700"
                          disabled={loading}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-1">
                      Загрузите документ с теорией (PDF, DOCX, PPTX, TXT)
                    </p>
                  </div>
                </div>
              </div>

              {/* Видео */}
              <div className="border-b pb-4">
                <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Видео
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ссылка на видео
                    </label>
                    <input
                      type="url"
                      value={formData.video_url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, video_url: e.target.value }))
                      }
                      className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="https://www.youtube.com/watch?v=..."
                      disabled={loading}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Ссылка на YouTube или другое видео
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Этап 2: Тестирование */}
          {currentStep === 2 && (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  {generatingQuestions && formData.generatedQuestions.length === 0 ? (
                    // AI Skeleton Loading State - показываем ТОЛЬКО если генерируем И вопросов еще нет
                    <QuestionSkeletonLoader />
                  ) : (
                    // Normal Content - показываем когда НЕ генерируем ИЛИ когда вопросы уже есть
                    <>
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">
                          Генерация вопросов
                        </h4>
                        <div className="mb-3">
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Количество вопросов
                          </label>
                          <input
                            type="number"
                            min="10"
                            max="100"
                            value={formData.questionsCount || 40}
                            onChange={(e) => {
                              const value = parseInt(e.target.value) || 40;
                              const newCount = Math.max(10, Math.min(100, value));
                              // При изменении количества очищаем старые вопросы (чтобы не суммировались)
                              setFormData((prev) => ({ 
                                ...prev, 
                                questionsCount: newCount,
                                generatedQuestions: [] // Очищаем при изменении количества
                              }));
                            }}
                            className="w-24 rounded-lg border border-gray-200 px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            disabled={generatingQuestions || loading}
                          />
                        </div>
                        <p className="text-xs text-gray-600 mb-2">
                          Система сгенерирует {formData.questionsCount || 40} вопросов на основе загруженной теории. Из них случайные 15 попадут студенту при тестировании. Генерация происходит автоматически в фоне.
                        </p>
                        {backgroundGenerating && formData.generatedQuestions.length === 0 && (
                          <p className="text-xs text-blue-600 mt-1 font-medium">
                            ⏳ Генерация вопросов в фоне...
                          </p>
                        )}
                        {formData.generatedQuestions.length > 0 && (
                          <p className="text-xs text-green-600 mt-1 font-medium">
                            ✓ Сгенерировано {formData.generatedQuestions.length} вопросов
                          </p>
                        )}
                      </div>
                      <button
                        onClick={handleGenerateQuestions}
                        disabled={generatingQuestions || loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap ml-4"
                      >
                        {formData.generatedQuestions.length > 0 ? (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Перегенерировать
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Создать вопросы
                          </>
                        )}
                      </button>
                    </>
                  )}

                </div>

                {/* Отображение сгенерированных вопросов - показываем ВСЕГДА когда есть вопросы */}
                {formData.generatedQuestions.length > 0 && !generatingQuestions && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Сгенерированные вопросы ({formData.generatedQuestions.length})
                    </h4>
                    <div className="max-h-96 overflow-y-auto space-y-3">
                      {formData.generatedQuestions.map((question, index) => (
                        <div
                          key={index}
                          className="p-4 bg-gray-50 border border-gray-200 rounded-lg"
                        >
                          <p className="text-sm font-medium text-gray-900 mb-2">
                            {index + 1}. {question.question_text || question.text}
                          </p>
                          <div className="space-y-1">
                            {(question.options || question.answers || []).map((option, optIndex) => {
                              const isCorrect =
                                optIndex ===
                                (question.correct_answer_index ||
                                  question.correct_index ||
                                  0);
                              return (
                                <div
                                  key={optIndex}
                                  className={`p-2 rounded text-sm ${
                                    isCorrect
                                      ? "bg-green-100 border border-green-300 text-green-800"
                                      : "bg-white border border-gray-200 text-gray-700"
                                  }`}
                                >
                                  {String.fromCharCode(65 + optIndex)}. {option}
                                  {isCorrect && (
                                    <span className="ml-2 text-xs font-semibold">✓ Правильный ответ</span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Этап 3: Практика */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-700">
                  Практические задания
                </h4>
                <p className="text-sm text-gray-600">
                  Выберите способ создания практических заданий для урока
                </p>

                {/* Выбор варианта */}
                {!formData.practiceMode && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Вариант 1: Загрузка документа */}
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, practiceMode: "upload" }))}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Upload className="w-6 h-6 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">Загрузить документ</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        Загрузите документ с практическими задачами. Система автоматически разобьёт его на отдельные задания.
                      </p>
                    </button>

                    {/* Вариант 2: AI генерация */}
                    <button
                      onClick={() => setFormData((prev) => ({ ...prev, practiceMode: "ai" }))}
                      className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all text-left"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                        <h5 className="font-semibold text-gray-900">Генерация ИИ</h5>
                      </div>
                      <p className="text-sm text-gray-600">
                        ИИ сгенерирует 30 академически правильных практических заданий на основе теории урока. Из них случайные 10 попадут студенту. Генерация начинается автоматически после загрузки теории и происходит в фоне. При переходе на этот этап задачи уже должны быть готовы (5-6 секунд ожидания). Вы сможете проверить и утвердить их.
                      </p>
                    </button>
                  </div>
                )}

                {/* Вариант 1: Загрузка документа */}
                {formData.practiceMode === "upload" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-gray-900">Загрузка документа</h5>
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, practiceMode: null, practiceDocument: null }))}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Изменить выбор
                      </button>
                    </div>
                    <div className="space-y-2">
                      <label className="block">
                        <span className="text-sm text-gray-700 mb-2 block">Документ с задачами (TXT, DOCX, PDF)</span>
                        <div className="flex items-center gap-3">
                          <input
                            type="file"
                            accept=".txt,.docx,.pdf"
                            onChange={handlePracticeDocumentChange}
                            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          />
                        </div>
                      </label>
                      {practiceDocumentFileName && (
                        <p className="text-sm text-green-600 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Загружен: {practiceDocumentFileName}
                        </p>
                      )}
                      <p className="text-xs text-gray-500">
                        Документ будет автоматически разбит на отдельные задания. Каждое задание будет выдано студентам случайным образом.
                      </p>
                    </div>
                  </div>
                )}

                {/* Вариант 2: AI генерация */}
                {formData.practiceMode === "ai" && (
                  <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h5 className="font-semibold text-gray-900">Генерация ИИ</h5>
                      <button
                        onClick={() => setFormData((prev) => ({ ...prev, practiceMode: null, generatedTasks: [] }))}
                        className="text-sm text-gray-600 hover:text-gray-900"
                      >
                        Изменить выбор
                      </button>
                    </div>
                    <div className="space-y-3">
                      {backgroundGenerating && (
                        <p className="text-xs text-blue-600 font-medium">
                          ⏳ Генерация задач в фоне...
                        </p>
                      )}
                      <button
                        onClick={handleGeneratePracticeTasks}
                        disabled={generatingTasks}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        {generatingTasks ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            <span>Генерация... (5-6 сек)</span>
                          </>
                        ) : formData.generatedTasks.length > 0 ? (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Перегенерировать
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            Сгенерировать задания
                          </>
                        )}
                      </button>
                      {formData.generatedTasks.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-sm text-green-600 font-medium">
                            ✓ Сгенерировано {formData.generatedTasks.length} заданий
                          </p>
                          <div className="space-y-2 max-h-60 overflow-y-auto">
                            {formData.generatedTasks.map((task, index) => (
                              <div key={index} className="p-3 bg-white border border-gray-200 rounded-lg">
                                <h6 className="font-medium text-sm text-gray-900 mb-1">{task.title}</h6>
                                <p className="text-xs text-gray-600 line-clamp-2">{task.body}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between gap-3 pt-4 border-t">
          <div>
            {currentStep > 1 && (
              <button
                onClick={handleBack}
                disabled={loading || generatingQuestions || savingLesson}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={loading || generatingQuestions || savingLesson}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Отмена
            </button>
            {currentStep < 3 ? (
              <button
                onClick={handleNext}
                disabled={loading || generatingQuestions || savingLesson || (currentStep === 1 && !formData.title.trim())}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {savingLesson ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Сохранение...
                  </>
                ) : (
                  <>
                    Далее
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleFinalSubmit}
                disabled={loading || savingLesson}
                className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading || savingLesson ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Создание...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Создать урок
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JournalDetail;
