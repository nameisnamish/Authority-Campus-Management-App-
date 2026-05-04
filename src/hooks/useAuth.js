import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth Hook
 * 
 * Usage: const { login, logout, isSignedIn, user, userRole } = useAuth();
 * 
 * Returns:
 * - isLoading: boolean - Loading state
 * - isSignOut: boolean - Whether user is signed out
 * - isSignedIn: boolean - Whether user is authenticated
 * - user: object - User data (id, email, role)
 * - userRole: string - User role ('Student' or 'Teacher')
 * - error: string - Error message if any
 * - login(email, password, role): Promise - Login function
 * - logout(): Promise - Logout function
 * - checkAuthStatus(): Promise - Verify auth status
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};
