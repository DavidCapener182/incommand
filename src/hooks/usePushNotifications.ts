import { useState, useEffect, useCallback } from 'react';
import { pushNotificationManager, NotificationPayload } from '../lib/pushNotifications';

export interface PushNotificationState {
  isSupported: boolean;
  permission: NotificationPermission;
  subscriptionStatus: 'subscribed' | 'unsubscribed' | 'not-supported';
  isSubscribing: boolean;
  error: string | null;
}

export interface PushNotificationActions {
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<void>;
  unsubscribe: () => Promise<void>;
  testNotification: () => Promise<void>;
  sendNotification: (userId: string, payload: NotificationPayload) => Promise<void>;
  clearError: () => void;
}

export function usePushNotifications(): [PushNotificationState, PushNotificationActions] {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: pushNotificationManager.isSupported(),
    permission: pushNotificationManager.getPermissionStatus(),
    subscriptionStatus: pushNotificationManager.getSubscriptionStatus(),
    isSubscribing: false,
    error: null
  });

  // Update subscription status
  const updateSubscriptionStatus = useCallback(async () => {
    const status = pushNotificationManager.getSubscriptionStatus();
    setState(prev => ({
      ...prev,
      subscriptionStatus: status
    }));
  }, []);

  // Update permission status
  const updatePermissionStatus = useCallback(() => {
    const permission = pushNotificationManager.getPermissionStatus();
    setState(prev => ({
      ...prev,
      permission
    }));
  }, []);

  // Setup service worker message listener
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'PUSH_NOTIFICATION_RECEIVED') {
          // Handle push notification received
          console.log('Push notification received:', event.data.payload);
        }
      };

      navigator.serviceWorker.addEventListener('message', handleMessage);

      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  // Initial status check
  useEffect(() => {
    updateSubscriptionStatus();
    updatePermissionStatus();
  }, [updateSubscriptionStatus, updatePermissionStatus]);

  // Actions
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      const permission = await pushNotificationManager.requestPermission();
      updatePermissionStatus();
      return permission;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updatePermissionStatus]);

  const subscribe = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ 
        ...prev, 
        isSubscribing: true, 
        error: null 
      }));

      await pushNotificationManager.subscribe();
      await updateSubscriptionStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setState(prev => ({ 
        ...prev, 
        error: errorMessage 
      }));
      throw error;
    } finally {
      setState(prev => ({ ...prev, isSubscribing: false }));
    }
  }, [updateSubscriptionStatus]);

  const unsubscribe = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await pushNotificationManager.unsubscribe();
      await updateSubscriptionStatus();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, [updateSubscriptionStatus]);

  const testNotification = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await pushNotificationManager.testNotification();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send test notification';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const sendNotification = useCallback(async (userId: string, payload: NotificationPayload): Promise<void> => {
    try {
      setState(prev => ({ ...prev, error: null }));
      await pushNotificationManager.sendNotification(userId, payload);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send notification';
      setState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const actions: PushNotificationActions = {
    requestPermission,
    subscribe,
    unsubscribe,
    testNotification,
    sendNotification,
    clearError
  };

  return [state, actions];
}
