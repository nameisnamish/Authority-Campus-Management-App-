import React, { createContext, useState, useCallback, useEffect } from 'react';
import * as authService from '../services/authService';
import { getUserData, isAuthenticated, initializeTokenCache } from '../utils/tokenStorage';

/**
 * AuthContext - Manages authentication state throughout the app
 */
export const AuthContext = createContext({
  isLoading: false,
  isSignOut: false,
  isSignedIn: false,
  user: null,
  userRole: null,
  error: null,
  login: () => {},
  logout: () => {},
  checkAuthStatus: () => {},
});

/**
 * AuthProvider - Wraps the app to provide auth context
 */
export function AuthProvider({ children }) {
  const [state, dispatch] = useState({
    isLoading: true,
    isSignOut: false,
    isSignedIn: false,
    user: null,
    userRole: null,
    error: null,
  });

  /**
   * Check if user is authenticated on app startup
   */
  const checkAuthStatus = useCallback(async () => {
    try {
      dispatch((prev) => ({ ...prev, isLoading: true }));

      // Initialize token cache from persistent storage
      await initializeTokenCache();

      // Check if tokens exist in storage
      if (!isAuthenticated()) {
        dispatch((prev) => ({
          ...prev,
          isLoading: false,
          isSignedIn: false,
          user: null,
          userRole: null,
        }));
        return;
      }

      // Get stored user data
      const userData = getUserData();

      if (userData && userData.email && userData.role) {
        // Optionally verify token with backend (uncomment if needed)
        // const verificationResult = await authService.verifyToken();
        // if (!verificationResult.isValid) {
        //   throw new Error('Token invalid');
        // }

        dispatch((prev) => ({
          ...prev,
          isLoading: false,
          isSignedIn: true,
          user: userData,
          userRole: userData.role,
          error: null,
        }));
      } else {
        dispatch((prev) => ({
          ...prev,
          isLoading: false,
          isSignedIn: false,
          user: null,
          userRole: null,
        }));
      }
    } catch (error) {
      console.error('Auth status check failed:', error);
      dispatch((prev) => ({
        ...prev,
        isLoading: false,
        isSignedIn: false,
        user: null,
        userRole: null,
        error: error.message,
      }));
    }
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    try {
      dispatch((prev) => ({ ...prev, isLoading: true, error: null }));

      const result = await authService.login(email, password);

      if (result.success) {
        dispatch((prev) => ({
          ...prev,
          isLoading: false,
          isSignedIn: true,
          user: result.user,
          userRole: result.user.role,
          isSignOut: false,
          error: null,
        }));

        return {
          success: true,
          user: result.user,
        };
      } else {
        dispatch((prev) => ({
          ...prev,
          isLoading: false,
          error: result.message,
        }));

        return {
          success: false,
          error: result.message,
        };
      }
    } catch (error) {
      const errorMessage = error.message || 'Login failed';
      dispatch((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      return {
        success: false,
        error: errorMessage,
      };
    }
  }, []);

  /**
   * Logout user
   */
  const logout = useCallback(async () => {
    try {
      dispatch((prev) => ({ ...prev, isLoading: true }));

      await authService.logout();

      dispatch((prev) => ({
        ...prev,
        isLoading: false,
        isSignedIn: false,
        isSignOut: true,
        user: null,
        userRole: null,
        error: null,
      }));

      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      dispatch((prev) => ({
        ...prev,
        isLoading: false,
        error: error.message,
      }));

      return { success: false, error: error.message };
    }
  }, []);

  // Check auth status on mount
  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const value = {
    ...state,
    login,
    logout,
    checkAuthStatus,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
