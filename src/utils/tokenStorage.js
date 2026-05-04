import * as SecureStore from 'expo-secure-store';

const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_ROLE: 'user_role',
  USER_EMAIL: 'user_email',
  USER_ID: 'user_id',
};

/**
 * In-memory cache for tokens (used for synchronous access in axios interceptor)
 * Initialized on app startup in AuthContext
 */
const tokenCache = {
  [TOKEN_KEYS.ACCESS_TOKEN]: null,
  [TOKEN_KEYS.REFRESH_TOKEN]: null,
  [TOKEN_KEYS.USER_ROLE]: null,
  [TOKEN_KEYS.USER_EMAIL]: null,
  [TOKEN_KEYS.USER_ID]: null,
};

/**
 * Initialize token cache from persistent storage
 * Call this once on app startup
 */
export const initializeTokenCache = async () => {
  try {
    const keys = Object.values(TOKEN_KEYS);
    for (const key of keys) {
      try {
        const value = await SecureStore.getItemAsync(key);
        if (value) {
          tokenCache[key] = value;
        }
      } catch (err) {
        console.warn(`Error reading ${key} from secure store:`, err);
      }
    }
    console.log('Token cache initialized');
  } catch (error) {
    console.error('Error initializing token cache:', error);
  }
};

/**
 * Save tokens to secure storage and cache
 */
export const saveTokens = async (accessToken, refreshToken, user) => {
  try {
    // Save to persistent secure storage
    await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);

    // Update in-memory cache
    tokenCache[TOKEN_KEYS.ACCESS_TOKEN] = accessToken;
    tokenCache[TOKEN_KEYS.REFRESH_TOKEN] = refreshToken;

    if (user) {
      await SecureStore.setItemAsync(TOKEN_KEYS.USER_ROLE, user.role || '');
      await SecureStore.setItemAsync(TOKEN_KEYS.USER_EMAIL, user.email || '');
      await SecureStore.setItemAsync(TOKEN_KEYS.USER_ID, String(user.id || ''));

      // Update cache
      tokenCache[TOKEN_KEYS.USER_ROLE] = user.role;
      tokenCache[TOKEN_KEYS.USER_EMAIL] = user.email;
      tokenCache[TOKEN_KEYS.USER_ID] = String(user.id);
    }

    return true;
  } catch (error) {
    console.error('Error saving tokens:', error);
    return false;
  }
};

/**
 * Retrieve access token from cache (synchronous)
 */
export const getAccessToken = () => {
  return tokenCache[TOKEN_KEYS.ACCESS_TOKEN] || null;
};

/**
 * Retrieve refresh token from cache (synchronous)
 */
export const getRefreshToken = () => {
  return tokenCache[TOKEN_KEYS.REFRESH_TOKEN] || null;
};

/**
 * Retrieve user role from cache (synchronous)
 */
export const getUserRole = () => {
  return tokenCache[TOKEN_KEYS.USER_ROLE] || null;
};

/**
 * Retrieve user email from cache (synchronous)
 */
export const getUserEmail = () => {
  return tokenCache[TOKEN_KEYS.USER_EMAIL] || null;
};

/**
 * Retrieve all user data from cache (synchronous)
 */
export const getUserData = () => {
  return {
    id: tokenCache[TOKEN_KEYS.USER_ID],
    email: tokenCache[TOKEN_KEYS.USER_EMAIL],
    role: tokenCache[TOKEN_KEYS.USER_ROLE],
  };
};

/**
 * Clear all tokens and user data from storage and cache
 */
export const clearTokens = async () => {
  try {
    const keys = Object.values(TOKEN_KEYS);
    for (const key of keys) {
      try {
        await SecureStore.deleteItemAsync(key);
      } catch (err) {
        console.warn(`Error deleting ${key} from secure store:`, err);
      }
    }

    // Clear cache
    Object.keys(tokenCache).forEach((key) => {
      tokenCache[key] = null;
    });

    return true;
  } catch (error) {
    console.error('Error clearing tokens:', error);
    return false;
  }
};

/**
 * Check if user is authenticated (has valid tokens)
 */
export const isAuthenticated = () => {
  const accessToken = tokenCache[TOKEN_KEYS.ACCESS_TOKEN];
  const refreshToken = tokenCache[TOKEN_KEYS.REFRESH_TOKEN];
  return !!(accessToken || refreshToken);
};
