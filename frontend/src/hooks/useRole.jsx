import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from './useAuth.jsx';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const { user: authUser, loading: authLoading } = useAuth();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading) {
      if (authUser) {
        setUser(authUser);
        setRole(authUser.role || 'student');
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const updateUser = (userData) => {
    setUser(userData);
    setRole(userData.role || 'student');
  };

  const logout = () => {
    setUser(null);
    setRole(null);
  };

  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';
  const isAdmin = role === 'admin';

  const getRoleDisplayName = () => {
    switch (role) {
      case 'student': return '👩‍🎓 Студент';
      case 'teacher': return '👩‍🏫 Преподаватель';
      case 'admin': return '🧑‍💼 Администратор';
      default: return 'Гость';
    }
  };

  const getRoleIcon = () => {
    switch (role) {
      case 'student': return '🎓';
      case 'teacher': return '🏫';
      case 'admin': return '💼';
      default: return '👤';
    }
  };

  const value = {
    user,
    role,
    loading,
    isStudent,
    isTeacher,
    isAdmin,
    getRoleDisplayName,
    getRoleIcon,
    updateUser,
    logout
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};

const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

export default useRole;