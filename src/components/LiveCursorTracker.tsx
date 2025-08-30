'use client'

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { usePresence } from '@/hooks/usePresence';

interface LiveCursorTrackerProps {
  channelName: string;
  isEnabled?: boolean;
}

export const LiveCursorTracker: React.FC<LiveCursorTrackerProps> = ({ 
  channelName, 
  isEnabled = true 
}) => {
  const { users, updateCursor, isConnected } = usePresence(channelName);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      updateCursor(x, y);
    };

    const container = containerRef.current;
    container.addEventListener('mousemove', handleMouseMove);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isEnabled, updateCursor]);

  if (!isEnabled) return null;

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Live cursors */}
      {users.map((user) => {
        if (!user.cursor || user.id === 'current-user') return null;

        return (
          <motion.div
            key={user.id}
            className="absolute pointer-events-none z-50"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              x: user.cursor.x,
              y: user.cursor.y
            }}
            transition={{ 
              type: "spring", 
              stiffness: 500, 
              damping: 30 
            }}
          >
            {/* Cursor dot */}
            <div 
              className="w-3 h-3 rounded-full border-2 border-white shadow-lg"
              style={{ backgroundColor: user.color }}
            />
            
            {/* User label */}
            <motion.div
              className="absolute top-4 left-4 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {user.name}
            </motion.div>
          </motion.div>
        );
      })}

      {/* Connection status indicator */}
      <div className="absolute top-2 right-2 z-50">
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
      </div>
    </div>
  );
};
