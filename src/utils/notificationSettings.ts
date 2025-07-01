export interface NotificationSettings {
  // Notification Types
  incidentAlerts: boolean;
  systemUpdates: boolean;
  eventReminders: boolean;
  aiInsights: boolean;
  securityAlerts: boolean;
  maintenanceNotifications: boolean;
  
  // Delivery Methods
  inApp: boolean;
  email: boolean;
  sms: boolean;
  push: boolean;
  
  // Timing Preferences
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  
  // Frequency Settings
  digestFrequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
  priorityOnly: boolean;
  
  // Advanced Settings
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  desktopNotifications: boolean;
}

export const defaultNotificationSettings: NotificationSettings = {
  incidentAlerts: true,
  systemUpdates: true,
  eventReminders: true,
  aiInsights: false,
  securityAlerts: true,
  maintenanceNotifications: true,
  
  inApp: true,
  email: true,
  sms: false,
  push: true,
  
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '07:00'
  },
  
  digestFrequency: 'immediate',
  priorityOnly: false,
  
  soundEnabled: true,
  vibrationEnabled: true,
  desktopNotifications: true
};

/**
 * Load notification settings from localStorage
 */
export function loadNotificationSettings(): NotificationSettings {
  if (typeof window === 'undefined') {
    return defaultNotificationSettings;
  }

  try {
    const stored = localStorage.getItem('notificationSettings');
    if (stored) {
      const parsedSettings = JSON.parse(stored);
      return { ...defaultNotificationSettings, ...parsedSettings };
    }
  } catch (error) {
    console.error('Error loading notification settings:', error);
  }

  return defaultNotificationSettings;
}

/**
 * Save notification settings to localStorage
 */
export function saveNotificationSettings(settings: NotificationSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem('notificationSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving notification settings:', error);
  }
}

/**
 * Check if a notification should be shown based on current settings
 */
export function shouldShowNotification(
  notificationType: keyof Pick<NotificationSettings, 'incidentAlerts' | 'systemUpdates' | 'eventReminders' | 'aiInsights' | 'securityAlerts' | 'maintenanceNotifications'>,
  priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium',
  settings?: NotificationSettings
): boolean {
  const currentSettings = settings || loadNotificationSettings();

  // Always show urgent security alerts regardless of settings
  if (notificationType === 'securityAlerts' && priority === 'urgent') {
    return true;
  }

  // Check if this notification type is enabled
  if (!currentSettings[notificationType]) {
    return false;
  }

  // Check priority filter
  if (currentSettings.priorityOnly && priority !== 'high' && priority !== 'urgent') {
    return false;
  }

  // Check quiet hours
  if (currentSettings.quietHours.enabled && priority !== 'urgent') {
    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = currentSettings.quietHours.startTime.split(':').map(Number);
    const [endHour, endMin] = currentSettings.quietHours.endTime.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;
    
    // Handle overnight quiet hours (e.g., 22:00 to 07:00)
    if (startTime > endTime) {
      if (currentTime >= startTime || currentTime <= endTime) {
        return false;
      }
    } else {
      if (currentTime >= startTime && currentTime <= endTime) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Check if a delivery method is enabled
 */
export function isDeliveryMethodEnabled(
  method: keyof Pick<NotificationSettings, 'inApp' | 'email' | 'sms' | 'push'>,
  settings?: NotificationSettings
): boolean {
  const currentSettings = settings || loadNotificationSettings();
  return currentSettings[method];
}

/**
 * Get the digest frequency setting
 */
export function getDigestFrequency(settings?: NotificationSettings): NotificationSettings['digestFrequency'] {
  const currentSettings = settings || loadNotificationSettings();
  return currentSettings.digestFrequency;
}

/**
 * Check if sound should be played for notifications
 */
export function shouldPlaySound(settings?: NotificationSettings): boolean {
  const currentSettings = settings || loadNotificationSettings();
  return currentSettings.soundEnabled;
}

/**
 * Check if vibration should be used for notifications
 */
export function shouldVibrate(settings?: NotificationSettings): boolean {
  const currentSettings = settings || loadNotificationSettings();
  return currentSettings.vibrationEnabled;
}

/**
 * Check if desktop notifications are enabled
 */
export function areDesktopNotificationsEnabled(settings?: NotificationSettings): boolean {
  const currentSettings = settings || loadNotificationSettings();
  return currentSettings.desktopNotifications;
}