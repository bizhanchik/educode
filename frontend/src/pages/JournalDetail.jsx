import React, { useState } from 'react';
import BackButton from '../components/BackButton.jsx';

const JournalDetail = ({ onPageChange, courseId }) => {
  const [selectedSemester, setSelectedSemester] = useState('1');

  const courses = {
    1: {
      id: 1,
      name: 'Алгоритмизация',
      journalType: 'Обычный',
      type: 'Теоретическое обучение',
      group: 'ПО2402',
      gradeType: 'Процентная система (0-100)',
      hours: '48 (12.0)',
      teacher: 'Мартынцов Николай Викторович (12)',
      subject: 'Алгоритмизация'
    }
  };

  const grades = {
    1: {
      dates: ['05.09', '12.09', '19.09', '26.09', '03.10', '10.10'],
      scores: [95, 88, 92, 87, 90, 94]
    }
  };

  const course = courses[courseId] || courses[1];
  const courseGrades = grades[courseId] || grades[1];

  return (
    <div className="bg-white min-h-screen">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange && onPageChange('journal')}>Назад к журналу</BackButton>
      
      {/* Header */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-left mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ← Журнал — {course.name}
            </h1>
          </div>

          {/* Journal Details Block */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Тип журнала:</span>
                  <span className="text-gray-900">{course.journalType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Тип:</span>
                  <span className="text-gray-900">{course.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Группа (Подгруппа):</span>
                  <span className="text-gray-900">{course.group}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Вид оценки:</span>
                  <span className="text-gray-900">{course.gradeType}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Отведено часов:</span>
                  <span className="text-gray-900">{course.hours}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Преподаватели:</span>
                  <span className="text-gray-900">{course.teacher}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-800 font-medium">Предмет:</span>
                  <span className="text-gray-900">{course.subject}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Semester Selector */}
          <div className="mb-6">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50">
              <span>Семестр</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* Grades Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200">
                    Дата
                  </th>
                  {courseGrades.dates.map((date, index) => (
                    <th key={index} className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200">
                      Φ {date}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                    Оценка
                  </td>
                  {courseGrades.scores.map((score, index) => (
                    <td key={index} className="px-4 py-3 text-center text-sm text-gray-900 border-b border-gray-200">
                      {score}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>

          {/* Grade Type Legend */}
          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm text-gray-600">ТИПЫ ОЦЕНОК ПО ЦВЕТУ</span>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
              Показать
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default JournalDetail;
