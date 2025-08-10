'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { pushNotificationManager, PushSubscription, NotificationPayload } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';

interface NotificationDrawerContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  // Push notification state
  pushSupported: boolean;
  pushPermission: NotificationPermission;
  pushSubscribed: boolean;
  pushSubscription: PushSubscription | null;
  // Push notification actions
  requestPushPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  // Notification preferences
  notificationPreferences: NotificationPreferences;
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  // Real-time notifications
  notifications: NotificationItem[];
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  // Offline notifications
  offlineNotifications: NotificationItem[];
  clearOfflineNotifications: () => void;
}

interface NotificationPreferences {
  sound: boolean;
  vibration: boolean;
  incidentAlerts: boolean;
  systemUpdates: boolean;
  eventReminders: boolean;
  emergencyAlerts: boolean;
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: 'incident' | 'system' | 'event' | 'emergency';
  timestamp: number;
  read: boolean;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    url?: string;
  }>;
}

const NotificationDrawerContext = createContext<NotificationDrawerContextType | undefined>(undefined);

export const useNotificationDrawer = () => {
  const context = useContext(NotificationDrawerContext);
  if (context === undefined) {
    throw new Error('useNotificationDrawer must be used within a NotificationDrawerProvider');
  }
  return context;
};

interface NotificationDrawerProviderProps {
  children: ReactNode;
}

export const NotificationDrawerProvider: React.FC<NotificationDrawerProviderProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Push notification state
  const [pushSupported, setPushSupported] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
  
  // Notification preferences
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>({
    sound: true,
    vibration: true,
    incidentAlerts: true,
    systemUpdates: true,
    eventReminders: true,
    emergencyAlerts: true
  });
  
  // Real-time notifications
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [offlineNotifications, setOfflineNotifications] = useState<NotificationItem[]>([]);

  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        const supported = await pushNotificationManager.initialize();
        setPushSupported(supported);
        
        if (supported) {
          const status = await pushNotificationManager.getSubscriptionStatus();
          setPushPermission(status.permission);
          setPushSubscribed(status.subscribed);
          setPushSubscription(status.subscription);
        }
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
      }
    };

    initializePushNotifications();
  }, []);

  // Load notification preferences from localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem('notificationPreferences');
    if (savedPreferences) {
      try {
        const preferences = JSON.parse(savedPreferences);
        setNotificationPreferences(preferences);
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }, []);

  // Save notification preferences to localStorage
  useEffect(() => {
    localStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
  }, [notificationPreferences]);

  // Setup service worker message handling
  useEffect(() => {
    const handleServiceWorkerMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'PUSH_NOTIFICATION') {
        const notification: NotificationItem = {
          id: Date.now().toString(),
          title: event.data.title,
          body: event.data.body,
          type: event.data.type || 'system',
          timestamp: Date.now(),
          read: false,
          data: event.data.data,
          actions: event.data.actions
        };

        setNotifications(prev => [notification, ...prev]);
        
        // Show toast notification
        if (notificationPreferences.sound) {
          // Play notification sound
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(() => {
            // Fallback: use system notification sound
            console.log('Could not play custom notification sound');
          });
        }

        if (notificationPreferences.vibration && 'vibrate' in navigator) {
          navigator.vibrate(200);
        }
      }

      if (event.data && event.data.type === 'SYNC_COMPLETE') {
        // Handle offline sync completion
        console.log(`Offline sync completed: ${event.data.count} operations`);
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleServiceWorkerMessage);
      }
    };
  }, [notificationPreferences]);

  // Setup real-time notifications from Supabase
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications'
      }, (payload) => {
        const notification: NotificationItem = {
          id: payload.new.id,
          title: payload.new.title,
          body: payload.new.body,
          type: payload.new.type || 'system',
          timestamp: new Date(payload.new.created_at).getTime(),
          read: false,
          data: payload.new.data
        };

        setNotifications(prev => [notification, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Request push notification permission
  const requestPushPermission = async (): Promise<NotificationPermission> => {
    try {
      const permission = await pushNotificationManager.requestPermission();
      setPushPermission(permission);
      return permission;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      throw error;
    }
  };

  // Subscribe to push notifications
  const subscribeToPush = async (): Promise<boolean> => {
    try {
      const subscription = await pushNotificationManager.subscribe();
      if (subscription) {
        setPushSubscribed(true);
        setPushSubscription(subscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  };

  // Unsubscribe from push notifications
  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      const success = await pushNotificationManager.unsubscribe();
      if (success) {
        setPushSubscribed(false);
        setPushSubscription(null);
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  };

  // Send test notification
  const sendTestNotification = async (): Promise<boolean> => {
    try {
      return await pushNotificationManager.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  };

  // Update notification preferences
  const updateNotificationPreferences = (preferences: Partial<NotificationPreferences>) => {
    setNotificationPreferences(prev => ({ ...prev, ...preferences }));
  };

  // Mark notification as read
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  // Mark all notifications as read
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  // Clear offline notifications
  const clearOfflineNotifications = () => {
    setOfflineNotifications([]);
  };

  const value: NotificationDrawerContextType = {
    isOpen,
    setIsOpen,
    pushSupported,
    pushPermission,
    pushSubscribed,
    pushSubscription,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    notificationPreferences,
    updateNotificationPreferences,
    notifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    offlineNotifications,
    clearOfflineNotifications
  };

  return (
    <NotificationDrawerContext.Provider value={value}>
      {children}
    </NotificationDrawerContext.Provider>
  );
}; 