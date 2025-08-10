'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { pushNotificationManager, PushSubscriptionData, NotificationPayload } from '../lib/pushNotifications';
import { supabase } from '../lib/supabase';

// Types
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

// State interfaces
interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: globalThis.PushSubscription | null;
}

interface NotificationPreferencesState {
  preferences: NotificationPreferences;
}

interface NotificationItemsState {
  notifications: NotificationItem[];
  offlineNotifications: NotificationItem[];
}

interface DrawerState {
  isOpen: boolean;
}

// Combined state
interface NotificationDrawerState {
  drawer: DrawerState;
  push: PushNotificationState;
  preferences: NotificationPreferencesState;
  items: NotificationItemsState;
}

// Action types
type DrawerAction = 
  | { type: 'SET_DRAWER_OPEN'; payload: boolean };

type PushAction = 
  | { type: 'SET_PUSH_SUPPORTED'; payload: boolean }
  | { type: 'SET_PUSH_PERMISSION'; payload: NotificationPermission }
  | { type: 'SET_PUSH_SUBSCRIBED'; payload: boolean }
  | { type: 'SET_PUSH_SUBSCRIPTION'; payload: globalThis.PushSubscription | null }
  | { type: 'INITIALIZE_PUSH'; payload: { supported: boolean; permission: NotificationPermission; subscribed: boolean; subscription: globalThis.PushSubscription | null } };

type PreferencesAction = 
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<NotificationPreferences> }
  | { type: 'LOAD_PREFERENCES'; payload: NotificationPreferences };

type ItemsAction = 
  | { type: 'ADD_NOTIFICATION'; payload: NotificationItem }
  | { type: 'MARK_NOTIFICATION_READ'; payload: string }
  | { type: 'MARK_ALL_NOTIFICATIONS_READ' }
  | { type: 'CLEAR_OFFLINE_NOTIFICATIONS' }
  | { type: 'ADD_OFFLINE_NOTIFICATION'; payload: NotificationItem };

type NotificationDrawerAction = 
  | { type: 'DRAWER'; payload: DrawerAction }
  | { type: 'PUSH'; payload: PushAction }
  | { type: 'PREFERENCES'; payload: PreferencesAction }
  | { type: 'ITEMS'; payload: ItemsAction };

// Initial state
const initialState: NotificationDrawerState = {
  drawer: {
    isOpen: false
  },
  push: {
    supported: false,
    permission: 'default',
    subscribed: false,
    subscription: null
  },
  preferences: {
    preferences: {
      sound: true,
      vibration: true,
      incidentAlerts: true,
      systemUpdates: true,
      eventReminders: true,
      emergencyAlerts: true
    }
  },
  items: {
    notifications: [],
    offlineNotifications: []
  }
};

// Reducers
const drawerReducer = (state: DrawerState, action: DrawerAction): DrawerState => {
  switch (action.type) {
    case 'SET_DRAWER_OPEN':
      return { ...state, isOpen: action.payload };
    default:
      return state;
  }
};

const pushReducer = (state: PushNotificationState, action: PushAction): PushNotificationState => {
  switch (action.type) {
    case 'SET_PUSH_SUPPORTED':
      return { ...state, supported: action.payload };
    case 'SET_PUSH_PERMISSION':
      return { ...state, permission: action.payload };
    case 'SET_PUSH_SUBSCRIBED':
      return { ...state, subscribed: action.payload };
    case 'SET_PUSH_SUBSCRIPTION':
      return { ...state, subscription: action.payload };
    case 'INITIALIZE_PUSH':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

const preferencesReducer = (state: NotificationPreferencesState, action: PreferencesAction): NotificationPreferencesState => {
  switch (action.type) {
    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: { ...state.preferences, ...action.payload }
      };
    case 'LOAD_PREFERENCES':
      return {
        ...state,
        preferences: action.payload
      };
    default:
      return state;
  }
};

const itemsReducer = (state: NotificationItemsState, action: ItemsAction): NotificationItemsState => {
  switch (action.type) {
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications]
      };
    case 'MARK_NOTIFICATION_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload
            ? { ...notification, read: true }
            : notification
        )
      };
    case 'MARK_ALL_NOTIFICATIONS_READ':
      return {
        ...state,
        notifications: state.notifications.map(notification => ({ ...notification, read: true }))
      };
    case 'CLEAR_OFFLINE_NOTIFICATIONS':
      return {
        ...state,
        offlineNotifications: []
      };
    case 'ADD_OFFLINE_NOTIFICATION':
      return {
        ...state,
        offlineNotifications: [action.payload, ...state.offlineNotifications]
      };
    default:
      return state;
  }
};

// Main reducer
const notificationDrawerReducer = (state: NotificationDrawerState, action: NotificationDrawerAction): NotificationDrawerState => {
  switch (action.type) {
    case 'DRAWER':
      return {
        ...state,
        drawer: drawerReducer(state.drawer, action.payload)
      };
    case 'PUSH':
      return {
        ...state,
        push: pushReducer(state.push, action.payload)
      };
    case 'PREFERENCES':
      return {
        ...state,
        preferences: preferencesReducer(state.preferences, action.payload)
      };
    case 'ITEMS':
      return {
        ...state,
        items: itemsReducer(state.items, action.payload)
      };
    default:
      return state;
  }
};

// Context interface
interface NotificationDrawerContextType {
  // State
  isOpen: boolean;
  pushSupported: boolean;
  pushPermission: NotificationPermission;
  pushSubscribed: boolean;
  pushSubscription: globalThis.PushSubscription | null;
  notificationPreferences: NotificationPreferences;
  notifications: NotificationItem[];
  offlineNotifications: NotificationItem[];
  
  // Actions
  setIsOpen: (open: boolean) => void;
  requestPushPermission: () => Promise<NotificationPermission>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  updateNotificationPreferences: (preferences: Partial<NotificationPreferences>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearOfflineNotifications: () => void;
}

// Context
const NotificationDrawerContext = createContext<NotificationDrawerContextType | undefined>(undefined);

export const useNotificationDrawer = () => {
  const context = useContext(NotificationDrawerContext);
  if (context === undefined) {
    throw new Error('useNotificationDrawer must be used within a NotificationDrawerProvider');
  }
  return context;
};

// Provider
interface NotificationDrawerProviderProps {
  children: ReactNode;
}

export const NotificationDrawerProvider: React.FC<NotificationDrawerProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(notificationDrawerReducer, initialState);

  // Initialize push notifications
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        const supported = await pushNotificationManager.initialize();
        dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_SUPPORTED', payload: supported } });
        
        if (supported) {
          const status = await pushNotificationManager.getSubscriptionStatus();
          dispatch({
            type: 'PUSH',
            payload: {
              type: 'INITIALIZE_PUSH',
              payload: {
                supported: status.supported,
                permission: status.permission,
                subscribed: status.subscribed,
                subscription: status.subscription
              }
            }
          });
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
        dispatch({ type: 'PREFERENCES', payload: { type: 'LOAD_PREFERENCES', payload: preferences } });
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    }
  }, []);

  // Save notification preferences to localStorage
  useEffect(() => {
    localStorage.setItem('notificationPreferences', JSON.stringify(state.preferences.preferences));
  }, [state.preferences.preferences]);

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

        dispatch({ type: 'ITEMS', payload: { type: 'ADD_NOTIFICATION', payload: notification } });
        
        // Show toast notification
        if (state.preferences.preferences.sound) {
          // Play notification sound
          const audio = new Audio('/notification-sound.mp3');
          audio.play().catch(() => {
            // Fallback: use system notification sound
            console.log('Could not play custom notification sound');
          });
        }

        if (state.preferences.preferences.vibration && 'vibrate' in navigator) {
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
  }, [state.preferences.preferences]);

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

        dispatch({ type: 'ITEMS', payload: { type: 'ADD_NOTIFICATION', payload: notification } });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Action creators
  const setIsOpen = (open: boolean) => {
    dispatch({ type: 'DRAWER', payload: { type: 'SET_DRAWER_OPEN', payload: open } });
  };

  const requestPushPermission = async (): Promise<NotificationPermission> => {
    try {
      const permission = await pushNotificationManager.requestPermission();
      dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_PERMISSION', payload: permission } });
      return permission;
    } catch (error) {
      console.error('Failed to request push permission:', error);
      throw error;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    try {
      const subscription = await pushNotificationManager.subscribe();
      if (subscription) {
        dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_SUBSCRIBED', payload: true } });
        dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_SUBSCRIPTION', payload: subscription } });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      const success = await pushNotificationManager.unsubscribe();
      if (success) {
        dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_SUBSCRIBED', payload: false } });
        dispatch({ type: 'PUSH', payload: { type: 'SET_PUSH_SUBSCRIPTION', payload: null } });
      }
      return success;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  };

  const sendTestNotification = async (): Promise<boolean> => {
    try {
      return await pushNotificationManager.sendTestNotification();
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  };

  const updateNotificationPreferences = (preferences: Partial<NotificationPreferences>) => {
    dispatch({ type: 'PREFERENCES', payload: { type: 'UPDATE_PREFERENCES', payload: preferences } });
  };

  const markNotificationAsRead = (id: string) => {
    dispatch({ type: 'ITEMS', payload: { type: 'MARK_NOTIFICATION_READ', payload: id } });
  };

  const markAllNotificationsAsRead = () => {
    dispatch({ type: 'ITEMS', payload: { type: 'MARK_ALL_NOTIFICATIONS_READ' } });
  };

  const clearOfflineNotifications = () => {
    dispatch({ type: 'ITEMS', payload: { type: 'CLEAR_OFFLINE_NOTIFICATIONS' } });
  };

  const value: NotificationDrawerContextType = {
    // State
    isOpen: state.drawer.isOpen,
    pushSupported: state.push.supported,
    pushPermission: state.push.permission,
    pushSubscribed: state.push.subscribed,
    pushSubscription: state.push.subscription,
    notificationPreferences: state.preferences.preferences,
    notifications: state.items.notifications,
    offlineNotifications: state.items.offlineNotifications,
    
    // Actions
    setIsOpen,
    requestPushPermission,
    subscribeToPush,
    unsubscribeFromPush,
    sendTestNotification,
    updateNotificationPreferences,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearOfflineNotifications
  };

  return (
    <NotificationDrawerContext.Provider value={value}>
      {children}
    </NotificationDrawerContext.Provider>
  );
}; 