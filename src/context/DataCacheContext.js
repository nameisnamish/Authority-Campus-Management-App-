/**
 * DataCacheContext - Global cache manager for the app
 * Implements lazy loading with intelligent TTL-based invalidation
 * 
 * Usage:
 * 1. Wrap app with DataCacheProvider
 * 2. Use useCache() hook in any screen
 * 3. Call getCachedData() to check cache
 * 4. Call setCachedData() to save data
 */

import React, { createContext, useState, useCallback, useEffect } from 'react';
import { DATA_SCHEMAS, isCacheValid, validateCacheData } from '../lib/dataSchemas';
import { saveCacheToDisk, loadCacheFromDisk } from '../utils/cacheStorage';

export const DataCacheContext = createContext({
  getCachedData: () => null,
  setCachedData: () => {},
  invalidateCache: () => {},
  clearAllCache: () => {},
  isCached: () => false,
  getCacheExpiry: () => null,
  isHydrated: false,
});

/**
 * DataCacheProvider - Wraps entire app to provide caching
 */
export function DataCacheProvider({ children }) {
  const [cache, setCache] = useState({
    // Data storage
    data: {},
    // Track when each item was cached
    timestamps: {},
    // Debug info
    stats: {
      hits: 0,
      misses: 0,
    }
  });

  const [isHydrated, setIsHydrated] = useState(false);

  // Load cache from disk on startup
  useEffect(() => {
    const initializeCache = async () => {
      const persistedCache = await loadCacheFromDisk();
      if (persistedCache) {
        setCache(prev => ({
          ...persistedCache,
          stats: prev.stats // Reset stats every session
        }));
        console.log('💾 Cache hydrated from disk');
      }
      setIsHydrated(true);
    };
    initializeCache();
  }, []);

  // Save cache to disk whenever it changes
  useEffect(() => {
    if (isHydrated) {
      saveCacheToDisk(cache);
    }
  }, [cache, isHydrated]);

  /**
   * Get data from cache if it's valid and not expired
   * @param {string} cacheKey - Key to retrieve (e.g., 'teacherProfile')
   * @returns {object|null} - Cached data or null if not found/expired
   */
  const getCachedData = useCallback((cacheKey) => {
    try {
      // Check if data exists in cache
      if (!(cacheKey in cache.data)) {
        cache.stats.misses++;
        return null;
      }

      // Get the schema for this cache key
      const schema = Object.values(DATA_SCHEMAS).find(
        s => s.cacheKey === cacheKey
      );

      if (!schema) {
        console.warn(`No schema found for cache key: ${cacheKey}`);
        return null;
      }

      // Check if cache has expired based on TTL
      const cachedAt = cache.timestamps[cacheKey];
      if (!isCacheValid(cachedAt, schema.ttl)) {
        // Cache expired, remove it from memory AND disk
        console.log(`🧹 Cache expired for ${cacheKey}, evicting...`);
        invalidateCache(cacheKey);
        cache.stats.misses++;
        return null;
      }

      // Cache hit - validate structure before returning
      const cachedData = cache.data[cacheKey];
      if (!validateCacheData(cachedData, schema.requiredFields)) {
        console.warn(`Cached data invalid for: ${cacheKey}`);
        invalidateCache(cacheKey);
        return null;
      }

      cache.stats.hits++;
      return cachedData;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }, [cache]);

  /**
   * Save data to cache
   * @param {string} cacheKey - Key to store under
   * @param {object} data - Data to cache
   * @returns {boolean} - True if successfully cached
   */
  const setCachedData = useCallback((cacheKey, data) => {
    try {
      // Get schema for this cache key
      const schema = Object.values(DATA_SCHEMAS).find(
        s => s.cacheKey === cacheKey
      );

      if (!schema) {
        console.warn(`Cannot cache - no schema for: ${cacheKey}`);
        return false;
      }

      // Validate data before caching
      if (!validateCacheData(data, schema.requiredFields)) {
        console.warn(`Invalid data structure for cache key: ${cacheKey}`);
        return false;
      }

      // Save to cache
      setCache(prevCache => ({
        ...prevCache,
        data: {
          ...prevCache.data,
          [cacheKey]: data
        },
        timestamps: {
          ...prevCache.timestamps,
          [cacheKey]: Date.now()
        }
      }));

      console.log(`✅ Cached: ${cacheKey} (TTL: ${schema.ttl / 1000 / 60} minutes)`);
      return true;
    } catch (error) {
      console.error('Error setting cached data:', error);
      return false;
    }
  }, []);

  /**
   * Invalidate (clear) specific cache item
   * @param {string} cacheKey - Key to invalidate
   */
  const invalidateCache = useCallback((cacheKey) => {
    try {
      setCache(prevCache => {
        const newCache = { ...prevCache };
        delete newCache.data[cacheKey];
        delete newCache.timestamps[cacheKey];
        return {
          ...newCache,
          data: newCache.data,
          timestamps: newCache.timestamps
        };
      });

      console.log(`🗑️  Invalidated cache: ${cacheKey}`);
    } catch (error) {
      console.error('Error invalidating cache:', error);
    }
  }, []);

  /**
   * Clear ALL cache items (call on logout)
   */
  const clearAllCache = useCallback(async () => {
    try {
      setCache({
        data: {},
        timestamps: {},
        stats: {
          hits: 0,
          misses: 0,
        }
      });
      
      const { clearDiskCache } = require('../utils/cacheStorage');
      await clearDiskCache();

      console.log('🗑️  All cache cleared (Memory & Disk)');
    } catch (error) {
      console.error('Error clearing all cache:', error);
    }
  }, []);

  /**
   * Check if specific data is in cache
   * @param {string} cacheKey - Key to check
   * @returns {boolean} - True if data exists and is valid
   */
  const isCached = useCallback((cacheKey) => {
    return getCachedData(cacheKey) !== null;
  }, [getCachedData]);

  /**
   * Get cache expiry time for a specific key
   * @param {string} cacheKey - Key to check
   * @returns {number|null} - Milliseconds until expiry, or null if not cached
   */
  const getCacheExpiry = useCallback((cacheKey) => {
    const schema = Object.values(DATA_SCHEMAS).find(
      s => s.cacheKey === cacheKey
    );

    if (!schema || !(cacheKey in cache.timestamps)) {
      return null;
    }

    const cachedAt = cache.timestamps[cacheKey];
    const expiresAt = cachedAt + schema.ttl;
    const now = Date.now();
    const timeRemaining = expiresAt - now;

    return timeRemaining > 0 ? timeRemaining : 0;
  }, [cache]);

  const value = {
    // Core methods
    getCachedData,
    setCachedData,
    invalidateCache,
    clearAllCache,
    // Utility methods
    isCached,
    getCacheExpiry,
    isHydrated,
    // Debug info
    cacheStats: cache.stats,
    cacheData: cache.data, // For debugging only
  };

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}
