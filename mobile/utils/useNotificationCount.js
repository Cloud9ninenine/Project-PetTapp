// Custom hook for fetching and managing notification count
import { useState, useEffect } from 'react';
import apiClient from '@config/api';
import notificationEvents, { NOTIFICATION_EVENTS } from './notificationEvents';

export const useNotificationCount = (enabled = true) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notification count from API
  const fetchUnreadCount = async () => {
    if (!enabled) return;

    try {
      const response = await apiClient.get('/notifications/unread-count');
      if (response.data && response.data.success) {
        const count = response.data.data?.count || 0;
        setUnreadCount(count);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
      setUnreadCount(0);
    }
  };

  // Initial fetch and periodic refresh
  useEffect(() => {
    if (!enabled) return;

    fetchUnreadCount();

    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30 * 1000);

    return () => clearInterval(interval);
  }, [enabled]);

  // Listen for notification events
  useEffect(() => {
    if (!enabled) return;

    const handleNotificationEvent = () => {
      fetchUnreadCount();
    };

    // Subscribe to all notification events
    notificationEvents.on(NOTIFICATION_EVENTS.NOTIFICATION_READ, handleNotificationEvent);
    notificationEvents.on(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, handleNotificationEvent);
    notificationEvents.on(NOTIFICATION_EVENTS.ALL_READ, handleNotificationEvent);
    notificationEvents.on(NOTIFICATION_EVENTS.REFRESH_COUNT, handleNotificationEvent);

    // Cleanup
    return () => {
      notificationEvents.off(NOTIFICATION_EVENTS.NOTIFICATION_READ, handleNotificationEvent);
      notificationEvents.off(NOTIFICATION_EVENTS.NOTIFICATION_DELETED, handleNotificationEvent);
      notificationEvents.off(NOTIFICATION_EVENTS.ALL_READ, handleNotificationEvent);
      notificationEvents.off(NOTIFICATION_EVENTS.REFRESH_COUNT, handleNotificationEvent);
    };
  }, [enabled]);

  return { unreadCount, refreshCount: fetchUnreadCount };
};

export default useNotificationCount;
