import React, { useState } from 'react';
import BackButton from '../components/BackButton.jsx';

const Notifications = ({ onPageChange }) => {
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      description: 'За урок "Введение в алгоритмы" курса Алгоритмизация выставлена оценка 95 баллов',
      date: '20.10.2025 10:38',
      isRead: false,
      hasLink: true
    },
    {
      id: 2,
      description: 'За урок "Основы программирования" курса Алгоритмизация выставлена оценка 88 баллов',
      date: '20.10.2025 10:30',
      isRead: false,
      hasLink: true
    }
  ]);

  const markAsRead = (id) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const handleGoToJournal = () => {
    if (onPageChange) {
      onPageChange('journal');
    }
  };

  return (
    <div className="bg-gradient-to-b from-[#f9fafb] to-[#edf2f7] min-h-screen">
      {/* Back Button */}
      <BackButton onClick={() => onPageChange && onPageChange('courses')}>Назад к курсам</BackButton>
      
      {/* Header */}
      <section className="pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-left mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Уведомления
            </h1>
            <p className="text-gray-600">
              Следите за своими достижениями и обновлениями
            </p>
          </div>

          {/* Notifications Table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 cursor-pointer transition-colors hover:bg-gray-50 ${
                    !notification.isRead ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className={`text-base ${
                        !notification.isRead ? 'text-gray-900 font-medium' : 'text-gray-600'
                      }`}>
                        {notification.description}
                      </p>
                      {notification.hasLink && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGoToJournal();
                          }}
                          className="text-blue-600 hover:text-blue-800 underline text-sm mt-1"
                        >
                          Перейти в журнал
                        </button>
                      )}
                    </div>
                    <div className="ml-4 text-sm text-gray-500">
                      {notification.date}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>
    </div>
  );
};

export default Notifications;
