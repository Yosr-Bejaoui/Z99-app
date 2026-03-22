import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService, AdminUser, LoginCredentials } from '../services/authService';

export function useAuth() {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuth = () => {
      const currentUser = authService.getCurrentUser();
      const hasToken = authService.isAuthenticated();
      
      if (currentUser && hasToken) {
        // Verify user is admin
        if (currentUser.is_staff || currentUser.is_superuser) {
          setUser(currentUser);
          setIsAuthenticated(true);
        } else {
          // Not an admin, clear auth
          authService.logout();
          setUser(null);
          setIsAuthenticated(false);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      const response = await authService.login(credentials);
      
      // Check if user is admin
      if (!response.user.is_staff && !response.user.is_superuser) {
        await authService.logout();
        throw new Error('Access denied. Admin privileges required.');
      }
      
      setUser(response.user);
      setIsAuthenticated(true);
      navigate('/');
      return response;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  const updateUser = useCallback((updates: Partial<AdminUser>) => {
    const current = authService.getCurrentUser();
    if (current) {
      const updated = { ...current, ...updates };
      localStorage.setItem('admin_user', JSON.stringify(updated));
      setUser(updated);
    }
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    updateUser,
  };
}

export default useAuth;
