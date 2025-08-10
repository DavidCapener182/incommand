'use client';

import React from 'react';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useToast } from './Toast';

export const OfflineIndicator: React.FC = () => {
  const {
    isOnline,
    isOffline,
    syncProgress,
    pendingOperationsCount,
    triggerSync,
    retryFailedOperations,
    clearCompletedOperations
  } = useOfflineSync();

  const { showSyncNotification } = useToast();

  const handleManualSync = async () => {
    try {
      showSyncNotification('Starting manual sync...');
      await triggerSync();
      showSyncNotification('Manual sync completed', true);
    } catch (error) {
      console.error('Manual sync failed:', error);
    }
  };

  const handleRetryFailed = async () => {
    try {
      await retryFailedOperations();
      showSyncNotification('Retrying failed operations...');
    } catch (error) {
      console.error('Retry failed operations failed:', error);
    }
  };

  const handleClearCompleted = async () => {
    try {
      await clearCompletedOperations();
      showSyncNotification('Cleared completed operations');
    } catch (error) {
      console.error('Clear completed operations failed:', error);
    }
  };

  // Hidden for now - can be re-enabled later if needed
  return null;

  return (
    <div className="fixed top-4 right-4 z-40">
      <div className="bg-white rounded-lg shadow-lg border p-4 max-w-sm">
        {/* Status Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            {isOffline ? (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">Offline</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-700">Online</span>
              </div>
            )}
          </div>
          
          {syncProgress.inProgress && (
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-xs text-blue-600">Syncing...</span>
            </div>
          )}
        </div>

        {/* Pending Operations */}
        {pendingOperationsCount > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {pendingOperationsCount} operation{pendingOperationsCount !== 1 ? 's' : ''} pending
              </span>
              <button
                onClick={handleManualSync}
                disabled={syncProgress.inProgress}
                className="px-3 py-1 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sync Now
              </button>
            </div>
          </div>
        )}

        {/* Sync Progress */}
        {syncProgress.inProgress && syncProgress.total > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>Progress</span>
              <span>{syncProgress.completed}/{syncProgress.total}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(syncProgress.completed / syncProgress.total) * 100}%`
                }}
              ></div>
            </div>
            {syncProgress.failed > 0 && (
              <div className="mt-1 text-xs text-red-600">
                {syncProgress.failed} failed
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex space-x-2">
          <button
            onClick={handleRetryFailed}
            className="flex-1 px-3 py-2 text-xs bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
          >
            Retry Failed
          </button>
          <button
            onClick={handleClearCompleted}
            className="flex-1 px-3 py-2 text-xs bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear Completed
          </button>
        </div>

        {/* Offline Message */}
        {isOffline && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-xs text-yellow-800">
              You're currently offline. Changes will be synced when you're back online.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
