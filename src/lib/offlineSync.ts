import { Dexie } from 'dexie';
import { supabase } from './supabase';

const isBrowser = typeof window !== 'undefined';

export interface OfflineOperation {
  id?: number;
  type: 'incident_create' | 'incident_update' | 'photo_upload' | 'notification_send';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncProgress {
  total: number;
  completed: number;
  failed: number;
  inProgress: boolean;
}

class OfflineDatabase extends Dexie {
  offlineQueue!: Dexie.Table<OfflineOperation, number>;
  offlinePhotos!: Dexie.Table<{ id: string; file: File; metadata: any }, string>;

  constructor() {
    super('incommand-offline');
    this.version(3).stores({
      offlineQueue: '++id, type, status, timestamp',
      offlinePhotos: 'id, timestamp'
    });
  }
}

class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private db: OfflineDatabase | null = null;
  private syncInProgress: boolean = false;
  private onlineStatus: boolean = isBrowser ? navigator.onLine : true;
  private syncProgress: SyncProgress = {
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  };

  private constructor() {
    if (isBrowser) {
      this.db = new OfflineDatabase();
      this.setupOnlineStatusListener();
      this.setupBackgroundSync();
    }
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance && isBrowser) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  // Queue an operation for offline sync
  async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>): Promise<number> {
    const offlineOperation: OfflineOperation = {
      ...operation,
      timestamp: Date.now(),
      retryCount: 0,
      status: 'pending'
    };

    const id = await this.db!.offlineQueue.add(offlineOperation);
    console.log('Operation queued for offline sync:', { id, type: operation.type });
    
    // Trigger sync if online
    if (this.onlineStatus && !this.syncInProgress) {
      this.syncOfflineData();
    }

    return id as number;
  }

  // Queue photo upload for offline sync
  async queuePhotoUpload(file: File, metadata: any): Promise<string> {
    const photoId = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.db!.offlinePhotos.add({
      id: photoId,
      file,
      metadata: {
        ...metadata,
        timestamp: Date.now()
      }
    });

    // Queue the upload operation
    await this.queueOperation({
      type: 'photo_upload',
      data: { photoId, metadata },
      maxRetries: 5,
      priority: 'high'
    });

    return photoId;
  }

  // Sync all offline operations
  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress || !this.onlineStatus) {
      return;
    }

    this.syncInProgress = true;
    this.syncProgress.inProgress = true;

    try {
      // Get all pending operations
      const pendingOperations = await this.db!.offlineQueue
        .where('status')
        .equals('pending')
        .toArray();

      this.syncProgress.total = pendingOperations.length;
      this.syncProgress.completed = 0;
      this.syncProgress.failed = 0;

      console.log(`Starting sync of ${pendingOperations.length} offline operations`);

      // Process operations by priority
      const highPriority = pendingOperations.filter(op => op.priority === 'high');
      const mediumPriority = pendingOperations.filter(op => op.priority === 'medium');
      const lowPriority = pendingOperations.filter(op => op.priority === 'low');

      const orderedOperations = [...highPriority, ...mediumPriority, ...lowPriority];

      for (const operation of orderedOperations) {
        try {
          await this.processOperation(operation);
          this.syncProgress.completed++;
        } catch (error) {
          console.error('Failed to process operation:', error);
          await this.handleOperationError(operation, error as Error);
          this.syncProgress.failed++;
        }
      }

      console.log('Offline sync completed:', this.syncProgress);
    } catch (error) {
      console.error('Offline sync failed:', error);
    } finally {
      this.syncInProgress = false;
      this.syncProgress.inProgress = false;
    }
  }

  // Process a single offline operation
  private async processOperation(operation: OfflineOperation): Promise<void> {
    // Mark as processing
    await this.db!.offlineQueue.update(operation.id!, { status: 'processing' });

    switch (operation.type) {
      case 'incident_create':
        await this.processIncidentCreate(operation);
        break;
      case 'incident_update':
        await this.processIncidentUpdate(operation);
        break;
      case 'photo_upload':
        await this.processPhotoUpload(operation);
        break;
      case 'notification_send':
        await this.processNotificationSend(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }

    // Mark as completed
    await this.db!.offlineQueue.update(operation.id!, { status: 'completed' });
  }

  // Process incident creation
  private async processIncidentCreate(operation: OfflineOperation): Promise<void> {
    const { data } = operation;
    
    const { error } = await supabase
      .from('incident_logs')
      .insert([data]);

    if (error) {
      throw new Error(`Failed to create incident: ${error.message}`);
    }
  }

  // Process incident update
  private async processIncidentUpdate(operation: OfflineOperation): Promise<void> {
    const { data } = operation;
    
    const { error } = await supabase
      .from('incident_logs')
      .update(data.update)
      .eq('id', data.id);

    if (error) {
      throw new Error(`Failed to update incident: ${error.message}`);
    }
  }

  // Process photo upload
  private async processPhotoUpload(operation: OfflineOperation): Promise<void> {
    const { photoId, metadata } = operation.data;
    
    // Get the photo from IndexedDB
    const photoData = await this.db!.offlinePhotos.get(photoId);
    if (!photoData) {
      throw new Error(`Photo not found: ${photoId}`);
    }

    // Upload to Supabase Storage
    const fileName = `incidents/${Date.now()}_${photoData.file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('incident-photos')
      .upload(fileName, photoData.file);

    if (uploadError) {
      throw new Error(`Failed to upload photo: ${uploadError.message}`);
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('incident-photos')
      .getPublicUrl(fileName);

    // Update incident with photo URL if needed
    if (metadata.incidentId) {
      // First get the current photos array
      const { data: incidentData, error: fetchError } = await supabase
        .from('incident_logs')
        .select('photos')
        .eq('id', metadata.incidentId)
        .single();

      if (fetchError) {
        throw new Error(`Failed to fetch incident photos: ${fetchError.message}`);
      }

      // Append the new photo URL
      const currentPhotos = Array.isArray(incidentData?.photos) ? incidentData.photos : [];
      const updatedPhotos = [...currentPhotos, publicUrl];

      const { error: updateError } = await supabase
        .from('incident_logs')
        .update({ photos: updatedPhotos })
        .eq('id', metadata.incidentId);

      if (updateError) {
        throw new Error(`Failed to update incident with photo: ${updateError.message}`);
      }
    }

    // Remove photo from IndexedDB
    await this.db!.offlinePhotos.delete(photoId);
  }

  // Process notification send
  private async processNotificationSend(operation: OfflineOperation): Promise<void> {
    const { data } = operation;
    
    const response = await fetch('/api/notifications/send-push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      throw new Error(`Failed to send notification: ${response.statusText}`);
    }
  }

  // Handle operation errors with retry logic
  private async handleOperationError(operation: OfflineOperation, error: Error): Promise<void> {
    const newRetryCount = operation.retryCount + 1;
    
    if (newRetryCount >= operation.maxRetries) {
      // Mark as failed after max retries
      await this.db!.offlineQueue.update(operation.id!, {
        status: 'failed',
        error: error.message,
        retryCount: newRetryCount
      });
    } else {
      // Reset to pending for retry
      await this.db!.offlineQueue.update(operation.id!, {
        status: 'pending',
        retryCount: newRetryCount
      });
    }
  }

  // Get sync progress
  getSyncProgress(): SyncProgress {
    return { ...this.syncProgress };
  }

  // Get offline queue status
  async getQueueStatus(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const operations = await this.db!.offlineQueue.toArray();

    return {
      pending: operations.filter(op => op.status === 'pending').length,
      processing: operations.filter(op => op.status === 'processing').length,
      completed: operations.filter(op => op.status === 'completed').length,
      failed: operations.filter(op => op.status === 'failed').length
    };
  }

  // Clear completed operations
  async clearCompletedOperations(): Promise<void> {
    await this.db!.offlineQueue
      .where('status')
      .equals('completed')
      .delete();
  }

  // Clear failed operations
  async clearFailedOperations(): Promise<void> {
    await this.db!.offlineQueue
      .where('status')
      .equals('failed')
      .delete();
  }

  // Setup online status listener
  private setupOnlineStatusListener(): void {
    window.addEventListener('online', () => {
      this.onlineStatus = true;
      console.log('Device is online, triggering sync');
      this.syncOfflineData();
    });

    window.addEventListener('offline', () => {
      this.onlineStatus = false;
      console.log('Device is offline');
    });
  }

  // Setup background sync
  private setupBackgroundSync(): void {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then((registration) => {
        (registration as any).sync.register('offline-queue').catch((error: any) => {
          console.error('Background sync registration failed:', error);
        });
      });
    }
  }

  // Manual sync trigger
  async triggerManualSync(): Promise<void> {
    if (!this.onlineStatus) {
      throw new Error('Cannot sync while offline');
    }
    
    await this.syncOfflineData();
  }

  // Get offline photos
  async getOfflinePhotos(): Promise<{ id: string; file: File; metadata: any }[]> {
    return await this.db!.offlinePhotos.toArray();
  }

  // Remove offline photo
  async removeOfflinePhoto(photoId: string): Promise<void> {
    await this.db!.offlinePhotos.delete(photoId);
  }

  // Check if device is online
  isOnline(): boolean {
    return this.onlineStatus;
  }

  // Check if sync is in progress
  isSyncInProgress(): boolean {
    return this.syncInProgress;
  }
}

// Export singleton instance (browser only)
export const offlineSyncManager = isBrowser ? OfflineSyncManager.getInstance() : null;
