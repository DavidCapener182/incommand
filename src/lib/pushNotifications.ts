import { supabase } from './supabase';

// VAPID configuration - must be set via environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

// Debug logging
console.log('VAPID_PUBLIC_KEY:', VAPID_PUBLIC_KEY ? 'SET' : 'NOT SET');

// Validate VAPID public key on module load (client-side)
if (!VAPID_PUBLIC_KEY) {
  throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is required for push notifications');
}

// Additional validation for key format
if (VAPID_PUBLIC_KEY.length < 40) {
  throw new Error('VAPID_PUBLIC_KEY appears to be invalid (too short)');
}

export interface PushSubscriptionData {
  id?: number;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  device_type?: string;
  browser?: string;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  renotify?: boolean;
  silent?: boolean;
  vibrate?: number[];
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: globalThis.PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push notifications not supported');
        return false;
      }

      // Register service worker if not already registered
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Check if already subscribed
      this.subscription = await this.registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    const permission = await Notification.requestPermission();
    console.log('Notification permission:', permission);
    return permission;
  }

  // Subscribe to push notifications
  async subscribe(): Promise<globalThis.PushSubscription | null> {
    try {
      if (!this.registration) {
        await this.initialize();
      }

      if (!this.registration) {
        throw new Error('Service worker not registered');
      }

      // Check permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Notification permission denied');
      }

      // Convert VAPID key
      const vapidPublicKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY!);

      // Subscribe to push manager
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      this.subscription = subscription;

      // Save subscription to database
      await this.saveSubscriptionToDatabase(subscription);

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.subscription) {
        return true;
      }

      // Unsubscribe from push manager
      await this.subscription.unsubscribe();

      // Remove from database
      await this.removeSubscriptionFromDatabase(this.subscription);

      this.subscription = null;
      console.log('Push subscription removed');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      return false;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<globalThis.PushSubscription | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      return null;
    }

    return await this.registration.pushManager.getSubscription();
  }

  // Check if subscribed
  async isSubscribed(): Promise<boolean> {
    const subscription = await this.getSubscription();
    return subscription !== null;
  }

  // Save subscription to database
  private async saveSubscriptionToDatabase(subscription: globalThis.PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const subscriptionData: PushSubscriptionData = {
        user_id: user.id,
        endpoint: subscription.endpoint,
        p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo()
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { onConflict: 'endpoint' });

      if (error) {
        throw error;
      }

      console.log('Subscription saved to database');
    } catch (error) {
      console.error('Failed to save subscription to database:', error);
      throw error;
    }
  }

  // Remove subscription from database
  private async removeSubscriptionFromDatabase(subscription: globalThis.PushSubscription): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('endpoint', subscription.endpoint);

      if (error) {
        throw error;
      }

      console.log('Subscription removed from database');
    } catch (error) {
      console.error('Failed to remove subscription from database:', error);
      throw error;
    }
  }

  // Send test notification
  async sendTestNotification(): Promise<boolean> {
    try {
      const subscription = await this.getSubscription();
      if (!subscription) {
        throw new Error('No active subscription');
      }

      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          payload: {
            title: 'Test Notification',
            body: 'This is a test notification from InCommand',
            icon: '/icon.png',
            tag: 'test',
            data: {
              url: '/dashboard',
              type: 'test'
            }
          }
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log('Test notification sent');
      return true;
    } catch (error) {
      console.error('Failed to send test notification:', error);
      return false;
    }
  }

  // Utility functions
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    if (typeof window === 'undefined') {
      throw new Error('window is not available');
    }
    
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    if (typeof window === 'undefined') {
      throw new Error('window is not available');
    }
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Android/i.test(userAgent)) return 'android';
    if (/iPhone|iPad|iPod/i.test(userAgent)) return 'ios';
    if (/Windows/i.test(userAgent)) return 'windows';
    if (/Mac/i.test(userAgent)) return 'mac';
    if (/Linux/i.test(userAgent)) return 'linux';
    return 'unknown';
  }

  private getBrowserInfo(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'chrome';
    if (userAgent.includes('Firefox')) return 'firefox';
    if (userAgent.includes('Safari')) return 'safari';
    if (userAgent.includes('Edge')) return 'edge';
    return 'unknown';
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    supported: boolean;
    permission: NotificationPermission;
    subscribed: boolean;
    subscription: globalThis.PushSubscription | null;
  }> {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window;
    const permission = supported ? Notification.permission : 'denied';
    const subscribed = await this.isSubscribed();
    const subscription = await this.getSubscription();

    return {
      supported,
      permission,
      subscribed,
      subscription
    };
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();

// Export utility functions
export const requestNotificationPermission = () => pushNotificationManager.requestPermission();
export const subscribeToPushNotifications = () => pushNotificationManager.subscribe();
export const unsubscribeFromPushNotifications = () => pushNotificationManager.unsubscribe();
export const getSubscriptionStatus = () => pushNotificationManager.getSubscriptionStatus();
export const sendTestNotification = () => pushNotificationManager.sendTestNotification();
