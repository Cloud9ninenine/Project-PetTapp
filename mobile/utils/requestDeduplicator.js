/**
 * Request deduplicator - prevents duplicate in-flight API requests
 * Highly useful for preventing race conditions and saving bandwidth
 */

class RequestDeduplicator {
  constructor() {
    this.inFlightRequests = new Map();
  }

  /**
   * Generate a unique key for the request
   * @param {string} method - HTTP method (GET, POST, etc)
   * @param {string} url - Request URL
   * @param {Object} params - Query parameters
   * @param {*} data - Request body data
   * @returns {string} - Unique request key
   */
  generateKey(method, url, params = {}, data = null) {
    // Only deduplicate GET requests (safe to deduplicate)
    if (method.toUpperCase() !== 'GET') {
      return null;
    }

    // Create key from method, URL, and params
    const key = `${method.toUpperCase()}:${url}:${JSON.stringify(params || {})}`;
    return key;
  }

  /**
   * Execute request with deduplication
   * If same request is in-flight, returns the same promise
   * @param {string} method - HTTP method
   * @param {string} url - Request URL
   * @param {Function} requestFn - Function that executes the request
   * @param {Object} params - Query parameters
   * @returns {Promise} - Response promise
   */
  async execute(method, url, requestFn, params = {}) {
    const key = this.generateKey(method, url, params);

    // If no key generated (not a GET request), execute directly
    if (!key) {
      if (__DEV__) {
        console.log(`📤 Request (non-dedup): ${method} ${url}`);
      }
      return requestFn();
    }

    // Check if request already in-flight
    if (this.inFlightRequests.has(key)) {
      if (__DEV__) {
        console.log(`🔄 Request DEDUP: ${method} ${url} (reusing in-flight)`);
      }
      return this.inFlightRequests.get(key);
    }

    // Start new request
    if (__DEV__) {
      console.log(`📤 Request NEW: ${method} ${url}`);
    }

    const promise = requestFn()
      .then((response) => {
        // Remove from in-flight on success
        this.inFlightRequests.delete(key);
        return response;
      })
      .catch((error) => {
        // Remove from in-flight on error
        this.inFlightRequests.delete(key);
        throw error;
      });

    // Store in-flight request
    this.inFlightRequests.set(key, promise);

    return promise;
  }

  /**
   * Clear all in-flight requests
   */
  clear() {
    this.inFlightRequests.clear();
    if (__DEV__) {
      console.log(`🗑️ Request deduplicator CLEARED`);
    }
  }

  /**
   * Get current in-flight requests count
   * @returns {number} - Number of in-flight requests
   */
  getInFlightCount() {
    return this.inFlightRequests.size;
  }
}

// Export singleton instance
export default new RequestDeduplicator();
