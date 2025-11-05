import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import apiClient from '@config/api';

// Check if running in Expo Go
const isExpoGo = Constants.appOwnership === 'expo';

// Helper to get date range based on period
const getDateRangeForPeriod = (period) => {
  const now = new Date();
  let startDate, endDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'last7Days':
      endDate = new Date(now.setHours(23, 59, 59, 999));
      startDate = new Date(now.setDate(now.getDate() - 6));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'last30Days':
      endDate = new Date(now.setHours(23, 59, 59, 999));
      startDate = new Date(now.setDate(now.getDate() - 29));
      startDate.setHours(0, 0, 0, 0);
      break;
    case 'thisMonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'last3Months':
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      break;
    case 'thisYear':
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
      break;
    case 'allTime':
    default:
      // For all time, don't set dates (backend will handle)
      return { startDate: null, endDate: null };
  }

  return { startDate, endDate };
};

// Generate and download report
export const generateReport = async (period = 'allTime', format = 'pdf', showAlert = null) => {
  try {
    console.log('Generating report:', { period, format });

    // Get date range for the period
    const { startDate, endDate } = getDateRangeForPeriod(period);

    // Build query parameters
    const params = new URLSearchParams();
    if (startDate) {
      params.append('startDate', startDate.toISOString());
    }
    if (endDate) {
      params.append('endDate', endDate.toISOString());
    }

    const queryString = params.toString();
    const url = `/reports/${format}${queryString ? `?${queryString}` : ''}`;

    console.log('Report API URL:', url);

    // Create a file URI for the downloaded file
    const timestamp = Date.now();
    const fileExtension = format === 'pdf' ? 'pdf' : 'csv';
    const fileName = `analytics-report-${timestamp}.${fileExtension}`;
    const fileUri = `${FileSystem.documentDirectory}${fileName}`;

    console.log('Downloading to:', fileUri);

    // Get the access token from AsyncStorage
    const token = await AsyncStorage.getItem('accessToken');
    if (!token) {
      throw new Error('Authentication required. Please log in again.');
    }

    // Download the file directly using FileSystem
    const downloadResult = await FileSystem.downloadAsync(
      `${apiClient.defaults.baseURL}${url}`,
      fileUri,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('Download result:', downloadResult);

    if (downloadResult.status !== 200) {
      throw new Error(`Failed to download report: Status ${downloadResult.status}`);
    }

    // File downloaded successfully
    console.log('✅ File downloaded to:', fileUri);

    // Get file info to confirm it was saved
    const fileInfo = await FileSystem.getInfoAsync(fileUri);
    console.log('File info:', fileInfo);

    if (!fileInfo.exists) {
      throw new Error('File was not saved properly');
    }

    const fileSizeKB = (fileInfo.size / 1024).toFixed(2);

    // Different behavior for Expo Go vs Production
    if (isExpoGo) {
      // In Expo Go: Show share dialog to let user save/open the file
      console.log('Running in Expo Go - using share dialog');

      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(fileUri, {
          mimeType: format === 'pdf' ? 'application/pdf' : 'text/csv',
          dialogTitle: 'Save Report',
          UTI: format === 'pdf' ? 'com.adobe.pdf' : 'public.comma-separated-values-text',
        });
      }

      // Show success message for Expo Go
      if (showAlert) {
        showAlert(
          'Report Ready',
          `${format.toUpperCase()} report (${fileSizeKB} KB) is ready. Select an app to open or save it.`,
          'success'
        );
      }
    } else {
      // In Production: Silent download with simple success message
      console.log('Running in Production - silent download');

      if (showAlert) {
        showAlert(
          'Report Downloaded',
          `${format.toUpperCase()} report (${fileSizeKB} KB) has been downloaded successfully.`,
          'success'
        );
      }
    }

    return { success: true, fileUri, fileName };
  } catch (error) {
    console.error('Error generating report:', error);
    console.error('Error details:', error.response?.data);

    let errorMessage = 'Failed to generate report. Please try again.';

    if (error.response) {
      switch (error.response.status) {
        case 404:
          errorMessage = 'Business not found. Please complete your business profile first.';
          break;
        case 403:
          errorMessage = 'You do not have permission to generate reports.';
          break;
        case 401:
          errorMessage = 'Authentication failed. Please log in again.';
          break;
        default:
          errorMessage = error.response.data?.message || errorMessage;
      }
    } else if (error.request) {
      errorMessage = 'Network error. Please check your connection and try again.';
    }

    throw new Error(errorMessage);
  }
};

// Generate PDF report
export const generatePDFReport = async (period = 'allTime') => {
  return generateReport(period, 'pdf');
};

// Generate CSV report
export const generateCSVReport = async (period = 'allTime') => {
  return generateReport(period, 'csv');
};
