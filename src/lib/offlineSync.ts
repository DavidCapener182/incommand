import Dexie, { Table } from 'dexie';
import { supabase } from './supabase';

// Database schema for offline operations
export interface OfflineOperation {
  id?: number;
  type: 'incident_create' | 'incident_update' | 'photo_upload' | 'notification_send';
  data: any;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries?: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

// Offline database using Dexie
class OfflineDatabase extends Dexie {
  offlineOperations!: Table<OfflineOperation>;

  constructor() {
    super('incommand-offline');
    this.version(1).stores({
      offlineOperations: '++id, type, timestamp, status'
    });
  }
}

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private db: OfflineDatabase;
  private isOnline: boolean = typeof window !== 'undefined' ? navigator.onLine : true;
  private syncInProgress: boolean = false;
  private syncProgress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  };

  private constructor() {
    this.db = new OfflineDatabase();
    // Only setup listeners in browser environment
    if (typeof window !== 'undefined') {
      this.setupOnlineOfflineListeners();
    }
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  // Setup online/offline event listeners
  private setupOnlineOfflineListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.onOnline();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.onOffline();
    });
  }

  // Handle online event
  private async onOnline(): Promise<void> {
    console.log('[OfflineSync] Back online, starting sync...');
    this.triggerSync();
  }

  // Handle offline event
  private onOffline(): void {
    console.log('[OfflineSync] Gone offline');
    this.syncProgress.inProgress = false;
  }

  // Queue an operation for offline processing
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<number> {
    const offlineOperation: OfflineOperation = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      status: 'pending'
    };

    const id = await this.db.offlineOperations.add(offlineOperation);
    console.log(`[OfflineSync] Queued operation ${id}:`, operation.type);

    // If online, try to sync immediately
    if (this.isOnline) {
      this.triggerSync();
    }

    return Number(id);
  }

  // Trigger background sync
  async triggerSync(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;
    this.syncProgress.inProgress = true;

    try {
      // Check if Background Sync API is supported
      if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        const registration = await navigator.serviceWorker.ready;
        if ('sync' in registration) {
          await (registration as any).sync.register('offlineQueue');
          console.log('[OfflineSync] Background sync registered');
        } else {
          // Fallback: immediate sync
          await this.performSync();
        }
      } else {
        // Fallback: immediate sync
        await this.performSync();
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to trigger sync:', error);
      this.syncInProgress = false;
      this.syncProgress.inProgress = false;
    }
  }

  // Perform the actual sync operation
  async performSync(): Promise<void> {
    if (this.syncInProgress) {
      return;
    }

    this.syncInProgress = true;
    this.syncProgress.inProgress = true;

    try {
      const pendingOperations = await this.db.offlineOperations
        .where('status')
        .equals('pending')
        .toArray();

      this.syncProgress.total = pendingOperations.length;
      this.syncProgress.completed = 0;
      this.syncProgress.failed = 0;

      console.log(`[OfflineSync] Starting sync of ${pendingOperations.length} operations`);

      for (const operation of pendingOperations) {
        try {
          await this.processOperation(operation);
          this.syncProgress.completed++;
        } catch (error) {
          console.error(`[OfflineSync] Failed to process operation ${operation.id}:`, error);
          await this.handleOperationError(operation, error);
          this.syncProgress.failed++;
        }
      }

      console.log(`[OfflineSync] Sync completed. ${this.syncProgress.completed} successful, ${this.syncProgress.failed} failed`);
    } catch (error) {
      console.error('[OfflineSync] Sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.syncProgress.inProgress = false;
    }
  }

  // Process individual operation
  private async processOperation(operation: OfflineOperation): Promise<void> {
    // Mark as processing
    await this.db.offlineOperations.update(operation.id!, { status: 'processing' });

    try {
      const response = await fetch(operation.url, {
        method: operation.method,
        headers: {
          'Content-Type': 'application/json',
          ...operation.headers
        },
        body: operation.method !== 'GET' ? JSON.stringify(operation.data) : undefined
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Mark as completed
      await this.db.offlineOperations.update(operation.id!, { 
        status: 'completed',
        timestamp: Date.now()
      });

      console.log(`[OfflineSync] Operation ${operation.id} completed successfully`);
    } catch (error) {
      throw error;
    }
  }

  // Handle operation errors
  private async handleOperationError(operation: OfflineOperation, error: any): Promise<void> {
    const newRetryCount = operation.retryCount + 1;
    
    if (newRetryCount >= operation.maxRetries!) {
      // Mark as failed after max retries
      await this.db.offlineOperations.update(operation.id!, {
        status: 'failed',
        error: error.message,
        retryCount: newRetryCount
      });
    } else {
      // Mark for retry
      await this.db.offlineOperations.update(operation.id!, {
        status: 'pending',
        retryCount: newRetryCount,
        error: error.message
      });
    }
  }

  // Get sync progress
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  // Get offline status
  isOffline(): boolean {
    return !this.isOnline;
  }

  // Get pending operations count
  async getPendingOperationsCount(): Promise<number> {
    return await this.db.offlineOperations
      .where('status')
      .equals('pending')
      .count();
  }

  // Get all operations
  async getAllOperations(): Promise<OfflineOperation[]> {
    return await this.db.offlineOperations
      .orderBy('timestamp')
      .reverse()
      .toArray();
  }

  // Clear completed operations
  async clearCompletedOperations(): Promise<void> {
    await this.db.offlineOperations
      .where('status')
      .equals('completed')
      .delete();
  }

  // Clear failed operations
  async clearFailedOperations(): Promise<void> {
    await this.db.offlineOperations
      .where('status')
      .equals('failed')
      .delete();
  }

  // Retry failed operations
  async retryFailedOperations(): Promise<void> {
    const failedOperations = await this.db.offlineOperations
      .where('status')
      .equals('failed')
      .toArray();

    for (const operation of failedOperations) {
      await this.db.offlineOperations.update(operation.id!, {
        status: 'pending',
        retryCount: 0,
        error: undefined
      });
    }

    if (failedOperations.length > 0) {
      this.triggerSync();
    }
  }

  // Queue incident creation
  async queueIncidentCreation(incidentData: any): Promise<number> {
    return await this.queueOperation({
      type: 'incident_create',
      data: incidentData,
      url: '/api/incidents',
      method: 'POST'
    });
  }

  // Queue incident update
  async queueIncidentUpdate(incidentId: string, updateData: any): Promise<number> {
    return await this.queueOperation({
      type: 'incident_update',
      data: updateData,
      url: `/api/incidents/${incidentId}`,
      method: 'PUT'
    });
  }

  // Queue photo upload
  async queuePhotoUpload(photoData: any): Promise<number> {
    return await this.queueOperation({
      type: 'photo_upload',
      data: photoData,
      url: '/api/upload',
      method: 'POST'
    });
  }

  // Queue notification send
  async queueNotificationSend(notificationData: any): Promise<number> {
    return await this.queueOperation({
      type: 'notification_send',
      data: notificationData,
      url: '/api/notifications/send-push',
      method: 'POST'
    });
  }

  // Initialize offline sync
  async initialize(): Promise<void> {
    try {
      await this.db.open();
      console.log('[OfflineSync] Database initialized');
      
      // Trigger initial sync if online
      if (this.isOnline) {
        this.triggerSync();
      }
    } catch (error) {
      console.error('[OfflineSync] Failed to initialize:', error);
    }
  }

  // Close database
  async close(): Promise<void> {
    await this.db.close();
  }
}

// Export singleton instance
export const offlineSyncManager = OfflineSyncManager.getInstance();

// Export utility functions
export const queueOfflineOperation = (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => 
  offlineSyncManager.queueOperation(operation);

export const triggerOfflineSync = () => offlineSyncManager.triggerSync();
export const getOfflineSyncProgress = () => offlineSyncManager.getSyncProgress();
export const isOffline = () => offlineSyncManager.isOffline();
export const getPendingOperationsCount = () => offlineSyncManager.getPendingOperationsCount();
export const initializeOfflineSync = () => offlineSyncManager.initialize();
