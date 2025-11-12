import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  RefreshCw,
  Plus,
  Search,
  Edit,
  Trash2,
  Shield,
  UserPlus
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth.jsx';
import apiRequest from '../utils/apiClient.js';
import { useLanguage } from '../i18n.jsx';

const ROLE_OPTIONS = [
  { value: '', label: 'Все роли' },
  { value: 'admin', label: 'Администраторы' },
  { value: 'teacher', label: 'Преподаватели' },
  { value: 'student', label: 'Студенты' },
];

const PAGE_SIZE = 10;

const AdminDashboard = () => {
  const { t } = useLanguage();
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const [usersData, setUsersData] = useState({
    items: [],
    loading: false,
    error: '',
    page: 1,
    total: 0,
    role: '',
    groupId: '',
    search: ''
  });
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userModalSaving, setUserModalSaving] = useState(false);

  const [groupsData, setGroupsData] = useState({
    items: [],
    loading: false,
    error: '',
    page: 1,
    total: 0
  });
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupModalSaving, setGroupModalSaving] = useState(false);

  const [groupOptions, setGroupOptions] = useState([]);
  const [globalError, setGlobalError] = useState('');

  const adminNavItems = [
    { id: 'dashboard', label: 'Главная панель', icon: BarChart3 },
    { id: 'users', label: 'Пользователи', icon: Users },
    { id: 'groups', label: 'Группы', icon: Building2 },
    { id: 'courses', label: 'Курсы', icon: BookOpen },
    { id: 'teachers', label: 'Преподаватели', icon: GraduationCap },
    { id: 'settings', label: 'Настройки сайта', icon: Settings },
    { id: 'logout', label: 'Выйти', icon: LogOut },
  ];

  const totalUserPages = useMemo(() => (
    Math.max(1, Math.ceil(usersData.total / PAGE_SIZE))
  ), [usersData.total]);

  const totalGroupPages = useMemo(() => (
    Math.max(1, Math.ceil(groupsData.total / PAGE_SIZE))
  ), [groupsData.total]);

  const fetchGroupOptions = useCallback(async () => {
    try {
      const response = await apiRequest(`/groups?page=1&size=100`);
      setGroupOptions(response.data.groups || []);
    } catch (error) {
      console.error('Не удалось загрузить группы', error);
    }
  }, []);

  const fetchUsers = useCallback(async () => {
    if (currentView !== 'users') return;
    setUsersData(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        page: String(usersData.page),
        size: String(PAGE_SIZE)
      });
      if (usersData.role) params.append('role', usersData.role);
      if (usersData.groupId) params.append('group_id', usersData.groupId);

      const response = await apiRequest(`/users?${params.toString()}`);
      const serverUsers = response.data?.users || [];
      const filteredUsers = usersData.search
        ? serverUsers.filter(u => {
            const query = usersData.search.toLowerCase();
            return (
              u.name.toLowerCase().includes(query) ||
              u.email.toLowerCase().includes(query)
            );
          })
        : serverUsers;

      setUsersData(prev => ({
        ...prev,
        items: filteredUsers,
        total: response.data?.total || filteredUsers.length,
        loading: false
      }));
    } catch (error) {
      setUsersData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Не удалось загрузить пользователей'
      }));
    }
  }, [currentView, usersData.page, usersData.role, usersData.groupId, usersData.search]);

  const fetchGroups = useCallback(async () => {
    if (currentView !== 'groups') return;
    setGroupsData(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const params = new URLSearchParams({
        page: String(groupsData.page),
        size: String(PAGE_SIZE)
      });
      const response = await apiRequest(`/groups?${params.toString()}`);
      setGroupsData(prev => ({
        ...prev,
        items: response.data?.groups || [],
        total: response.data?.total || 0,
        loading: false
      }));
    } catch (error) {
      setGroupsData(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Не удалось загрузить группы'
      }));
    }
  }, [currentView, groupsData.page]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchGroupOptions();
    }
  }, [user, fetchGroupOptions]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleChangeView = (viewId) => {
    if (viewId === 'logout') {
      logout();
      return;
    }
    setCurrentView(viewId);
    setGlobalError('');
  };

  const handleSubmitUser = async (formValues) => {
    setUserModalSaving(true);
    setGlobalError('');
    const payload = {
      name: formValues.name.trim(),
      email: formValues.email.trim(),
      role: formValues.role,
      group_id: formValues.group_id ? Number(formValues.group_id) : null
    };
    if (!editingUser || formValues.password) {
      payload.password = formValues.password || 'Passw0rd!';
    }

    try {
      if (editingUser) {
        await apiRequest(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        if (!formValues.password) {
          payload.password = 'Passw0rd!';
        }
        await apiRequest('/users', {
          method: 'POST',
          body: payload
        });
      }
      setUserModalOpen(false);
      setEditingUser(null);
      setUsersData(prev => ({ ...prev, page: 1 }));
      fetchUsers();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || 'Не удалось сохранить пользователя');
    } finally {
      setUserModalSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Удалить пользователя? Это действие нельзя отменить.')) {
      return;
    }
    setGlobalError('');
    try {
      await apiRequest(`/users/${userId}`, { method: 'DELETE' });
      fetchUsers();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || 'Не удалось удалить пользователя');
    }
  };

  const handleSubmitGroup = async (formValues) => {
    setGroupModalSaving(true);
    setGlobalError('');
    const payload = { name: formValues.name.trim() };
    try {
      if (editingGroup) {
        await apiRequest(`/groups/${editingGroup.id}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        await apiRequest('/groups', {
          method: 'POST',
          body: payload
        });
      }
      setGroupModalOpen(false);
      setEditingGroup(null);
      setGroupsData(prev => ({ ...prev, page: 1 }));
      fetchGroups();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || 'Не удалось сохранить группу');
    } finally {
      setGroupModalSaving(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Удалить группу? Пользователи в группе должны быть переназначены заранее.')) {
      return;
    }
    setGlobalError('');
    try {
      await apiRequest(`/groups/${groupId}`, { method: 'DELETE' });
      fetchGroups();
      fetchGroupOptions();
    } catch (error) {
      setGlobalError(error.message || 'Не удалось удалить группу');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto mt-28 mb-12 bg-white/80 backdrop-blur rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Доступ ограничен</h2>
        <p className="text-gray-600">Эта страница доступна только администраторам платформы.</p>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Главная панель</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: 'Всего пользователей', value: usersData.total || '—', icon: Users, bgClass: 'bg-blue-100', textClass: 'text-blue-600' },
          { title: 'Группы', value: groupsData.total || groupOptions.length, icon: Building2, bgClass: 'bg-purple-100', textClass: 'text-purple-600' },
          { title: 'Преподаватели', value: (usersData.items.filter(u => u.role === 'teacher').length) || '—', icon: GraduationCap, bgClass: 'bg-green-100', textClass: 'text-green-600' },
          { title: 'Активные курсы', value: 45, icon: BookOpen, bgClass: 'bg-yellow-100', textClass: 'text-yellow-600' }
        ].map((card, idx) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${card.bgClass}`}>
                <card.icon className={`w-6 h-6 ${card.textClass}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Быстрые действия</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => { setCurrentView('users'); setUserModalOpen(true); setEditingUser(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Создать пользователя
          </button>
          <button
            onClick={() => { setCurrentView('groups'); setGroupModalOpen(true); setEditingGroup(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Новая группа
          </button>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Управление пользователями</h2>
          <p className="text-gray-600">Создание, фильтрация и управление ролями пользователей платформы.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchUsers()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
          <button
            onClick={() => { setUserModalOpen(true); setEditingUser(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={usersData.search}
              onChange={(e) => setUsersData(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Поиск по имени или email"
              className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={usersData.role}
            onChange={(e) => setUsersData(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {ROLE_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select
            value={usersData.groupId}
            onChange={(e) => setUsersData(prev => ({ ...prev, groupId: e.target.value, page: 1 }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все группы</option>
            {groupOptions.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
          <div className="flex items-center justify-end">
            <span className="text-sm text-gray-500">
              Найдено: {usersData.total}
            </span>
          </div>
        </div>

        {usersData.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {usersData.error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Имя', 'Email', 'Роль', 'Группа', 'Действия'].map(header => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {usersData.loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Загрузка пользователей...
                  </td>
                </tr>
              ) : usersData.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-500">
                    Пользователи не найдены.
                  </td>
                </tr>
              ) : (
                usersData.items.map(item => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">{item.email}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-50 text-blue-600 capitalize">
                        {item.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {groupOptions.find(g => g.id === item.group_id)?.name || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                      <button
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => {
                          setEditingUser(item);
                          setUserModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                        onClick={() => handleDeleteUser(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={usersData.page}
          totalPages={totalUserPages}
          onChange={(page) => setUsersData(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  );

  const renderGroups = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Группы</h2>
          <p className="text-gray-600">Создавайте и обновляйте учебные группы для привязки студентов.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => fetchGroups()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить
          </button>
          <button
            onClick={() => { setGroupModalOpen(true); setEditingGroup(null); }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить группу
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 space-y-4">
        {groupsData.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {groupsData.error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Название', 'Создана', 'Последнее обновление', 'Действия'].map(header => (
                  <th
                    key={header}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupsData.loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Загрузка групп...
                  </td>
                </tr>
              ) : groupsData.items.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-gray-500">
                    Группы не найдены.
                  </td>
                </tr>
              ) : (
                groupsData.items.map(group => (
                  <tr key={group.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">{group.name}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(group.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-600">
                      {new Date(group.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap flex gap-2">
                      <button
                        className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                        onClick={() => {
                          setEditingGroup(group);
                          setGroupModalOpen(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                        Редактировать
                      </button>
                      <button
                        className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 text-sm"
                        onClick={() => handleDeleteGroup(group.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                        Удалить
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          page={groupsData.page}
          totalPages={totalGroupPages}
          onChange={(page) => setGroupsData(prev => ({ ...prev, page }))}
        />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (currentView) {
      case 'users':
        return renderUsers();
      case 'groups':
        return renderGroups();
      default:
        return renderDashboard();
    }
  };

  return (
    <section className="min-h-screen bg-gray-50 pt-20 sm:pt-24 md:pt-28 pb-12 px-4 sm:px-6 md:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-4 text-center"
          >
            Панель администратора
          </motion.h1>
          <div className="text-center">
            <p className="text-gray-600 mb-2">
              Добро пожаловать, <span className="font-semibold">{user?.fullName || user?.name || 'Администратор'}</span>
            </p>
            <p className="text-sm text-gray-500 inline-flex items-center gap-1 justify-center">
              <Shield className="w-4 h-4 text-blue-500" />
              Полные права доступа
            </p>
          </div>
        </div>

        {globalError && (
          <div className="max-w-4xl mx-auto mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {globalError}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 bg-white rounded-lg shadow-md p-6 h-fit"
          >
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Навигация</h2>
            <ul className="space-y-2">
              {adminNavItems.map(item => (
                <li key={item.id}>
                  <motion.button
                    onClick={() => handleChangeView(item.id)}
                    className={`flex items-center gap-3 w-full text-left px-4 py-3 rounded-md transition-colors duration-200 ${
                      currentView === item.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                    }`}
                    whileHover={{ x: 5 }}
                  >
                    <item.icon className="w-5 h-5" />
                    {item.label}
                  </motion.button>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-3"
          >
            {renderContent()}
          </motion.div>
        </div>
      </div>

      <UserModal
        isOpen={userModalOpen}
        onClose={() => { setUserModalOpen(false); setEditingUser(null); }}
        onSubmit={handleSubmitUser}
        initialData={editingUser}
        groups={groupOptions}
        loading={userModalSaving}
      />

      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }}
        onSubmit={handleSubmitGroup}
        initialData={editingGroup}
        loading={groupModalSaving}
      />
    </section>
  );
};

const Pagination = ({ page, totalPages, onChange }) => (
  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
    <span className="text-sm text-gray-600">
      Страница {page} из {totalPages}
    </span>
    <div className="flex gap-2">
      <button
        disabled={page <= 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Назад
      </button>
      <button
        disabled={page >= totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
      >
        Вперед
      </button>
    </div>
  </div>
);

const UserModal = ({ isOpen, onClose, onSubmit, initialData, groups, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    group_id: ''
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: initialData?.name || '',
        email: initialData?.email || '',
        password: '',
        role: initialData?.role || 'student',
        group_id: initialData?.group_id ? String(initialData.group_id) : ''
      });
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Редактирование пользователя' : 'Новый пользователь'}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Имя и фамилия</label>
            <input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Например, Алина Смагулова"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@educode.com"
            />
          </div>
          {!initialData && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Пароль</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Минимум 8 символов"
              />
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="admin">Администратор</option>
                <option value="teacher">Преподаватель</option>
                <option value="student">Студент</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Группа</label>
              <select
                value={formData.group_id}
                onChange={(e) => setFormData(prev => ({ ...prev, group_id: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Без группы</option>
                {groups.map(group => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit(formData)}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

const GroupModal = ({ isOpen, onClose, onSubmit, initialData, loading }) => {
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialData?.name || '');
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-gray-900">
            {initialData ? 'Редактирование группы' : 'Новая группа'}
          </h3>
          <button className="text-gray-400 hover:text-gray-600" onClick={onClose}>✕</button>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Название группы</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            placeholder="Например, CS-101"
          />
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Отмена
          </button>
          <button
            onClick={() => onSubmit({ name })}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
