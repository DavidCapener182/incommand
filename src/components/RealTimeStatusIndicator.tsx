'use client'

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SignalIcon, WifiIcon } from '@heroicons/react/24/outline';

interface RealTimeStatusIndicatorProps {
  isConnected: boolean;
  onlineUsers?: number;
  lastSyncTime?: Date | null;
  showDetails?: boolean;
  className?: string;
}

export const RealTimeStatusIndicator: React.FC<RealTimeStatusIndicatorProps> = ({
  isConnected,
  onlineUsers = 0,
  lastSyncTime,
  showDetails = false,
  className = ''
}) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    return `${Math.floor(seconds / 3600)}h ago`;
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Connection indicator */}
      <div className="flex items-center space-x-1">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-400' : 'bg-red-400'
          }`}
          animate={isConnected ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span className="text-xs text-gray-600 dark:text-gray-400">
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Online users count */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-1"
        >
          <SignalIcon className="w-3 h-3 text-green-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">
            {onlineUsers} online
          </span>
        </motion.div>
      )}

      {/* Last sync time */}
      {showDetails && lastSyncTime && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-gray-500 dark:text-gray-500"
        >
          Last sync: {formatLastSync(lastSyncTime)}
        </motion.div>
      )}

      {/* Connection animation */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: 'auto' }}
            exit={{ opacity: 0, width: 0 }}
            className="flex items-center space-x-1"
          >
            <WifiIcon className="w-3 h-3 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">
              Connected
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
