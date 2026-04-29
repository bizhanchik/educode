import React, { createContext, useContext, useState, useEffect } from 'react';

const RoleContext = createContext();

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export const RoleProvider = ({ children }) => {
  const [userRole, setUserRole] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Загружаем данные пользователя из localStorage при инициализации
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        setUserRole(userData.role || 'student');
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    const userWithRole = {
      ...userData,
      role: userData.role || 'student'
    };
    setUser(userWithRole);
    setUserRole(userWithRole.role);
    localStorage.setItem('user', JSON.stringify(userWithRole));
  };

  const logout = () => {
    setUser(null);
    setUserRole(null);
    localStorage.removeItem('user');
  };

  const updateUserRole = (newRole) => {
    if (user) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      setUserRole(newRole);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const value = {
    userRole,
    user,
    loading,
    login,
    logout,
    updateUserRole,
    isStudent: userRole === 'student',
    isTeacher: userRole === 'teacher',
    isAdmin: userRole === 'admin',
    isAuthenticated: !!user
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
