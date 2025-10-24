import React, { useState } from 'react';
import BackButton from '../components/BackButton.jsx';

const Journal = ({ onPageChange }) => {
  const [activeTab, setActiveTab] = useState('open');

  const courses = [
    {
      id: 1,
      name: 'Алгоритмизация',
      type: 'Теоретическое обучение',
      journalType: 'Обычный',
      program: 'Линейное обучение',
      modules: '',
      group: 'ПО2402',
      discipline: 'Алгоритмизация',
      teacher: 'Мартынцов Николай Викторович',
      status: 'open'
    }
  ];

  const handleRowClick = (courseId) => {
    if (onPageChange) {
      onPageChange('journal-detail');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>

      {/* Header */}
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-left mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              ЖУРНАЛ
        </h1>
          </div>

          {/* Tabs */}
          <div className="flex space-x-8 mb-6">
            <button
              onClick={() => setActiveTab('open')}
              className={`pb-3 border-b-2 text-lg font-medium ${
                activeTab === 'open'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Открытые
            </button>
            <button
              onClick={() => setActiveTab('closed')}
              className={`pb-3 border-b-2 text-lg font-medium ${
                activeTab === 'closed'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Закрытые
            </button>
                  </div>
                  
          {/* Filter Button */}
          <div className="flex items-center justify-between mb-6">
            <button className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-base font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Фильтрация списка
            </button>
            <div className="text-base text-gray-600 font-medium">
              Количество: {filteredCourses.length}
            </div>
          </div>

<<<<<<< HEAD
          {/* Table */}
          <div className="bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      №
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Название
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Тип журнала
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Программа
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Модули
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Группа / Подгруппа
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Дисциплина
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Преподаватель
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Операции
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCourses.map((course, index) => (
                    <tr key={course.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => handleRowClick(course.id)}>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {index + 1}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {course.name}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.type}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.journalType}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.program}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.modules}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.group}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.discipline}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {course.teacher}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
=======
        {/* Фильтр */}
        <div className="mb-6">
          <button className="px-6 py-3 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
            <Filter className="w-4 h-4" />
            Фильтр
          </button>
            </div>

        {/* Таблица */}
        <div className="bg-white border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Тип</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Группа</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Вид оценки</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Часы</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Преподаватель</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Предмет</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {courses.map((course) => (
                <tr
                  key={course.id}
                  onClick={() => handleRowClick(course.id)}
                  className="cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.group}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.gradeType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.hours}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.teacher}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{course.subject}</td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
          </div>
>>>>>>> 706454d (ready for implementation)
    </div>
  );
};

export default Journal;