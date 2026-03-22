import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User, LoginCredentials, RegisterData, STORAGE_KEYS } from '../services';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<{ message: string }>;
  activateAccount: (email: string, code: string) => Promise<{ message: string }>;
  googleLogin: (accessToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        if (token && isMounted) {
          const profile = await authService.getProfile();
          if (isMounted) setUser(profile);
        }
      } catch (error) {
        // Token is invalid or expired
        if (isMounted) {
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.ACCESS_TOKEN,
            STORAGE_KEYS.REFRESH_TOKEN,
            STORAGE_KEYS.USER,
          ]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    const response = await authService.login(credentials);
    setUser(response.user);
  };

  const register = async (data: RegisterData): Promise<{ message: string }> => {
    // Registration now returns a message (requires OTP verification)
    const response = await authService.register(data);
    return response;
  };

  const activateAccount = async (email: string, code: string): Promise<{ message: string }> => {
    const response = await authService.activateAccount(email, code);
    return response;
  };

  const googleLogin = async (accessToken: string) => {
    const response = await authService.googleLogin(accessToken);
    setUser(response.user);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await authService.getProfile();
      setUser(profile);
    } catch (error) {
      // If refresh fails, log out
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        activateAccount,
        googleLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
