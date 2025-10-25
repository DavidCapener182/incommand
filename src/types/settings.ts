// Settings Management System Types
// Comprehensive TypeScript interfaces for the settings management system

export interface SystemSettings {
  id: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  feature_flags: FeatureFlags;
  default_user_role: string;
  notification_settings: SystemNotificationSettings;
  platform_config: PlatformConfig;
  created_at: string;
  updated_at: string;
  updated_by?: string;
}

export interface FeatureFlags {
  ai_insights?: boolean;
  predictive_analytics?: boolean;
  social_media_monitoring?: boolean;
  advanced_notifications?: boolean;
  maintenance_mode?: boolean;
  beta_features?: boolean;
  [key: string]: boolean | undefined;
}

export interface SystemNotificationSettings {
  email_enabled: boolean;
  push_enabled: boolean;
  sms_enabled: boolean;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  default_templates: {
    incident_alert?: string;
    system_maintenance?: string;
    daily_report?: string;
  };
}

export interface PlatformConfig {
  max_file_upload_size: number;
  session_timeout: number;
  max_login_attempts: number;
  maintenance_window?: {
    start_time: string;
    end_time: string;
    timezone: string;
  };
  feature_rollout?: {
    [feature: string]: {
      enabled: boolean;
      rollout_percentage: number;
      target_users: string[];
    };
  };
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'auto';
  dashboard_layout: DashboardLayout;
  notification_preferences: UserNotificationPreferences;
  ui_preferences: UIPreferences;
  accessibility_settings: AccessibilitySettings;
  privacy_settings: PrivacySettings;
  created_at: string;
  updated_at: string;
}

export interface DashboardLayout {
  widgets: {
    [widgetId: string]: {
      position: { x: number; y: number };
      size: { width: number; height: number };
      visible: boolean;
      settings?: Record<string, any>;
    };
  };
  layout_version: number;
  last_modified: string;
}

export interface UserNotificationPreferences {
  email: {
    enabled: boolean;
    frequency: 'immediate' | 'hourly' | 'daily' | 'weekly';
    categories: {
      incidents: boolean;
      system_updates: boolean;
      reports: boolean;
      social_media: boolean;
    };
  };
  push: {
    enabled: boolean;
    sound: boolean;
    vibration: boolean;
    categories: {
      incidents: boolean;
      system_updates: boolean;
      reports: boolean;
      social_media: boolean;
    };
  };
  sms: {
    enabled: boolean;
    emergency_only: boolean;
    phone_number?: string;
  };
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
    timezone: string;
  };
}

export interface UIPreferences {
  language: string;
  timezone: string;
  date_format: string;
  time_format: '12h' | '24h';
  compact_mode: boolean;
  animations_enabled: boolean;
  auto_refresh_interval: number;
  sidebar_collapsed: boolean;
  color_scheme: 'default' | 'high_contrast' | 'colorblind_friendly';
}

export interface AccessibilitySettings {
  font_size: 'small' | 'medium' | 'large' | 'extra_large';
  line_spacing: 'tight' | 'normal' | 'loose';
  contrast_ratio: 'normal' | 'high' | 'maximum';
  reduce_motion: boolean;
  screen_reader_optimized: boolean;
  keyboard_navigation: boolean;
  focus_indicators: boolean;
}

export interface PrivacySettings {
  data_sharing: {
    analytics: boolean;
    crash_reports: boolean;
    usage_statistics: boolean;
  };
  visibility: {
    profile_public: boolean;
    activity_visible: boolean;
    location_sharing: boolean;
  };
  data_retention: {
    auto_delete_logs: boolean;
    retention_period_days: number;
  };
}

export interface NotificationTemplate {
  id: string;
  template_name: string;
  subject: string;
  body: string;
  variables: string[];
  category: 'incident' | 'system' | 'user' | 'general';
  is_active: boolean;
  is_admin_managed: boolean;
  version: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ScheduledNotification {
  id: string;
  user_id: string;
  template_id?: string;
  schedule_type?: 'one_time' | 'recurring' | 'conditional';
  cron_expression?: string;
  scheduled_at?: string;
  next_run_at?: string;
  status?: 'pending' | 'sent' | 'failed' | 'cancelled';
  variables?: Record<string, any>;
  retry_count?: number;
  max_retries?: number;
  created_at?: string;
  updated_at?: string;
  // Additional fields that may come from database
  body?: string | null;
  data?: any;
  delivered_at?: string | null;
  error_message?: string | null;
  incident_id?: number | null;
}

export interface SettingsAuditLog {
  id: string;
  user_id?: string;
  table_name: string;
  record_id?: string;
  operation: 'INSERT' | 'UPDATE' | 'DELETE';
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Utility types
export type FeatureFlagKey = keyof FeatureFlags;
export type NotificationTemplateCategory = NotificationTemplate['category'];
export type SettingsChangeOperation = SettingsAuditLog['operation'];
export type ThemePreference = UserPreferences['theme'];
export type TimeFormat = UIPreferences['time_format'];

// Constants
export const DEFAULT_THEME: ThemePreference = 'light';
export const DEFAULT_TIME_FORMAT: TimeFormat = '12h';
export const DEFAULT_FONT_SIZE = 'medium';
export const DEFAULT_LINE_SPACING = 'normal';
export const DEFAULT_CONTRAST_RATIO = 'normal';

export const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'auto', label: 'Auto (System)' },
];

export const TIME_FORMAT_OPTIONS: { value: TimeFormat; label: string }[] = [
  { value: '12h', label: '12-hour (AM/PM)' },
  { value: '24h', label: '24-hour' },
];

export const FONT_SIZE_OPTIONS: { value: AccessibilitySettings['font_size']; label: string }[] = [
  { value: 'small', label: 'Small' },
  { value: 'medium', label: 'Medium' },
  { value: 'large', label: 'Large' },
  { value: 'extra_large', label: 'Extra Large' },
];

export const LINE_SPACING_OPTIONS: { value: AccessibilitySettings['line_spacing']; label: string }[] = [
  { value: 'tight', label: 'Tight' },
  { value: 'normal', label: 'Normal' },
  { value: 'loose', label: 'Loose' },
];

export const CONTRAST_RATIO_OPTIONS: { value: AccessibilitySettings['contrast_ratio']; label: string }[] = [
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'maximum', label: 'Maximum' },
];

export const NOTIFICATION_FREQUENCY_OPTIONS: { value: UserNotificationPreferences['email']['frequency']; label: string }[] = [
  { value: 'immediate', label: 'Immediate' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
];

export const TEMPLATE_CATEGORIES: { value: NotificationTemplateCategory; label: string }[] = [
  { value: 'incident', label: 'Incident Alerts' },
  { value: 'system', label: 'System Updates' },
  { value: 'user', label: 'User Notifications' },
  { value: 'general', label: 'General' },
];

export const SCHEDULE_TYPES: { value: ScheduledNotification['schedule_type']; label: string }[] = [
  { value: 'one_time', label: 'One Time' },
  { value: 'recurring', label: 'Recurring' },
  { value: 'conditional', label: 'Conditional' },
];

export const NOTIFICATION_STATUSES: { value: ScheduledNotification['status']; label: string }[] = [
  { value: 'pending', label: 'Pending' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'cancelled', label: 'Cancelled' },
];

// Validation schemas
export const SETTINGS_VALIDATION_SCHEMAS = {
  theme: ['light', 'dark', 'auto'],
  timeFormat: ['12h', '24h'],
  fontSize: ['small', 'medium', 'large', 'extra_large'],
  lineSpacing: ['tight', 'normal', 'loose'],
  contrastRatio: ['normal', 'high', 'maximum'],
  notificationFrequency: ['immediate', 'hourly', 'daily', 'weekly'],
  templateCategory: ['incident', 'system', 'user', 'general'],
  scheduleType: ['one_time', 'recurring', 'conditional'],
  notificationStatus: ['pending', 'sent', 'failed', 'cancelled'],
} as const;

// Default values
export const DEFAULT_USER_PREFERENCES: Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  theme: DEFAULT_THEME,
  dashboard_layout: {
    widgets: {},
    layout_version: 1,
    last_modified: new Date().toISOString(),
  },
  notification_preferences: {
    email: {
      enabled: true,
      frequency: 'immediate',
      categories: {
        incidents: true,
        system_updates: true,
        reports: true,
        social_media: false,
      },
    },
    push: {
      enabled: true,
      sound: true,
      vibration: true,
      categories: {
        incidents: true,
        system_updates: true,
        reports: false,
        social_media: false,
      },
    },
    sms: {
      enabled: false,
      emergency_only: true,
    },
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
      timezone: 'UTC',
    },
  },
  ui_preferences: {
    language: 'en',
    timezone: 'UTC',
    date_format: 'MM/DD/YYYY',
    time_format: DEFAULT_TIME_FORMAT,
    compact_mode: false,
    animations_enabled: true,
    auto_refresh_interval: 30000,
    sidebar_collapsed: false,
    color_scheme: 'default',
  },
  accessibility_settings: {
    font_size: DEFAULT_FONT_SIZE,
    line_spacing: DEFAULT_LINE_SPACING,
    contrast_ratio: DEFAULT_CONTRAST_RATIO,
    reduce_motion: false,
    screen_reader_optimized: false,
    keyboard_navigation: true,
    focus_indicators: true,
  },
  privacy_settings: {
    data_sharing: {
      analytics: true,
      crash_reports: true,
      usage_statistics: false,
    },
    visibility: {
      profile_public: false,
      activity_visible: false,
      location_sharing: false,
    },
    data_retention: {
      auto_delete_logs: false,
      retention_period_days: 90,
    },
  },
};

export const DEFAULT_SYSTEM_SETTINGS: Omit<SystemSettings, 'id' | 'created_at' | 'updated_at'> = {
  maintenance_mode: false,
  maintenance_message: 'System is under maintenance. Please try again later.',
  feature_flags: {
    ai_insights: true,
    predictive_analytics: true,
    social_media_monitoring: true,
    advanced_notifications: false,
  },
  default_user_role: 'user',
  notification_settings: {
    email_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    quiet_hours: {
      enabled: false,
      start: '22:00',
      end: '08:00',
    },
    default_templates: {},
  },
  platform_config: {
    max_file_upload_size: 10485760, // 10MB
    session_timeout: 3600, // 1 hour
    max_login_attempts: 5,
  },
};
