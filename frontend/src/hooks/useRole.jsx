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
        console.log('[Role] Setting user from authUser:', authUser, 'Role:', authUser.role);
        setUser(authUser);
        // Only default to 'student' if role is truly missing
        const userRole = authUser.role || 'student';
        setRole(userRole);
        if (!authUser.role) {
          console.warn('[Role] User missing role field, defaulting to student:', authUser);
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    }
  }, [authUser, authLoading]);

  const updateUser = (userData) => {
    console.log('[Role] Updating user:', userData, 'Role:', userData?.role);
    setUser(userData);
    // Only default to 'student' if role is truly missing
    const userRole = userData?.role || 'student';
    setRole(userRole);
    if (!userData?.role) {
      console.warn('[Role] UserData missing role field, defaulting to student:', userData);
    }
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