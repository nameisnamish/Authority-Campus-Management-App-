/**
 * Storage Engine for DataCacheContext
 * Uses AsyncStorage to persist data across app restarts
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_STORAGE_KEY = 'authority_app_cache';

/**
 * Save cache state to persistent storage
 */
export const saveCacheToDisk = async (cacheState) => {
  try {
    const jsonValue = JSON.stringify(cacheState);
    await AsyncStorage.setItem(CACHE_STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error('Error saving cache to disk:', e);
  }
};

/**
 * Load cache state from persistent storage
 */
export const loadCacheFromDisk = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(CACHE_STORAGE_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : null;
  } catch (e) {
    console.error('Error loading cache from disk:', e);
    return null;
  }
};

/**
 * Clear all cache from persistent storage
 */
export const clearDiskCache = async () => {
  try {
    await AsyncStorage.removeItem(CACHE_STORAGE_KEY);
  } catch (e) {
    console.error('Error clearing disk cache:', e);
  }
};
