import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'https://pettapp.onrender.com';

// Server health status tracker
let serverStatus = {
  isOnline: null,
  lastChecked: null,
  consecutiveFailures: 0,
  isChecking: false,
};

// Health check interval (ping every 30 seconds)
const HEALTH_CHECK_INTERVAL = 30000;
let healthCheckIntervalId = null;

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    // Log the request for debugging
    console.log('=== API REQUEST ===');
    console.log('Method:', config.method);
    console.log('URL:', config.baseURL + config.url);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.log('==================');

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('Network Error:', error.message);
    } else {
      // Something else happened
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

/**
 * Check if the server is online
 * @returns {Promise<boolean>} - Returns true if server is reachable
 */
export const checkServerHealth = async () => {
  // Prevent multiple simultaneous checks
  if (serverStatus.isChecking) {
    console.log('⏳ Health check already in progress...');
    return serverStatus.isOnline;
  }

  serverStatus.isChecking = true;

  try {
    console.log('🏥 Checking server health...');

    // Use a lightweight endpoint with shorter timeout for health check
    const response = await axios.get(`${API_URL}/health`, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' }
    });

    const isHealthy = response.status === 200;

    serverStatus.isOnline = isHealthy;
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
  };
};

/**
 * Wait for server to be online before proceeding
 * Useful before login or critical operations
 * @param {number} maxRetries - Maximum number of retry attempts
 * @param {number} retryDelay - Delay between retries in ms
 * @returns {Promise<boolean>} - Returns true if server becomes online
 */
export const waitForServer = async (maxRetries = 5, retryDelay = 3000) => {
  console.log(`⏳ Waiting for server to be online (max ${maxRetries} attempts)...`);

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Attempt ${attempt}/${maxRetries}...`);

    const isOnline = await checkServerHealth();

    if (isOnline) {
      console.log('✅ Server is online and ready!');
      return true;
    }

    if (attempt < maxRetries) {
      console.log(`⏱️ Waiting ${retryDelay / 1000}s before retry...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }

  console.error('❌ Server failed to come online after maximum retries');
  return false;
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

export default apiClient;
export { API_URL };
