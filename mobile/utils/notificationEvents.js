// Notification event emitter for real-time badge updates
import EventEmitter from 'eventemitter3';

const notificationEvents = new EventEmitter();

// Event types
export const NOTIFICATION_EVENTS = {
  NOTIFICATION_READ: 'notification_read',
  NOTIFICATION_DELETED: 'notification_deleted',
  ALL_READ: 'all_read',
  REFRESH_COUNT: 'refresh_count',
};

export default notificationEvents;
