/**
 * Push Notification Management System
 * 
 * This module provides comprehensive push notification functionality including:
 * - Service worker registration
 * - Permission management
 * - Subscription handling
 * - VAPID key validation
 * - Background sync support
 */

export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface SubscriptionStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: PushSubscription | null;
  error?: string;
}

export interface NotificationPreferences {
  incidentAlerts: boolean;
  highPriorityAlerts: boolean;
  systemUpdates: boolean;
}

class PushNotificationManager {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;
  private vapidPublicKey: string;

  constructor() {
    this.vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
    this.validateVapidKey();
  }

  /**
   * Validate VAPID public key format
   */
  private validateVapidKey(): void {
    if (!this.vapidPublicKey) {
      console.warn('VAPID public key not configured. Push notifications will not work.');
      return;
    }

    // Basic validation - VAPID keys are base64 encoded and typically 87 characters
    if (this.vapidPublicKey.length < 80 || this.vapidPublicKey.length > 90) {
      console.warn('VAPID public key appears to be invalid. Check your configuration.');
    }
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', this.registration);
      return this.registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      throw error;
    }
  }

  /**
   * Get current notification permission
   */
  getPermission(): NotificationPermission {
    return Notification.permission;
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  }

  /**
   * Convert VAPID key to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    if (!this.vapidPublicKey) {
      throw new Error('VAPID public key not configured');
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      throw new Error('Service worker registration failed');
    }

    try {
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      console.log('Push subscription created:', this.subscription);
      return this.subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return false;
    }

    try {
      const result = await this.subscription.unsubscribe();
      this.subscription = null;
      console.log('Push subscription removed:', result);
      return result;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  /**
   * Get current subscription
   */
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      await this.registerServiceWorker();
    }

    if (!this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  /**
   * Save subscription to backend
   */
  async saveSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const response = await fetch('/api/notifications/push-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          deviceType: this.getDeviceType(),
          browser: this.getBrowser(),
          userAgent: navigator.userAgent
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to save subscription: ${response.statusText}`);
      }

      console.log('Subscription saved to backend');
    } catch (error) {
      console.error('Failed to save subscription:', error);
      throw error;
    }
  }

  /**
   * Remove subscription from backend
   */
  async removeSubscription(): Promise<void> {
    if (!this.subscription) {
      return;
    }

    try {
      const response = await fetch('/api/notifications/push-subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: this.subscription.endpoint
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to remove subscription: ${response.statusText}`);
      }

      console.log('Subscription removed from backend');
    } catch (error) {
      console.error('Failed to remove subscription:', error);
      throw error;
    }
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: 'Test Notification',
          body: 'This is a test push notification from InCommand',
          icon: '/icon.png',
          tag: 'test-notification'
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send test notification: ${response.statusText}`);
      }

      console.log('Test notification sent');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      throw error;
    }
  }

  /**
   * Get device type
   */
  private getDeviceType(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile';
    }
    if (/tablet|ipad/i.test(userAgent)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Get browser information
   */
  private getBrowser(): string {
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('chrome')) return 'chrome';
    if (userAgent.includes('firefox')) return 'firefox';
    if (userAgent.includes('safari')) return 'safari';
    if (userAgent.includes('edge')) return 'edge';
    return 'unknown';
  }

  /**
   * Get comprehensive subscription status
   */
  async getSubscriptionStatus(): Promise<SubscriptionStatus> {
    const supported = this.isSupported();
    const permission = this.getPermission();
    let subscribed = false;
    let subscription: PushSubscription | null = null;
    let error: string | undefined;

    try {
      if (supported && permission === 'granted') {
        subscription = await this.getSubscription();
        subscribed = !!subscription;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    return {
      supported,
      permission,
      subscribed,
      subscription,
      error
    };
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(preferences: NotificationPreferences): Promise<void> {
    try {
      const response = await fetch('/api/notifications/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences)
      });

      if (!response.ok) {
        throw new Error(`Failed to update preferences: ${response.statusText}`);
      }

      console.log('Notification preferences updated');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      throw error;
    }
  }

  /**
   * Get notification preferences
   */
  async getPreferences(): Promise<NotificationPreferences> {
    try {
      const response = await fetch('/api/notifications/preferences');
      
      if (!response.ok) {
        throw new Error(`Failed to get preferences: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to get preferences:', error);
      // Return default preferences
      return {
        incidentAlerts: true,
        highPriorityAlerts: true,
        systemUpdates: false
      };
    }
  }
}

// Create singleton instance
export const pushNotificationManager = new PushNotificationManager();

// Export utility functions
export const getSubscriptionStatus = () => pushNotificationManager.getSubscriptionStatus();
export const requestPermission = () => pushNotificationManager.requestPermission();
export const subscribe = () => pushNotificationManager.subscribe();
export const unsubscribe = () => pushNotificationManager.unsubscribe();
export const sendTestNotification = () => pushNotificationManager.sendTestNotification();
export const isSupported = () => pushNotificationManager.isSupported();

export default pushNotificationManager;
