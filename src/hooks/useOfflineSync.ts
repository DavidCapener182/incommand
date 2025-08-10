import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager, OfflineOperation, SyncProgress } from '../lib/offlineSync';

export interface UseOfflineSyncReturn {
  // State
  isOnline: boolean;
  isOffline: boolean;
  syncProgress: SyncProgress;
  pendingOperationsCount: number;
  allOperations: OfflineOperation[];
  
  // Actions
  queueOperation: (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => Promise<number>;
  triggerSync: () => Promise<void>;
  retryFailedOperations: () => Promise<void>;
  clearCompletedOperations: () => Promise<void>;
  clearFailedOperations: () => Promise<void>;
  
  // Specific operations
  queueIncidentCreation: (incidentData: any) => Promise<number>;
  queueIncidentUpdate: (incidentId: string, updateData: any) => Promise<number>;
  queuePhotoUpload: (photoData: any) => Promise<number>;
  queueNotificationSend: (notificationData: any) => Promise<number>;
  
  // Utilities
  refreshOperations: () => Promise<void>;
}

export const useOfflineSync = (): UseOfflineSyncReturn => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncProgress, setSyncProgress] = useState<SyncProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    inProgress: false
  });
  const [pendingOperationsCount, setPendingOperationsCount] = useState(0);
  const [allOperations, setAllOperations] = useState<OfflineOperation[]>([]);

  // Initialize offline sync
  useEffect(() => {
    const initialize = async () => {
      try {
        await offlineSyncManager.initialize();
        await refreshOperations();
      } catch (error) {
        console.error('Failed to initialize offline sync:', error);
      }
    };

    initialize();
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      console.log('[useOfflineSync] Back online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      console.log('[useOfflineSync] Gone offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Monitor sync progress
  useEffect(() => {
    const interval = setInterval(() => {
      const progress = offlineSyncManager.getSyncProgress();
      setSyncProgress(progress);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Refresh operations data
  const refreshOperations = useCallback(async () => {
    try {
      const [pendingCount, operations] = await Promise.all([
        offlineSyncManager.getPendingOperationsCount(),
        offlineSyncManager.getAllOperations()
      ]);

      setPendingOperationsCount(pendingCount);
      setAllOperations(operations);
    } catch (error) {
      console.error('Failed to refresh operations:', error);
    }
  }, []);

  // Queue operation
  const queueOperation = useCallback(async (operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'status'>) => {
    try {
      const id = await offlineSyncManager.queueOperation(operation);
      await refreshOperations();
      return id;
    } catch (error) {
      console.error('Failed to queue operation:', error);
      throw error;
    }
  }, [refreshOperations]);

  // Trigger sync
  const triggerSync = useCallback(async () => {
    try {
      await offlineSyncManager.triggerSync();
      await refreshOperations();
    } catch (error) {
      console.error('Failed to trigger sync:', error);
      throw error;
    }
  }, [refreshOperations]);

  // Retry failed operations
  const retryFailedOperations = useCallback(async () => {
    try {
      await offlineSyncManager.retryFailedOperations();
      await refreshOperations();
    } catch (error) {
      console.error('Failed to retry failed operations:', error);
      throw error;
    }
  }, [refreshOperations]);

  // Clear completed operations
  const clearCompletedOperations = useCallback(async () => {
    try {
      await offlineSyncManager.clearCompletedOperations();
      await refreshOperations();
    } catch (error) {
      console.error('Failed to clear completed operations:', error);
      throw error;
    }
  }, [refreshOperations]);

  // Clear failed operations
  const clearFailedOperations = useCallback(async () => {
    try {
      await offlineSyncManager.clearFailedOperations();
      await refreshOperations();
    } catch (error) {
      console.error('Failed to clear failed operations:', error);
      throw error;
    }
  }, [refreshOperations]);

  // Queue incident creation
  const queueIncidentCreation = useCallback(async (incidentData: any) => {
    return await queueOperation({
      type: 'incident_create',
      data: incidentData,
      url: '/api/incidents',
      method: 'POST'
    });
  }, [queueOperation]);

  // Queue incident update
  const queueIncidentUpdate = useCallback(async (incidentId: string, updateData: any) => {
    return await queueOperation({
      type: 'incident_update',
      data: updateData,
      url: `/api/incidents/${incidentId}`,
      method: 'PUT'
    });
  }, [queueOperation]);

  // Queue photo upload
  const queuePhotoUpload = useCallback(async (photoData: any) => {
    return await queueOperation({
      type: 'photo_upload',
      data: photoData,
      url: '/api/upload',
      method: 'POST'
    });
  }, [queueOperation]);

  // Queue notification send
  const queueNotificationSend = useCallback(async (notificationData: any) => {
    return await queueOperation({
      type: 'notification_send',
      data: notificationData,
      url: '/api/notifications/send-push',
      method: 'POST'
    });
  }, [queueOperation]);

  return {
    // State
    isOnline,
    isOffline: !isOnline,
    syncProgress,
    pendingOperationsCount,
    allOperations,
    
    // Actions
    queueOperation,
    triggerSync,
    retryFailedOperations,
    clearCompletedOperations,
    clearFailedOperations,
    
    // Specific operations
    queueIncidentCreation,
    queueIncidentUpdate,
    queuePhotoUpload,
    queueNotificationSend,
    
    // Utilities
    refreshOperations
  };
};
