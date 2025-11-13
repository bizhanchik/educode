import React, { useState, useEffect } from 'react';
import BackButton from '../components/BackButton.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { getCourseJournal } from '../utils/auth.js';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../i18n.jsx';

const JournalDetail = ({ onPageChange, courseId }) => {
  const { t } = useLanguage();
  const [selectedSemester, setSelectedSemester] = useState('1');

  // Helper: map 0-100 score to US letter grade and GPA
  const toUsGrade = (score) => {
    if (score >= 97) return { letter: 'A+', gpa: 4.0 };
    if (score >= 93) return { letter: 'A', gpa: 4.0 };
    if (score >= 90) return { letter: 'A-', gpa: 3.7 };
    if (score >= 87) return { letter: 'B+', gpa: 3.3 };
    if (score >= 83) return { letter: 'B', gpa: 3.0 };
    if (score >= 80) return { letter: 'B-', gpa: 2.7 };
    if (score >= 77) return { letter: 'C+', gpa: 2.3 };
    if (score >= 73) return { letter: 'C', gpa: 2.0 };
    if (score >= 70) return { letter: 'C-', gpa: 1.7 };
    if (score >= 67) return { letter: 'D+', gpa: 1.3 };
    if (score >= 63) return { letter: 'D', gpa: 1.0 };
    if (score >= 60) return { letter: 'D-', gpa: 0.7 };
    return { letter: 'F', gpa: 0.0 };
  };

  const courses = {
    1: {
      id: 1,
      code: 'ПМ02',
      name: t('courses.courseDescription') + '.',
      journalType: 'Обычный',
      type: 'Теоретическое обучение',
      group: 'ПО2402',
      gradeType: 'Процентная система (0-100)',
      hours: '48 (12.0)',
      teacher: 'Мартынцов Николай Викторович (12)',
      subject: 'Алгоритмизация'
    }
  };

  // Названия уроков для отображения
  const lessonNames = {
    1: t('admin.journal.lessonNames.lesson1'),
    2: t('admin.journal.lessonNames.lesson2'),
    3: 'Практическая работа №1. «Условные конструкции Python»',
    4: 'Цикличные конструкции FOR, WHILE в языке программирования Python',
    5: 'Практическая работа №2. Циклические конструкции',
    6: 'Строки в Python и обработка текстовой информации',
    7: 'Функции и параметры функций'
  };

  const [courseTopics, setCourseTopics] = useState([]);

  // Safe auth access
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (e) {
    // ignore if auth not available on this page
  }

  const course = courses[courseId] || courses[1];

  // Загружаем данные из журнала
  useEffect(() => {
    if (user) {
      const journalData = getCourseJournal(user.id, courseId || 1);
      
      // Преобразуем данные журнала в формат для отображения
      // Показываем только те уроки, которые были начаты (есть startDate) или завершены
      const currentLessonNames = {
        1: t('admin.journal.lessonNames.lesson1'),
        2: t('admin.journal.lessonNames.lesson2'),
        3: 'Практическая работа №1. «Условные конструкции Python»',
        4: 'Цикличные конструкции FOR, WHILE в языке программирования Python',
        5: 'Практическая работа №2. Циклические конструкции',
        6: 'Строки в Python и обработка текстовой информации',
        7: 'Функции и параметры функций'
      };
      const topicsList = Object.keys(currentLessonNames)
        .map(lessonId => {
          const entry = journalData[lessonId];
          // Показываем урок только если он был начат (есть startDate) или завершен
          if (!entry || (!entry.startDate && !entry.endDate)) {
            return null;
          }
          
          return {
            id: parseInt(lessonId),
            topicName: currentLessonNames[lessonId],
            testStartDate: entry?.startDateFormatted || '-',
            testEndDate: entry?.endDateFormatted || '-',
            testGrade: entry?.testGrade || null,
            taskGrade: entry?.taskGrade || null,
            averageGrade: entry?.averageGrade || null
          };
        })
        .filter(topic => topic !== null); // Убираем null значения
      
      setCourseTopics(topicsList);
    } else {
      // Если пользователь не залогинен, показываем пустой список
      setCourseTopics([]);
    }
  }, [user, courseId, t]);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
          {/* Back Button moved inside section to sit below navbar */}
          <BackButton className="px-0 sm:px-0 mb-6" onClick={() => onPageChange && onPageChange('journal')}>{t('courses.backToJournal')}</BackButton>
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.name}
            </h1>
          </div>

          

          {/* Semester Selector removed */}

          {/* Topics Table */}
          {courseTopics.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">
                Пока нет пройденных уроков. Начните изучение курса, чтобы увидеть результаты здесь.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full border-collapse">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.number')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.topicName')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.dates')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.testGrade')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.taskGrade')}
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                      {t('admin.journal.averageGrade')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {courseTopics.map((topic) => (
                  <tr key={topic.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200">
                      {topic.id}
                    </td>
                    <td className="px-4 py-4 text-base font-semibold text-gray-900 border border-gray-200">
                      {topic.topicName}
                    </td>
                    <td className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200">
                      {topic.testStartDate && topic.testEndDate && topic.testStartDate !== '-' && topic.testEndDate !== '-' 
                        ? `${topic.testStartDate} - ${topic.testEndDate}` 
                        : topic.testStartDate !== '-' ? topic.testStartDate : '-'}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200"
                      title={topic.testGrade ? `${toUsGrade(topic.testGrade).letter} • GPA ${toUsGrade(topic.testGrade).gpa.toFixed(1)}` : ''}
                    >
                      {topic.testGrade !== null ? topic.testGrade : '-'}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200"
                      title={topic.taskGrade ? `${toUsGrade(topic.taskGrade).letter} • GPA ${toUsGrade(topic.taskGrade).gpa.toFixed(1)}` : ''}
                    >
                      {topic.taskGrade !== null ? topic.taskGrade : '-'}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200"
                      title={topic.averageGrade ? `${toUsGrade(topic.averageGrade).letter} • GPA ${toUsGrade(topic.averageGrade).gpa.toFixed(1)}` : ''}
                    >
                      {topic.averageGrade !== null ? topic.averageGrade : '-'}
                    </td>
                  </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend removed per request */}
        </div>
      </section>
    </div>
  );
};

export default JournalDetail;
