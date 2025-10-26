import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const API_URL = 'https://pettapp.onrender.com';

// Progressive timeout configuration
const TIMEOUT_CONFIG = {
  initial: 5000,        // 5s for first attempt
  progressive: [10000, 15000, 20000, 30000, 45000, 60000], // Progressive timeouts
  max: 60000,          // Max 60s timeout
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
const KEEP_ALIVE_INTERVAL = 25000; // Ping every 25 seconds (more aggressive)
const WAKE_SEQUENCE_PINGS = 6;     // Number of pings during wake sequence
let keepAliveIntervalId = null;
let isAppForegrounded = true;

// Health check interval (ping every 30 seconds)
const HEALTH_CHECK_INTERVAL = 30000;
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
 * Check if the server is online with progressive timeout
 * @param {number} timeoutMs - Optional timeout override in milliseconds
 * @returns {Promise<boolean>} - Returns true if server is reachable
 */
export const checkServerHealth = async (timeoutMs = 5000) => {
  // Prevent multiple simultaneous checks
  if (serverStatus.isChecking) {
    console.log('⏳ Health check already in progress...');
    return serverStatus.isOnline;
  }

  serverStatus.isChecking = true;

  try {
    console.log('🏥 Checking server health...');

    // Use a lightweight endpoint with progressive timeout
    const response = await axios.get(`${API_URL}/health`, {
      timeout: timeoutMs,
      headers: { 'Content-Type': 'application/json' }
    });

    const isHealthy = response.status === 200;

    serverStatus.isOnline = isHealthy;
    serverStatus.isAwake = true;
    serverStatus.lastChecked = new Date();
    serverStatus.consecutiveFailures = 0;

    console.log('✅ Server is online and healthy');
    return true;
  } catch (error) {
    serverStatus.consecutiveFailures++;
    serverStatus.isOnline = false;
    serverStatus.lastChecked = new Date();

    console.error(`❌ Server health check failed (${serverStatus.consecutiveFailures} consecutive failures)`);

    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Server response timeout');
    } else if (error.request) {
      console.error('🌐 No response from server - may be offline or slow');
    } else {
      console.error('❓ Error:', error.message);
    }

    return false;
  } finally {
    serverStatus.isChecking = false;
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
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<boolean>} - Returns true if server becomes online
 */
export const waitForServer = async (maxRetries = 7, retryDelay = 3000) => {
  console.log(`⏳ Waiting for server to be online (max ${maxRetries} attempts)...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Get progressive timeout for this attempt
    const timeout = getProgressiveTimeout(attempt);
    console.log(`🔄 Attempt ${attempt}/${maxRetries} (timeout: ${timeout / 1000}s)...`);

    const isOnline = await checkServerHealth(timeout);

    if (isOnline) {
      console.log('✅ Server is online and ready!');
      return true;
    }

    if (attempt < maxRetries) {
      // Progressive delay: start small, increase gradually
      const delay = Math.min(retryDelay * attempt, 8000);
      console.log(`⏱️ Waiting ${delay / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('❌ Server failed to come online after maximum retries');
  return false;
};

/**
 * Make API request with automatic retry and progressive timeouts for cold start scenarios
 * @param {Function} requestFn - The API request function to execute
 * @param {number} maxRetries - Maximum retry attempts
 * @returns {Promise} - The API response
 */
export const apiRequestWithRetry = async (requestFn, maxRetries = 6) => {
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get progressive timeout for this attempt
      const timeout = getProgressiveTimeout(attempt);

      // Create a temporary client with progressive timeout for this attempt
      const tempClient = axios.create({
        baseURL: API_URL,
        timeout: timeout,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Copy auth token from original request
      const token = await AsyncStorage.getItem('accessToken');
      if (token) {
        tempClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }

      console.log(`🔄 API request attempt ${attempt}/${maxRetries} (timeout: ${timeout / 1000}s)`);

      // Execute request with progressive timeout
      const response = await requestFn(tempClient);

      // Mark server as awake on success
      serverStatus.isAwake = true;
      serverStatus.isOnline = true;
      serverStatus.consecutiveFailures = 0;

      return response;
    } catch (error) {
      lastError = error;

      // Only retry on timeout or network errors
      const shouldRetry =
        error.code === 'ECONNABORTED' ||
        (error.request && !error.response) ||
        error.response?.status === 503;

      if (!shouldRetry || attempt === maxRetries) {
        throw error;
      }

      // Progressive delay between retries
      const delay = Math.min(2000 * attempt, 8000);
      console.log(`⏱️ Request failed, waiting ${delay}ms before retry...`);
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

  // Check if server is already awake
  if (serverStatus.isAwake && serverStatus.isOnline) {
    console.log('✅ Server is already awake');
    return true;
  }

  // Send multiple rapid pings with progressive timeouts
  for (let ping = 1; ping <= WAKE_SEQUENCE_PINGS; ping++) {
    const timeout = getProgressiveTimeout(ping);
    console.log(`📡 Wake ping ${ping}/${WAKE_SEQUENCE_PINGS} (timeout: ${timeout / 1000}s)`);

    try {
      const isOnline = await checkServerHealth(timeout);

      if (isOnline) {
        console.log(`✅ Server woke up on ping ${ping}!`);
        serverStatus.isAwake = true;
        return true;
      }
    } catch (error) {
      console.log(`⏱️ Wake ping ${ping} timed out, continuing...`);
    }

    // Short delay between pings (except after last ping)
    if (ping < WAKE_SEQUENCE_PINGS) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  console.warn('⚠️ Server wake sequence completed but server may still be starting');
  return serverStatus.isOnline === true;
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
