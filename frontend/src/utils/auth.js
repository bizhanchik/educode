// This file now serves as a compatibility layer between old localStorage-based code
// and new API-based backend integration. Over time, components should migrate to
// using the API utilities directly (usersApi, progressApi, notificationsApi, journalApi)

import { progressApi } from './progressApi.js';
import { notificationsApi } from './notificationsApi.js';
import { journalApi } from './journalApi.js';

// Helper to format dates
const formatDate = (date) => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${day}.${month}`;
};

// Stub function - database is now in backend
export const initDatabase = () => {
  console.log('[auth] Database initialization skipped - using backend API');
};

// ============================================================================
// PROGRESS FUNCTIONS - Wrapper around progressApi
// ============================================================================

export const getUserProgress = async (userId) => {
  try {
    const summary = await progressApi.getUserProgress(userId);
    // Convert API response to old format for backwards compatibility
    const progress = {};
    if (summary && summary.lessons) {
      summary.lessons.forEach(lesson => {
        if (!progress[lesson.course_id]) {
          progress[lesson.course_id] = {};
        }
        progress[lesson.course_id][lesson.lesson_id] = {
          completed: lesson.completed,
          completedAt: lesson.completed_at
        };
      });
    }
    return progress;
  } catch (error) {
    console.error('[auth] Error fetching user progress:', error);
    return {};
  }
};

export const updateUserProgress = async (userId, courseId, lessonId, completed = true) => {
  try {
    // First, check if progress already exists
    const existing = await progressApi.getLessonProgress(userId, lessonId);

    if (existing && existing.length > 0) {
      // Update existing progress
      const progressId = existing[0].id;
      await progressApi.updateProgress(progressId, {
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
    } else {
      // Create new progress
      await progressApi.createProgress({
        user_id: userId,
        lesson_id: lessonId,
        completed,
        completed_at: completed ? new Date().toISOString() : null
      });
    }
    return { success: true };
  } catch (error) {
    console.error('[auth] Error updating user progress:', error);
    return { success: false, error: error.message };
  }
};

export const getCourseProgress = async (userId, courseId) => {
  try {
    const summary = await progressApi.getUserProgress(userId);
    if (!summary || !summary.lessons) return 0;

    return summary.lessons.filter(
      lesson => lesson.course_id === courseId && lesson.completed
    ).length;
  } catch (error) {
    console.error('[auth] Error fetching course progress:', error);
    return 0;
  }
};

export const getLessonProgress = async (userId, courseId, lessonId) => {
  try {
    const progress = await progressApi.getLessonProgress(userId, lessonId);

    if (progress && progress.length > 0) {
      const p = progress[0];
      return {
        completed: p.completed,
        unlocked: true, // TODO: Implement unlock logic in backend
        sectionsCompleted: p.sections_completed || {
          video: false,
          theory: false,
          practice: false
        }
      };
    }

    // Return default progress for lesson 1 or if not found
    return {
      completed: false,
      unlocked: lessonId === 1,
      sectionsCompleted: {
        video: false,
        theory: false,
        practice: false
      }
    };
  } catch (error) {
    console.error('[auth] Error fetching lesson progress:', error);
    return {
      completed: false,
      unlocked: lessonId === 1,
      sectionsCompleted: { video: false, theory: false, practice: false }
    };
  }
};

export const updateLessonProgress = async (userId, courseId, lessonId, sectionCompleted) => {
  try {
    const existing = await progressApi.getLessonProgress(userId, lessonId);

    let sectionsCompleted = { video: false, theory: false, practice: false };
    let progressId = null;

    if (existing && existing.length > 0) {
      progressId = existing[0].id;
      sectionsCompleted = existing[0].sections_completed || sectionsCompleted;
    }

    // Update the completed section
    sectionsCompleted[sectionCompleted] = true;

    // Check if all sections are completed
    const isCompleted = sectionsCompleted.video && sectionsCompleted.theory && sectionsCompleted.practice;

    const updateData = {
      sections_completed: sectionsCompleted,
      completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null
    };

    if (progressId) {
      await progressApi.updateProgress(progressId, updateData);
    } else {
      await progressApi.createProgress({
        user_id: userId,
        lesson_id: lessonId,
        ...updateData
      });
    }

    // If lesson completed, send notification about next lesson
    if (isCompleted) {
      await addNotification(
        userId,
        'lesson_unlocked',
        'Новый урок разблокирован!',
        `Урок ${lessonId + 1} курса "${courseId}" теперь доступен для изучения.`,
        courseId,
        lessonId + 1
      );
    }

    return { success: true };
  } catch (error) {
    console.error('[auth] Error updating lesson progress:', error);
    return { success: false, error: error.message };
  }
};

export const isLessonUnlocked = async (userId, courseId, lessonId) => {
  const progress = await getLessonProgress(userId, courseId, lessonId);
  return progress.unlocked;
};

export const isLessonCompleted = async (userId, courseId, lessonId) => {
  const progress = await getLessonProgress(userId, courseId, lessonId);
  return progress.completed;
};

// ============================================================================
// GRADES FUNCTIONS - Wrapper around progressApi
// Note: Grades are now stored in journal entries
// ============================================================================

export const getUserGrades = async (userId) => {
  try {
    const entries = await journalApi.getEntries({ user_id: userId });
    const grades = {};

    if (entries && entries.length > 0) {
      entries.forEach(entry => {
        if (!grades[entry.course_id]) {
          grades[entry.course_id] = {};
        }
        grades[entry.course_id][entry.lesson_id] = {
          grade: entry.average_score,
          maxGrade: 100,
          percentage: entry.average_score,
          completedAt: entry.completed_at,
          status: entry.average_score >= 70 ? 'passed' : 'failed'
        };
      });
    }

    return grades;
  } catch (error) {
    console.error('[auth] Error fetching user grades:', error);
    return {};
  }
};

export const saveGrade = async (userId, courseId, lessonId, grade, maxGrade = 100) => {
  try {
    const percentage = Math.round((grade / maxGrade) * 100);

    // Save as journal entry
    await journalApi.createEntry({
      user_id: userId,
      lesson_id: lessonId,
      test_score: grade,
      practice_score: grade,
      average_score: percentage,
      completed_at: new Date().toISOString()
    });

    return { success: true };
  } catch (error) {
    console.error('[auth] Error saving grade:', error);
    return { success: false, error: error.message };
  }
};

export const getLessonGrade = async (userId, courseId, lessonId) => {
  const grades = await getUserGrades(userId);
  return grades[courseId]?.[lessonId] || null;
};

export const getCourseGrades = async (userId, courseId) => {
  const grades = await getUserGrades(userId);
  return grades[courseId] || {};
};

export const calculateCourseAverage = async (userId, courseId) => {
  const courseGrades = await getCourseGrades(userId, courseId);
  const gradeList = Object.values(courseGrades);
  if (gradeList.length === 0) return 0;

  const totalPercentage = gradeList.reduce((sum, grade) => sum + grade.percentage, 0);
  return Math.round(totalPercentage / gradeList.length);
};

// ============================================================================
// NOTIFICATIONS FUNCTIONS - Wrapper around notificationsApi
// ============================================================================

export const getUserNotifications = async (userId) => {
  if (!userId) return [];

  try {
    const notifications = await notificationsApi.getNotifications(userId);
    return notifications || [];
  } catch (error) {
    // Тихая обработка - таблица notifications может не существовать
    // Проверяем, что это ошибка 500 (таблица не существует), а не другая проблема
    if (error.status === 500 && error.message?.includes('notifications')) {
      // Таблица не существует - это нормально, просто возвращаем пустой массив
      return [];
    }
    // Для других ошибок тоже возвращаем пустой массив, но не логируем
    return [];
  }
};

export const addNotification = async (userId, type, title, message, courseId = null, lessonId = null, teacherId = null) => {
  try {
    await notificationsApi.createNotification({
      user_id: userId,
      type,
      title,
      message,
      related_id: lessonId || courseId,
      related_type: lessonId ? 'lesson' : (courseId ? 'course' : null),
      read: false
    });
    return { success: true };
  } catch (error) {
    console.error('[auth] Error adding notification:', error);
    return { success: false, error: error.message };
  }
};

export const markNotificationAsRead = async (userId, notificationId) => {
  try {
    await notificationsApi.markAsRead(notificationId);
    return { success: true };
  } catch (error) {
    console.error('[auth] Error marking notification as read:', error);
    return { success: false, error: error.message };
  }
};

export const getUnreadNotificationsCount = async (userId) => {
  if (!userId) return 0;

  try {
    const result = await notificationsApi.getUnreadCount(userId);
    return result?.count || 0;
  } catch (error) {
    // Тихая обработка - таблица notifications может не существовать
    // Проверяем, что это ошибка 500 (таблица не существует), а не другая проблема
    if (error.status === 500 && error.message?.includes('notifications')) {
      // Таблица не существует - это нормально, просто возвращаем 0
      return 0;
    }
    // Для других ошибок тоже возвращаем 0, но не логируем
    return 0;
  }
};

// ============================================================================
// JOURNAL FUNCTIONS - Wrapper around journalApi
// ============================================================================

export const saveJournalEntry = async (userId, courseId, lessonId, data) => {
  try {
    // Check if entry exists
    const existing = await journalApi.getEntries({
      user_id: userId,
      lesson_id: lessonId
    });

    if (existing && existing.length > 0) {
      // Update existing entry
      await journalApi.updateEntry(existing[0].id, data);
    } else {
      // Create new entry
      await journalApi.createEntry({
        user_id: userId,
        lesson_id: lessonId,
        ...data
      });
    }

    return { success: true };
  } catch (error) {
    console.error('[auth] Error saving journal entry:', error);
    return { success: false, error: error.message };
  }
};

export const getJournalEntry = async (userId, courseId, lessonId) => {
  try {
    const entries = await journalApi.getEntries({
      user_id: userId,
      lesson_id: lessonId
    });

    if (entries && entries.length > 0) {
      const entry = entries[0];
      return {
        startDate: entry.started_at,
        startDateFormatted: formatDate(entry.started_at),
        endDate: entry.completed_at,
        endDateFormatted: entry.completed_at ? formatDate(entry.completed_at) : null,
        testGrade: entry.test_score,
        taskGrade: entry.practice_score,
        averageGrade: entry.average_score
      };
    }

    return null;
  } catch (error) {
    console.error('[auth] Error fetching journal entry:', error);
    return null;
  }
};

export const getCourseJournal = async (userId, courseId) => {
  try {
    const entries = await journalApi.getCourseJournal(userId, courseId);
    const journal = {};

    if (entries && entries.length > 0) {
      entries.forEach(entry => {
        journal[entry.lesson_id] = {
          startDate: entry.started_at,
          startDateFormatted: formatDate(entry.started_at),
          endDate: entry.completed_at,
          endDateFormatted: entry.completed_at ? formatDate(entry.completed_at) : null,
          testGrade: entry.test_score,
          taskGrade: entry.practice_score,
          averageGrade: entry.average_score
        };
      });
    }

    return journal;
  } catch (error) {
    console.error('[auth] Error fetching course journal:', error);
    return {};
  }
};

export const startLesson = async (userId, courseId, lessonId) => {
  const startDate = new Date();
  return saveJournalEntry(userId, courseId, lessonId, {
    started_at: startDate.toISOString()
  });
};

export const completeLessonWithScores = async (userId, courseId, lessonId, testScore, practiceScore) => {
  const endDate = new Date();
  const averageScore = Math.round((testScore + practiceScore) / 2);
  return saveJournalEntry(userId, courseId, lessonId, {
    completed_at: endDate.toISOString(),
    test_score: testScore,
    practice_score: practiceScore,
    average_score: averageScore
  });
};

// ============================================================================
// DEPRECATED FUNCTIONS - These should no longer be used
// Authentication is now handled by useAuth hook and backend API
// ============================================================================

export const getUsers = () => {
  console.warn('[auth] getUsers() is deprecated - use usersApi.getUsers() instead');
  return [];
};

export const getCourses = () => {
  console.warn('[auth] getCourses() is deprecated - use curriculumApi instead');
  return [];
};

export const findUserByEmail = () => {
  console.warn('[auth] findUserByEmail() is deprecated - authentication handled by backend');
  return null;
};

export const verifyPassword = () => {
  console.warn('[auth] verifyPassword() is deprecated - authentication handled by backend');
  return false;
};

export const login = () => {
  console.warn('[auth] login() is deprecated - use useAuth hook instead');
  return { success: false, error: 'Use useAuth hook for authentication' };
};

export const register = () => {
  console.warn('[auth] register() is deprecated - use useAuth hook instead');
  return { success: false, error: 'Use useAuth hook for authentication' };
};

export const getCurrentUser = () => {
  console.warn('[auth] getCurrentUser() is deprecated - use useAuth hook instead');
  return null;
};

export const logout = () => {
  console.warn('[auth] logout() is deprecated - use useAuth hook instead');
  return { success: false };
};

export const isAuthenticated = () => {
  console.warn('[auth] isAuthenticated() is deprecated - use useAuth hook instead');
  return false;
};

export const getUserRole = () => {
  console.warn('[auth] getUserRole() is deprecated - use useAuth hook instead');
  return null;
};

export const isAdmin = () => {
  console.warn('[auth] isAdmin() is deprecated - use useAuth hook instead');
  return false;
};

export const updateUser = () => {
  console.warn('[auth] updateUser() is deprecated - use usersApi.updateUser() instead');
  return { success: false };
};

export const deleteUser = () => {
  console.warn('[auth] deleteUser() is deprecated - use usersApi.deleteUser() instead');
  return { success: false };
};

export const getUserStats = () => {
  console.warn('[auth] getUserStats() is deprecated - calculate from usersApi.getUsers()');
  return { total: 0, admins: 0, students: 0, regular: 0 };
};

export const exportDatabase = () => {
  console.warn('[auth] exportDatabase() is deprecated - no longer needed');
};

export const importDatabase = () => {
  console.warn('[auth] importDatabase() is deprecated - no longer needed');
  return Promise.reject({ success: false, error: 'No longer supported' });
};

export const clearDatabase = () => {
  console.warn('[auth] clearDatabase() is deprecated - no longer needed');
  return { success: false };
};

export const getTeacherCourses = () => {
  console.warn('[auth] getTeacherCourses() is deprecated');
  return [];
};

export const getCourseById = () => {
  console.warn('[auth] getCourseById() is deprecated');
  return null;
};

export const updateCourse = () => {
  console.warn('[auth] updateCourse() is deprecated');
  return false;
};

export const getTeacherNotifications = () => {
  console.warn('[auth] getTeacherNotifications() is deprecated - use notificationsApi');
  return [];
};

export const getTeacherSubmissions = () => {
  console.warn('[auth] getTeacherSubmissions() is deprecated');
  return [];
};

export const updateSubmission = () => {
  console.warn('[auth] updateSubmission() is deprecated');
  return false;
};
