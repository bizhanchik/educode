import React, { useState } from 'react';
import BackButton from '../components/BackButton.jsx';
import { useAuth } from '../hooks/useAuth.jsx';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const JournalDetail = ({ onPageChange, courseId }) => {
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
      name: 'Составление алгоритма и создание блок-схемы на основе спецификации программного обеспечения.',
      journalType: 'Обычный',
      type: 'Теоретическое обучение',
      group: 'ПО2402',
      gradeType: 'Процентная система (0-100)',
      hours: '48 (12.0)',
      teacher: 'Мартынцов Николай Викторович (12)',
      subject: 'Алгоритмизация'
    }
  };

  const topics = {
    1: [
      {
        id: 1,
        topicName: 'Введение в языки программирования. Классификация языков программирования. Язык программирования Python. Выбор среды разработки.',
        testStartDate: '05.09',
        testEndDate: '08.09',
        testGrade: 95,
        taskGrade: 90,
        averageGrade: 93
      },
      {
        id: 2,
        topicName: 'Условные конструкции языка программирования Python',
        testStartDate: '12.09',
        testEndDate: '15.09',
        testGrade: 88,
        taskGrade: 85,
        averageGrade: 87
      },
      {
        id: 3,
        topicName: 'Практическая работа №1. «Условные конструкции Python»',
        testStartDate: '19.09',
        testEndDate: '22.09',
        testGrade: 92,
        taskGrade: 88,
        averageGrade: 90
      },
      {
        id: 4,
        topicName: 'Цикличные конструкции FOR, WHILE в языке программирования Python',
        testStartDate: '26.09',
        testEndDate: '29.09',
        testGrade: 87,
        taskGrade: 90,
        averageGrade: 89
      },
      {
        id: 5,
        topicName: 'Практическая работа №2. Циклические конструкции',
        testStartDate: '03.10',
        testEndDate: '06.10',
        testGrade: 90,
        taskGrade: 95,
        averageGrade: 93
      },
      {
        id: 6,
        topicName: 'Строки в Python и обработка текстовой информации',
        testStartDate: '10.10',
        testEndDate: '13.10',
        testGrade: 94,
        taskGrade: 92,
        averageGrade: 93
      },
      {
        id: 7,
        topicName: 'Функции и параметры функций',
        testStartDate: '17.10',
        testEndDate: '20.10',
        testGrade: 93,
        taskGrade: 91,
        averageGrade: 92
      }
    ]
  };

  // Safe auth access
  let user = null;
  try {
    const authContext = useAuth();
    user = authContext.user;
  } catch (e) {
    // ignore if auth not available on this page
  }

  const course = courses[courseId] || courses[1];

  // Admin-only overrides: stored per user and course
  const getAdminOverrides = () => {
    if (!user || user.role !== 'admin') return null;
    try {
      const key = `journal_admin_overrides_${user.id}_${course.id}`;
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return null;
    } catch (_) {
      return null;
    }
  };

  const adminOverrides = getAdminOverrides();
  const baseTopics = topics[courseId] || topics[1];
  const courseTopics = (user && user.role === 'admin' && adminOverrides) ? adminOverrides : baseTopics;

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-8 px-6">
      <div className="max-w-6xl mx-auto">
          {/* Back Button moved inside section to sit below navbar */}
          <BackButton className="px-0 sm:px-0 mb-6" onClick={() => onPageChange && onPageChange('journal')}>Назад к журналу</BackButton>
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {course.name}
            </h1>
          </div>

          

          {/* Semester Selector removed */}

          {/* Topics Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border border-gray-200">
                    Название темы
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                    Даты проведения
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                    Оценка тестирования
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                    Оценка решения задач
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-900 border border-gray-200">
                    Средний балл
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
                      {topic.testStartDate} - {topic.testEndDate}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200"
                      title={`${toUsGrade(topic.testGrade).letter} • GPA ${toUsGrade(topic.testGrade).gpa.toFixed(1)}`}
                    >
                      {topic.testGrade}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm text-gray-900 border border-gray-200"
                      title={`${toUsGrade(topic.taskGrade).letter} • GPA ${toUsGrade(topic.taskGrade).gpa.toFixed(1)}`}
                    >
                      {topic.taskGrade}
                    </td>
                    <td
                      className="px-4 py-4 text-center text-sm font-medium text-gray-900 border border-gray-200"
                      title={`${toUsGrade(topic.averageGrade).letter} • GPA ${toUsGrade(topic.averageGrade).gpa.toFixed(1)}`}
                    >
                      {topic.averageGrade}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend removed per request */}
        </div>
      </section>
    </div>
  );
};

export default JournalDetail;
