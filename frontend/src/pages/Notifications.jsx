import React, { useState } from 'react';
import { useLanguage } from '../i18n.jsx';

const Notifications = ({ onPageChange }) => {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      description: 'За урок "Введение в алгоритмы" курса Составление алгоритма и создание блок-схемы на основе спецификации программного обеспечения выставлена оценка 95 баллов',
      date: '20.10.2025 10:38',
      isRead: false,
      hasLink: true
    },
    {
      id: 2,
      description: 'За урок "Основы программирования" курса Составление алгоритма и создание блок-схемы на основе спецификации программного обеспечения выставлена оценка 88 баллов',
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

  const handleGoToJournal = (notificationId) => {
    if (notificationId) {
      markAsRead(notificationId);
    }
    if (onPageChange) {
      onPageChange('journal');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      <section className="pt-20 pb-8 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 mt-12 ml-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Уведомления
            </h1>
            <p className="text-gray-600">
              Следите за своими достижениями и обновлениями
            </p>
          </div>

          {/* Notifications Table */}
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            
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
                            handleGoToJournal(notification.id);
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
