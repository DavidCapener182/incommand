import { supabase } from './supabase';

// VAPID configuration - these should be environment variables
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'your-vapid-public-key';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key';

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

  // Check if push notifications are supported
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported in this browser');
    }

    const permission = await Notification.requestPermission();
    
    if (permission === 'granted') {
      console.log('Notification permission granted');
    } else {
      console.log('Notification permission denied');
    }

    return permission;
  }

  // Get current permission status
  getPermissionStatus(): NotificationPermission {
    return Notification.permission;
  }

  // Register service worker
  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if (!this.isSupported()) {
      throw new Error('Service workers are not supported');
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

  // Subscribe to push notifications
  async subscribe(): Promise<globalThis.PushSubscription | null> {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported');
    }

    if (this.getPermissionStatus() !== 'granted') {
      throw new Error('Notification permission not granted');
    }

    if (!this.registration) {
      await this.registerServiceWorker();
    }

    try {
      // Convert VAPID public key to Uint8Array
      const vapidPublicKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe to push notifications
      const pushSubscription = await this.registration!.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      // Store subscription in Supabase
      await this.storeSubscription(pushSubscription);

      this.subscription = pushSubscription;
      console.log('Push subscription created:', pushSubscription);
      
      return pushSubscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      throw error;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('No active subscription to unsubscribe from');
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      await this.removeSubscription(this.subscription);
      
      this.subscription = null;
      console.log('Successfully unsubscribed from push notifications');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      throw error;
    }
  }

  // Get current subscription
  async getSubscription(): Promise<globalThis.PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      this.subscription = subscription;
      return subscription;
    } catch (error) {
      console.error('Failed to get push subscription:', error);
      return null;
    }
  }

  // Store subscription in Supabase
  private async storeSubscription(pushSubscription: globalThis.PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const subscriptionData: PushSubscriptionData = {
        user_id: user.id,
        endpoint: pushSubscription.endpoint,
        p256dh: this.arrayBufferToBase64(pushSubscription.getKey('p256dh')!),
        auth: this.arrayBufferToBase64(pushSubscription.getKey('auth')!),
        device_type: this.getDeviceType(),
        browser: this.getBrowserInfo()
      };

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert(subscriptionData, { onConflict: 'user_id,endpoint' });

      if (error) {
        throw error;
      }

      console.log('Push subscription stored in database');
    } catch (error) {
      console.error('Failed to store push subscription:', error);
      throw error;
    }
  }

  // Remove subscription from Supabase
  private async removeSubscription(pushSubscription: globalThis.PushSubscription): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('push_subscriptions')
        .delete()
        .eq('user_id', user.id)
        .eq('endpoint', pushSubscription.endpoint);

      if (error) {
        throw error;
      }

      console.log('Push subscription removed from database');
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
      throw error;
    }
  }

  // Send push notification (server-side)
  async sendNotification(
    userId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const response = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          payload
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`);
      }

      console.log('Push notification sent successfully');
    } catch (error) {
      console.error('Failed to send push notification:', error);
      throw error;
    }
  }

  // Test push notification
  async testNotification(): Promise<void> {
    const testPayload: NotificationPayload = {
      title: 'Test Notification',
      body: 'This is a test push notification from InCommand',
      icon: '/icon.png',
      tag: 'test',
      data: {
        url: '/dashboard',
        type: 'test'
      }
    };

    await this.sendNotification('test', testPayload);
  }

  // Utility functions
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

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
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
    if (/Chrome/i.test(userAgent)) return 'chrome';
    if (/Firefox/i.test(userAgent)) return 'firefox';
    if (/Safari/i.test(userAgent)) return 'safari';
    if (/Edge/i.test(userAgent)) return 'edge';
    return 'unknown';
  }

  // Handle service worker updates
  async handleServiceWorkerUpdate(): Promise<void> {
    if (!this.registration) {
      return;
    }

    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration!.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker available
            console.log('New service worker available');
            // You can show a notification to the user here
          }
        });
      }
    });
  }

  // Get subscription status
  getSubscriptionStatus(): 'subscribed' | 'unsubscribed' | 'not-supported' {
    if (!this.isSupported()) {
      return 'not-supported';
    }
    return this.subscription ? 'subscribed' : 'unsubscribed';
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();
