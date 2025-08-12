import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'admin' | 'manager' | 'analyst' | 'viewer';
export type WidgetType = 'incidents' | 'attendance' | 'performance' | 'predictions' | 'staff' | 'weather' | 'social' | 'ai-insights';

export interface DashboardPreferences {
  visibleWidgets: WidgetType[];
  layout: 'compact' | 'expanded';
  theme: 'light' | 'dark' | 'auto';
  sidebarCollapsed: boolean;
}

export interface WidgetConfig {
  type: WidgetType;
  label: string;
  description: string;
  required: boolean;
  roles: UserRole[];
  defaultVisible: boolean;
}

export const useDashboardCustomization = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard-preferences');
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch (error) {
          console.error('Failed to parse stored preferences:', error);
        }
      }
    }
    
    return {
      visibleWidgets: ['incidents', 'attendance', 'performance'],
      layout: 'expanded',
      theme: 'light',
      sidebarCollapsed: false
    };
  });

  // Safety check for user
  const safeUser = user || null;

  // Widget configurations
  const widgetConfigs: WidgetConfig[] = useMemo(() => [
    {
      type: 'incidents',
      label: 'Incident Analytics',
      description: 'Real-time incident tracking and analysis',
      required: true,
      roles: ['admin', 'manager', 'analyst', 'viewer'],
      defaultVisible: true
    },
    {
      type: 'attendance',
      label: 'Attendance Tracking',
      description: 'Crowd density and attendance metrics',
      required: true,
      roles: ['admin', 'manager', 'analyst', 'viewer'],
      defaultVisible: true
    },
    {
      type: 'performance',
      label: 'Performance Metrics',
      description: 'Staff performance and response times',
      required: false,
      roles: ['admin', 'manager', 'analyst'],
      defaultVisible: true
    },
    {
      type: 'predictions',
      label: 'Predictive Analytics',
      description: 'AI-powered predictions and forecasting',
      required: false,
      roles: ['admin', 'manager', 'analyst'],
      defaultVisible: true
    },
    {
      type: 'staff',
      label: 'Staff Management',
      description: 'Staff deployment and efficiency tracking',
      required: false,
      roles: ['admin', 'manager'],
      defaultVisible: true
    },
    {
      type: 'weather',
      label: 'Weather Monitoring',
      description: 'Weather conditions and risk assessment',
      required: false,
      roles: ['admin', 'manager', 'analyst'],
      defaultVisible: true
    },
    {
      type: 'social',
      label: 'Social Media Monitoring',
      description: 'Social media sentiment and mentions',
      required: false,
      roles: ['admin', 'manager'],
      defaultVisible: false
    },
    {
      type: 'ai-insights',
      label: 'AI Insights',
      description: 'AI-generated insights and recommendations',
      required: false,
      roles: ['admin', 'manager', 'analyst'],
      defaultVisible: true
    }
  ], []);

  // Determine user role
  const role = useMemo((): UserRole => {
    if (!safeUser) return 'viewer';
    
    // Check user metadata for role
    const userRole = safeUser.user_metadata?.role || safeUser.app_metadata?.role;
    if (userRole && ['admin', 'manager', 'analyst', 'viewer'].includes(userRole)) {
      return userRole as UserRole;
    }
    
    // Fallback to email-based role detection (for demo purposes)
    const email = safeUser.email?.toLowerCase() || '';
    if (email.includes('admin') || email.includes('manager')) return 'manager';
    if (email.includes('analyst')) return 'analyst';
    
    return 'viewer';
  }, [safeUser]);

  // Get available widgets for current role
  const availableWidgets = useMemo(() => {
    return widgetConfigs.filter(widget => widget.roles.includes(role));
  }, [widgetConfigs, role]);

  // Get visible widgets (respecting role permissions)
  const visibleWidgets = useMemo(() => {
    const roleWidgets = availableWidgets.map(w => w.type);
    return preferences.visibleWidgets.filter(widget => roleWidgets.includes(widget));
  }, [preferences.visibleWidgets, availableWidgets]);

  // Check if widget can be toggled
  const canToggleWidget = useCallback((widgetType: WidgetType) => {
    const widget = widgetConfigs.find(w => w.type === widgetType);
    if (!widget) return false;
    
    // Required widgets cannot be hidden
    if (widget.required) return false;
    
    // Check if user has permission for this widget
    return widget.roles.includes(role);
  }, [widgetConfigs, role]);

  // Toggle widget visibility
  const toggleWidget = useCallback((widgetType: WidgetType) => {
    if (!canToggleWidget(widgetType)) return;
    
    setPreferences(prev => {
      const newVisibleWidgets = prev.visibleWidgets.includes(widgetType)
        ? prev.visibleWidgets.filter(w => w !== widgetType)
        : [...prev.visibleWidgets, widgetType];
      
      const newPrefs = { ...prev, visibleWidgets: newVisibleWidgets };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard-preferences', JSON.stringify(newPrefs));
      }
      
      return newPrefs;
    });
  }, [canToggleWidget]);

  // Update preferences
  const updatePreferences = useCallback((newPreferences: Partial<DashboardPreferences>) => {
    setPreferences(prev => {
      const updated = { ...prev, ...newPreferences };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('dashboard-preferences', JSON.stringify(updated));
      }
      
      return updated;
    });
  }, []);

  // Permission checks
  const canExport = useMemo(() => {
    return ['admin', 'manager', 'analyst'].includes(role);
  }, [role]);

  const canViewAll = useMemo(() => {
    return ['admin', 'manager'].includes(role);
  }, [role]);

  const canManageStaff = useMemo(() => {
    return ['admin', 'manager'].includes(role);
  }, [role]);

  const canAccessAdvancedAnalytics = useMemo(() => {
    return ['admin', 'manager', 'analyst'].includes(role);
  }, [role]);

  const canAccessAdminFeatures = useMemo(() => {
    return role === 'admin';
  }, [role]);

  // Reset to defaults
  const resetToDefaults = useCallback(() => {
    const defaultWidgets = widgetConfigs
      .filter(w => w.defaultVisible && w.roles.includes(role))
      .map(w => w.type);
    
    const defaultPreferences: DashboardPreferences = {
      visibleWidgets: defaultWidgets,
      layout: 'expanded',
      theme: 'light',
      sidebarCollapsed: false
    };
    
    setPreferences(defaultPreferences);
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard-preferences', JSON.stringify(defaultPreferences));
    }
  }, [widgetConfigs, role]);

  // Get widget configuration
  const getWidgetConfig = useCallback((widgetType: WidgetType) => {
    return widgetConfigs.find(w => w.type === widgetType);
  }, [widgetConfigs]);

  // Check if widget is visible
  const isWidgetVisible = useCallback((widgetType: WidgetType) => {
    return visibleWidgets.includes(widgetType);
  }, [visibleWidgets]);

  // Get export permissions by format
  const getExportPermissions = useCallback(() => {
    const permissions = {
      pdf: canExport,
      csv: canExport,
      excel: ['admin', 'manager'].includes(role),
      json: ['admin', 'analyst'].includes(role)
    };
    
    return permissions;
  }, [canExport, role]);

  // Get data access level
  const getDataAccessLevel = useCallback(() => {
    if (role === 'admin') return 'all';
    if (role === 'manager') return 'all';
    if (role === 'analyst') return 'assigned';
    return 'own';
  }, [role]);

  return {
    // State
    role,
    preferences,
    visibleWidgets,
    availableWidgets,
    
    // Actions
    toggleWidget,
    updatePreferences,
    resetToDefaults,
    
    // Checks
    canToggleWidget,
    isWidgetVisible,
    canExport,
    canViewAll,
    canManageStaff,
    canAccessAdvancedAnalytics,
    canAccessAdminFeatures,
    
    // Utilities
    getWidgetConfig,
    getExportPermissions,
    getDataAccessLevel
  };
};
