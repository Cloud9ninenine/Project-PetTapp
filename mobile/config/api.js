import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const API_URL = 'https://pettapp.onrender.com';

// Debug: Log API configuration on load
if (__DEV__) {
  console.log('⚙️  API initialized with URL:', API_URL);
}

// Progressive timeout configuration
const TIMEOUT_CONFIG = {
  initial: 8000,        // 8s for first attempt (increased from 5s)
  progressive: [12000, 20000, 30000, 45000, 60000, 90000, 120000], // Progressive timeouts with longer waits for cold starts
  max: 120000,          // Max 120s timeout (increased from 60s to handle Render cold starts)
};

// Server health status tracker
let serverStatus = {
  isOnline: null,
  lastChecked: null,
  consecutiveFailures: 0,
  isChecking: false,
  isAwake: false,      // Track if server has been awakened
};

// Keep-alive configuration
const KEEP_ALIVE_INTERVAL = 60000; // Ping every 60 seconds (reduced from 25s for better performance)
const WAKE_SEQUENCE_PINGS = 8;     // Number of pings during wake sequence (increased from 6)
let keepAliveIntervalId = null;
let isAppForegrounded = true;

// Health check interval (ping every 45 seconds when actively monitoring)
const HEALTH_CHECK_INTERVAL = 45000; // Increased from 30 seconds to reduce load
let healthCheckIntervalId = null;

// Flag to prevent multiple token refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 45000, // Progressive timeout - suitable for cold starts (max 45s)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper function to refresh access token
const refreshAccessToken = async () => {
  try {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    console.log('🔄 Refreshing access token...');

    const response = await axios.post(`${API_URL}/auth/refresh-token`, {
      refreshToken,
    }, {
      timeout: 15000,
    });

    if (response.data && response.data.accessToken) {
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      console.log('✅ Access token refreshed successfully');
      return response.data.accessToken;
    }

    throw new Error('No access token in refresh response');
  } catch (error) {
    console.error('❌ Token refresh failed:', error.message);
    // Clear invalid tokens
    await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
    throw error;
  }
};

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  async (config) => {
    // Add authentication token if available
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error retrieving token:', error);
    }

    // Log the request for debugging (only in development)
    if (__DEV__) {
      console.log('=== API REQUEST ===');
      console.log('Method:', config.method?.toUpperCase());
      console.log('URL:', config.url);
      console.log('==================');
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  (response) => {
    // Reset consecutive failures on successful response
    serverStatus.consecutiveFailures = 0;
    serverStatus.isOnline = true;
    serverStatus.isAwake = true;
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle token expiration (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return apiClient(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear auth data and redirect to login would happen here
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle timeout errors (ECONNABORTED)
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout - server may be waking up');
      serverStatus.consecutiveFailures++;
    }

    // Handle network errors
    if (error.request && !error.response) {
      console.error('🌐 Network Error - no response from server');
      serverStatus.consecutiveFailures++;
      serverStatus.isOnline = false;
    }

    // Handle server errors
    if (error.response) {
      if (__DEV__) {
        console.error('API Error:', {
          status: error.response.status,
          message: error.response.data?.message || error.message,
        });
      }
    }

    return Promise.reject(error);
  }
);

/**
 * Get timeout for given attempt number using progressive timeout strategy
 * @param {number} attempt - The attempt number (1-indexed)
 * @returns {number} - Timeout in milliseconds
 */
const getProgressiveTimeout = (attempt) => {
  if (attempt === 1) return TIMEOUT_CONFIG.initial;
  const index = attempt - 2;
  return TIMEOUT_CONFIG.progressive[index] || TIMEOUT_CONFIG.max;
};

/**
 * Check if the server is online with timeout guarantee
 * @param {number} timeoutMs - Optional timeout override in milliseconds
 * @returns {Promise<boolean>} - Returns true if server is reachable
 */
export const checkServerHealth = async (timeoutMs = 8000) => {
  try {
    console.log(`🏥 Checking server health (timeout: ${timeoutMs / 1000}s)...`);

    // Create a new axios instance with explicit timeout for this request
    const healthCheckClient = axios.create({
      baseURL: API_URL,
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' }
    });

    // Race the request against a timeout to ensure completion
    const response = await Promise.race([
      healthCheckClient.get('/health'),
      new Promise((_, reject) =>
        setTimeout(() => {
          reject(new Error(`Health check timeout after ${timeoutMs / 1000}s`));
        }, timeoutMs + 500) // Add 500ms buffer for cleanup
      )
    ]);

    // Successful response
    serverStatus.isOnline = true;
    serverStatus.isAwake = true;
    serverStatus.lastChecked = new Date();
    serverStatus.consecutiveFailures = 0;

    console.log('✅ Server is online and healthy');
    return true;

  } catch (error) {
    // Track failures
    serverStatus.consecutiveFailures++;
    serverStatus.isOnline = false;
    serverStatus.lastChecked = new Date();

    console.error(`❌ Server health check failed (attempt ${serverStatus.consecutiveFailures})`);
    console.error(`   Error: ${error.message}`);

    return false;
  }
};

/**
 * Start automatic server health monitoring
 * Pings the server at regular intervals
 */
export const startServerMonitoring = () => {
  // Don't start if already monitoring
  if (healthCheckIntervalId) {
    console.log('📊 Server monitoring already active');
    return;
  }

  console.log('🚀 Starting server health monitoring...');

  // Initial health check
  checkServerHealth();

  // Set up periodic health checks
  healthCheckIntervalId = setInterval(() => {
    checkServerHealth();
  }, HEALTH_CHECK_INTERVAL);

  console.log(`✅ Server monitoring started (checking every ${HEALTH_CHECK_INTERVAL / 1000}s)`);
};

/**
 * Stop automatic server health monitoring
 */
export const stopServerMonitoring = () => {
  if (healthCheckIntervalId) {
    clearInterval(healthCheckIntervalId);
    healthCheckIntervalId = null;
    console.log('🛑 Server monitoring stopped');
  }
};

/**
 * Get current server status
 * @returns {Object} - Current server status information
 */
export const getServerStatus = () => {
  return {
    ...serverStatus,
    lastCheckedFormatted: serverStatus.lastChecked
      ? serverStatus.lastChecked.toLocaleTimeString()
      : 'Never',
    keepAliveActive: keepAliveIntervalId !== null,
    isForegrounded: isAppForegrounded,
  };
};

/**
 * Wait for server to be online before proceeding with progressive timeouts
 * Useful before login or critical operations
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} initialDelay - Initial delay between retries in ms
 * @returns {Promise<boolean>} - Returns true if server becomes online
 */
export const waitForServer = async (maxRetries = 5, initialDelay = 2000) => {
  console.log(`⏳ Waiting for server to be online (max ${maxRetries} attempts)...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Timeout increases with each attempt: 8s, 12s, 20s, 30s, 45s
    const timeout = Math.min(8000 + (attempt - 1) * 8000, 45000);

    console.log(`🔄 Attempt ${attempt}/${maxRetries} (timeout: ${Math.round(timeout / 1000)}s)...`);

    const isOnline = await checkServerHealth(timeout);

    if (isOnline) {
      console.log('✅ Server is online and ready!');
      return true;
    }

    // Wait before retrying (except on last attempt)
    if (attempt < maxRetries) {
      const delay = initialDelay * attempt; // 2s, 4s, 6s, 8s, 10s
      console.log(`⏱️ Waiting ${Math.round(delay / 1000)}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('❌ Server failed to come online after maximum retries');
  return false;
};

/**
 * Make API request with automatic retry and progressive timeouts
 * @param {Function} requestFn - The API request function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} - The API response
 */
export const apiRequestWithRetry = async (requestFn, maxRetries = 5) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Progressive timeout: 8s, 16s, 24s, 32s, 45s
      const timeout = Math.min(8000 + (attempt - 1) * 8000, 45000);

      // Create a temporary client with progressive timeout
      const tempClient = axios.create({
        baseURL: API_URL,
        timeout: timeout,
        headers: { 'Content-Type': 'application/json' },
      });

      // Add auth token if available
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        tempClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      console.log(`🔄 API request attempt ${attempt}/${maxRetries} (timeout: ${Math.round(timeout / 1000)}s)`);

      // Execute request
      const response = await requestFn(tempClient);

      // Success - reset failure count
      serverStatus.consecutiveFailures = 0;
      return response;

    } catch (error) {
      lastError = error;

      // Check if we should retry
      const shouldRetry =
        error.code === 'ECONNABORTED' ||  // Timeout
        (error.request && !error.response) || // Network error
        error.response?.status === 503; // Service unavailable

      if (!shouldRetry || attempt === maxRetries) {
        // Don't retry or last attempt - throw error
        console.error(`❌ API request failed: ${error.message}`);
        throw error;
      }

      // Wait before retrying
      const delay = 1000 * attempt; // 1s, 2s, 3s, 4s, 5s
      console.log(`⏱️ Waiting ${delay / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

/**
 * Check server with user-friendly error messages
 * @returns {Promise<{isOnline: boolean, message: string}>}
 */
export const checkServerWithMessage = async () => {
  const isOnline = await checkServerHealth();

  if (isOnline) {
    return {
      isOnline: true,
      message: 'Server is online and ready',
    };
  }

  // Provide helpful error messages based on failure count
  let message = 'Unable to connect to server';

  if (serverStatus.consecutiveFailures === 1) {
    message = 'Server might be sleeping. Please wait a moment...';
  } else if (serverStatus.consecutiveFailures > 1 && serverStatus.consecutiveFailures <= 3) {
    message = 'Server is waking up. This may take 30-60 seconds...';
  } else {
    message = 'Server is unavailable. Please check your connection or try again later.';
  }

  return {
    isOnline: false,
    message,
  };
};

/**
 * Wake server sequence - sends multiple pings to wake up sleeping server
 * Should be called at app launch to proactively wake the server
 * @returns {Promise<boolean>} - Returns true if server wakes up successfully
 */
export const wakeServerSequence = async () => {
  console.log('🌅 Starting server wake sequence...');

  // Try to wake the server with progressive timeouts and delays
  for (let ping = 1; ping <= WAKE_SEQUENCE_PINGS; ping++) {
    // Progressive timeout: 8s, 12s, 20s, 30s, 45s, 60s, 90s, 120s
    const timeout = Math.min(8000 + (ping - 1) * 15000, 120000);

    console.log(`📡 Wake ping ${ping}/${WAKE_SEQUENCE_PINGS} (timeout: ${Math.round(timeout / 1000)}s)...`);

    const isOnline = await checkServerHealth(timeout);

    if (isOnline) {
      console.log(`✅ Server woke up on ping ${ping}!`);
      serverStatus.isAwake = true;
      return true;
    }

    // Delay between pings to give server time to start (except after last ping)
    if (ping < WAKE_SEQUENCE_PINGS) {
      const delayMs = Math.min(2000 + (ping * 1000), 8000); // 3s, 4s, 5s, 6s, 7s, 8s...
      console.log(`   Waiting ${Math.round(delayMs / 1000)}s before next ping...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  console.warn('⚠️ Server wake sequence completed, app will continue');
  return false;
};

/**
 * Start keep-alive mechanism - sends periodic pings while app is foregrounded
 * Prevents server from going to sleep during active use
 */
export const startKeepAlive = () => {
  // Don't start if already running
  if (keepAliveIntervalId) {
    console.log('💚 Keep-alive already active');
    return;
  }

  console.log('💚 Starting keep-alive mechanism...');

  // Send immediate ping
  checkServerHealth().catch(() => {
    console.log('⚠️ Keep-alive ping failed, will retry...');
  });

  // Set up periodic pings
  keepAliveIntervalId = setInterval(() => {
    if (isAppForegrounded) {
      checkServerHealth().catch(() => {
        console.log('⚠️ Keep-alive ping failed');
      });
    }
  }, KEEP_ALIVE_INTERVAL);

  console.log(`✅ Keep-alive started (pinging every ${KEEP_ALIVE_INTERVAL / 1000}s)`);
};

/**
 * Stop keep-alive mechanism
 */
export const stopKeepAlive = () => {
  if (keepAliveIntervalId) {
    clearInterval(keepAliveIntervalId);
    keepAliveIntervalId = null;
    console.log('💔 Keep-alive stopped');
  }
};

/**
 * Initialize app state listener for keep-alive
 * Call this once when app starts
 */
export const initializeAppStateListener = () => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      console.log('📱 App foregrounded');
      isAppForegrounded = true;
      startKeepAlive();
    } else if (nextAppState === 'background' || nextAppState === 'inactive') {
      console.log('📱 App backgrounded');
      isAppForegrounded = false;
      stopKeepAlive();
    }
  });

  // Start keep-alive immediately if app is active
  if (AppState.currentState === 'active') {
    isAppForegrounded = true;
    startKeepAlive();
  }

  return subscription;
};

export default apiClient;
export { API_URL };
