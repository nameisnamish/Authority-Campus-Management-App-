/**
 * useCache Hook - Simple wrapper to access DataCacheContext
 * 
 * Usage:
 * const { getCachedData, setCachedData, invalidateCache } = useCache();
 * 
 * // Check if data is cached
 * const cachedProfile = getCachedData('teacherProfile');
 * 
 * // Cache new data
 * setCachedData('teacherProfile', profileData);
 * 
 * // Clear specific cache
 * invalidateCache('teacherProfile');
 * 
 * // Clear all cache (Handled automatically on logout, but available manually)
 * clearAllCache();
 */

import { useContext } from 'react';
import { DataCacheContext } from '../context/DataCacheContext';

export const useCache = () => {
  const context = useContext(DataCacheContext);

  if (!context) {
    throw new Error('useCache must be used within DataCacheProvider');
  }

  return context;
};
