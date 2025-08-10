import { useState, useEffect, useCallback } from 'react';
import { pushNotificationManager, PushSubscription } from '../lib/pushNotifications';

export interface UsePushNotificationsReturn {
  // State
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: PushSubscription | null;
  loading: boolean;
  error: string | null;
  
  // Actions
  requestPermission: () => Promise<NotificationPermission>;
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  sendTestNotification: () => Promise<boolean>;
  
  // Utilities
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscribed, setSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize push notifications
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        setError(null);

        const status = await pushNotificationManager.getSubscriptionStatus();
        
        setSupported(status.supported);
        setPermission(status.permission);
        setSubscribed(status.subscribed);
        setSubscription(status.subscription);
      } catch (err) {
        console.error('Failed to initialize push notifications:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize push notifications');
      } finally {
        setLoading(false);
      }
    };

    initialize();
  }, []);

  // Request permission
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      setLoading(true);
      setError(null);

      const newPermission = await pushNotificationManager.requestPermission();
      setPermission(newPermission);

      return newPermission;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to request permission';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const newSubscription = await pushNotificationManager.subscribe();
      
      if (newSubscription) {
        setSubscribed(true);
        setSubscription(newSubscription);
        return true;
      }
      
      return false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to push notifications';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await pushNotificationManager.unsubscribe();
      
      if (success) {
        setSubscribed(false);
        setSubscription(null);
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from push notifications';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send test notification
  const sendTestNotification = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);

      const success = await pushNotificationManager.sendTestNotification();
      
      if (!success) {
        setError('Failed to send test notification');
      }
      
      return success;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send test notification';
      setError(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const status = await pushNotificationManager.getSubscriptionStatus();
      
      setSupported(status.supported);
      setPermission(status.permission);
      setSubscribed(status.subscribed);
      setSubscription(status.subscription);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh status';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    supported,
    permission,
    subscribed,
    subscription,
    loading,
    error,
    
    // Actions
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    
    // Utilities
    refreshStatus,
    clearError
  };
};
