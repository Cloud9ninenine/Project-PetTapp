/**
 * In-memory cache manager with TTL support
 * Provides fast data access without repeated API calls
 */

class CacheManager {
  constructor() {
    this.cache = new Map();
    this.timers = new Map();
  }

  /**
   * Set data in cache with optional TTL (Time To Live)
   * @param {string} key - Cache key
   * @param {*} data - Data to cache
   * @param {number} ttlMs - Time to live in milliseconds (default: 5 minutes)
   */
  set(key, data, ttlMs = 300000) {
    // Clear existing timer if any
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    // Store data
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });

    // Set auto-expiry timer
    const timer = setTimeout(() => {
      this.delete(key);
    }, ttlMs);

    this.timers.set(key, timer);

    if (__DEV__) {
      console.log(`✅ Cache SET: ${key} (TTL: ${ttlMs / 1000}s)`);
    }
  }

  /**
   * Get data from cache
   * Returns null if expired or not found
   * @param {string} key - Cache key
   * @returns {* | null} - Cached data or null
   */
  get(key) {
    const entry = this.cache.get(key);

    if (!entry) {
      if (__DEV__) {
        console.log(`❌ Cache MISS: ${key}`);
      }
      return null;
    }

    // Check if expired
    const now = Date.now();
    const age = now - entry.timestamp;

    if (age > entry.ttl) {
      this.delete(key);
      if (__DEV__) {
        console.log(`⏰ Cache EXPIRED: ${key}`);
      }
      return null;
    }

    if (__DEV__) {
      console.log(`✅ Cache HIT: ${key} (age: ${age / 1000}s)`);
    }

    return entry.data;
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean} - True if valid cache exists
   */
  has(key) {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Delete specific cache entry
   * @param {string} key - Cache key
   */
  delete(key) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }
    this.cache.delete(key);

    if (__DEV__) {
      console.log(`🗑️ Cache DELETED: ${key}`);
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    // Clear all timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();

    // Clear cache
    this.cache.clear();

    if (__DEV__) {
      console.log(`🗑️ Cache CLEARED`);
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} - Cache stats
   */
  getStats() {
    const stats = {
      totalEntries: this.cache.size,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => {
        const age = Date.now() - entry.timestamp;
        const remaining = entry.ttl - age;
        return {
          key,
          age: Math.round(age / 1000),
          remaining: Math.round(Math.max(0, remaining) / 1000),
          ttl: entry.ttl / 1000,
        };
      }),
    };
    return stats;
  }
}

// Export singleton instance
export default new CacheManager();
