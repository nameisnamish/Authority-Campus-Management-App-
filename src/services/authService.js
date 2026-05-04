import axios from 'axios';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens } from '../utils/tokenStorage';
import { AUTH_API_ROUTES } from '../lib/constants';

// Get API route or use default
const API_BASE_URL = AUTH_API_ROUTES.LOGIN.replace('/api/mobile/login', '/api');

const MOCK_MODE = false; // Set to false when your backend is ready

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Add access token to request headers
 */
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken();
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Handle token refresh on 401 responses
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // No refresh token, need to login again
          await clearTokens();
          throw new Error('No refresh token available');
        }

        // Attempt to refresh token
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });

        if (response.data.access_token) {
          // Save new access token
          saveTokens(response.data.access_token, refreshToken, response.data.user);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${response.data.access_token}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        await clearTokens();
        // Navigation to login will be handled by AuthContext
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Login with email and password
 * Calls backend mobile login endpoint: POST /api/mobile/login
 */
export const login = async (email, password) => {
  try {
    console.log('authService.login called with:', { email, password });

    if (MOCK_MODE) {
      /* Lines 90-119 omitted */
    }

    // Call the real mobile login endpoint
    const response = await axios.post(
      AUTH_API_ROUTES.LOGIN,
      {
        email,
        password,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    console.log('Login response:', response.data);
    console.log('🔐 JWT Token received:', response.data.token);
    console.log('👤 User data:', response.data.user);

    if (response.data.token) {
      // Save tokens to secure storage
      // Note: We use response.data.token as access_token and refresh_token (if not provided)
      await saveTokens(
        response.data.token,
        response.data.token, // Assuming same token for now or if backend doesn't provide refresh
        response.data.user
      );
      console.log('✅ Token saved to secure storage');

      return {
        success: true,
        user: response.data.user,
        message: 'Login successful',
      };
    }

    return {
      success: false,
      message: 'No token received from server',
    };
  } catch (error) {
    console.error('Login error:', error.response?.data || error.message);

    return {
      success: false,
      message: error.response?.data?.message || error.message || 'Login failed',
      error: error.response?.data,
    };
  }
};

/**
 * Logout - notify backend and clear local storage
 */
export const logout = async () => {
  try {
    const refreshToken = getRefreshToken();

    if (MOCK_MODE) {
      console.log('⚠️ MOCK MODE ENABLED: Faking logout response');
      await clearTokens();
      return { success: true, message: 'Mock Logout successful' };
    }

    // Notify backend of logout
    if (refreshToken) {
      try {
        await axios.post(
          'https://b8f3-112-133-228-52.ngrok-free.app/api/auth/logout',
          { refresh_token: refreshToken }
        );
      } catch (err) {
        console.warn('Backend logout failed, clearing local storage anyway:', err.message);
      }
    }

    // Clear tokens from storage regardless of backend response
    await clearTokens();

    return {
      success: true,
      message: 'Logout successful',
    };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear tokens even if error
    await clearTokens();

    return {
      success: false,
      message: 'Logout completed with errors',
    };
  }
};

/**
 * Verify if stored tokens are still valid
 */
export const verifyToken = async () => {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      return {
        isValid: false,
        message: 'No access token found',
      };
    }

    // Make a simple API call to verify token
    const response = await apiClient.get('/auth/verify');

    return {
      isValid: true,
      user: response.data.user,
    };
  } catch (error) {
    console.error('Token verification failed:', error.message);

    return {
      isValid: false,
      message: 'Token verification failed',
    };
  }
};

export default apiClient;
