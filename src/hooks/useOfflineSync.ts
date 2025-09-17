"use client";

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
  const isBrowser = typeof window !== 'undefined';
  const manager = isBrowser ? offlineSyncManager : null;

  const getInitialState = (): OfflineSyncState => ({
    isOnline: isBrowser && typeof navigator !== 'undefined' ? navigator.onLine : true,
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

  const [state, setState] = useState<OfflineSyncState>(getInitialState);

  // Update online status
  const updateOnlineStatus = useCallback(() => {
    if (!manager || typeof navigator === 'undefined') return;
    setState(prev => ({
      ...prev,
      isOnline: navigator.onLine
    }));
  }, [manager]);

  // Update sync progress
  const updateSyncProgress = useCallback(() => {
    if (!manager) return;
    const progress = manager.getSyncProgress();
    setState(prev => ({
      ...prev,
      syncProgress: progress,
      isSyncInProgress: progress.inProgress
    }));
  }, [manager]);

  // Update queue status
  const updateQueueStatus = useCallback(async () => {
    if (!manager) return;
    const queueStatus = await manager.getQueueStatus();
    setState(prev => ({
      ...prev,
      queueStatus
    }));
  }, [manager]);

  // Setup event listeners
  useEffect(() => {
    if (!manager) {
      return;
    }

    // Online/offline events
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    // Initial status update
    updateQueueStatus();

    // Poll for updates when sync is in progress
    const interval = setInterval(() => {
      if (manager.isSyncInProgress()) {
        updateSyncProgress();
        updateQueueStatus();
      }
    }, 1000);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
      clearInterval(interval);
    };
  }, [manager, updateOnlineStatus, updateSyncProgress, updateQueueStatus]);

  // Actions
  const triggerManualSync = useCallback(async () => {
    if (!manager) return;
    try {
      await manager.triggerManualSync();
      updateSyncProgress();
      updateQueueStatus();
    } catch (error) {
      console.error('Manual sync failed:', error);
      throw error;
    }
  }, [manager, updateQueueStatus, updateSyncProgress]);

  const clearCompletedOperations = useCallback(async () => {
    if (!manager) return;
    await manager.clearCompletedOperations();
    updateQueueStatus();
  }, [manager, updateQueueStatus]);

  const clearFailedOperations = useCallback(async () => {
    if (!manager) return;
    await manager.clearFailedOperations();
    updateQueueStatus();
  }, [manager, updateQueueStatus]);

  const queueOperation = useCallback(async (operation: any) => {
    if (!manager) return 0;
    const id = await manager.queueOperation(operation);
    updateQueueStatus();
    return id;
  }, [manager, updateQueueStatus]);

  const queuePhotoUpload = useCallback(async (file: File, metadata: any) => {
    if (!manager) return '';
    const photoId = await manager.queuePhotoUpload(file, metadata);
    updateQueueStatus();
    return photoId;
  }, [manager, updateQueueStatus]);

  const noop = async () => {};

  const actions: OfflineSyncActions = manager ? {
    triggerManualSync,
    clearCompletedOperations,
    clearFailedOperations,
    queueOperation,
    queuePhotoUpload
  } : {
    triggerManualSync: noop,
    clearCompletedOperations: noop,
    clearFailedOperations: noop,
    queueOperation: async () => 0,
    queuePhotoUpload: async () => ''
  };

  return [state, actions];
}
