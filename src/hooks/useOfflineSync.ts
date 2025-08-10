import { useState, useEffect, useCallback } from 'react';
import { offlineSyncManager, SyncProgress } from '../lib/offlineSync';

export interface OfflineSyncState {
  isOnline: boolean;
  isSyncInProgress: boolean;
  syncProgress: SyncProgress;
  queueStatus: {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  };
}

export interface OfflineSyncActions {
  triggerManualSync: () => Promise<void>;
  clearCompletedOperations: () => Promise<void>;
  clearFailedOperations: () => Promise<void>;
  queueOperation: (operation: any) => Promise<number>;
  queuePhotoUpload: (file: File, metadata: any) => Promise<string>;
}

export function useOfflineSync(): [OfflineSyncState, OfflineSyncActions] {
  const [state, setState] = useState<OfflineSyncState>({
    isOnline: navigator.onLine,
    isSyncInProgress: false,
    syncProgress: {
      total: 0,
      completed: 0,
      failed: 0,
      inProgress: false
    },
    queueStatus: {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    }
  });

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }));
  }, []);

  // Update sync progress
  const updateSyncProgress = useCallback(() => {
    const progress = offlineSyncManager.getSyncProgress();
    setState(prev => ({
      ...prev,
      syncProgress: progress,
      isSyncInProgress: progress.inProgress
    }));
  }, []);

  // Update queue status
  const updateQueueStatus = useCallback(async () => {
    const queueStatus = await offlineSyncManager.getQueueStatus();
    setState(prev => ({
      ...prev,
      queueStatus
    }));
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial status update
    updateQueueStatus();

    // Poll for updates when sync is in progress
    const interval = setInterval(() => {
      if (offlineSyncManager.isSyncInProgress()) {
        updateSyncProgress();
        updateQueueStatus();
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [updateOnlineStatus, updateSyncProgress, updateQueueStatus]);

  // Actions
  const triggerManualSync = useCallback(async () => {
    try {
      await offlineSyncManager.triggerManualSync();
      updateSyncProgress();
      updateQueueStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }, [updateSyncProgress, updateQueueStatus]);

  const clearCompletedOperations = useCallback(async () => {
    await offlineSyncManager.clearCompletedOperations();
    updateQueueStatus();
  }, [updateQueueStatus]);

  const clearFailedOperations = useCallback(async () => {
    await offlineSyncManager.clearFailedOperations();
    updateQueueStatus();
  }, [updateQueueStatus]);

  const queueOperation = useCallback(async (operation: any) => {
    const id = await offlineSyncManager.queueOperation(operation);
    updateQueueStatus();
    return id;
  }, [updateQueueStatus]);

  const queuePhotoUpload = useCallback(async (file: File, metadata: any) => {
    const photoId = await offlineSyncManager.queuePhotoUpload(file, metadata);
    updateQueueStatus();
    return photoId;
  }, [updateQueueStatus]);

  const actions: OfflineSyncActions = {
    triggerManualSync,
    clearCompletedOperations,
    clearFailedOperations,
    queueOperation,
    queuePhotoUpload
  };

  return [state, actions];
}
