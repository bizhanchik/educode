import React from 'react';

const tabs = [
  { id: 'courses', label: 'Предметы (курсы)' },
  { id: 'teachers', label: 'Преподаватели' },
  { id: 'students', label: 'Студенты' },
  { id: 'groups', label: 'Группы' },
  { id: 'statistics', label: 'Статистика' },
  { id: 'settings', label: 'Настройки' },
];

const AdminLayout = ({ activeTab, onTabChange, title, children }) => {
  return (
    <section className="pt-20 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-left mb-6">
          <h1 className="text-[28px] font-bold text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.id}
              className={`px-4 py-2 rounded-lg text-sm font-medium border whitespace-nowrap ${
                activeTab === t.id
                  ? 'bg-[#2563eb] text-white border-[#2563eb]'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => onTabChange && onTabChange(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="bg-[#f7f9fc] rounded-xl p-4 sm:p-6 border border-gray-200">
          {children}
        </div>
      </div>
    </section>
  );
};

export default AdminLayout;


