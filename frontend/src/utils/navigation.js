export const ROLE_LANDING_PAGES = {
  admin: 'admin-dashboard',
  teacher: 'teacher-dashboard',
  student: 'courses'
};

export const getLandingPageForRole = (role) => {
  if (!role) return 'home';
  return ROLE_LANDING_PAGES[role] || 'home';
};
