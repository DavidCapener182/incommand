import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPresence } from '@/hooks/usePresence';

interface CursorTrackerProps {
  users: UserPresence[];
  containerRef: React.RefObject<HTMLElement>;
}

export const CursorTracker: React.FC<CursorTrackerProps> = ({ users, containerRef }) => {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      <AnimatePresence>
        {users
          .filter(user => user.cursor && user.id !== 'current-user')
          .map(user => (
            <motion.div
              key={user.id}
              className="absolute"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                x: user.cursor!.x,
                y: user.cursor!.y
              }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ 
                type: "spring", 
                stiffness: 300, 
                damping: 30,
                duration: 0.2
              }}
            >
              {/* Cursor pointer */}
              <div 
                className="w-4 h-4 transform -translate-x-1 -translate-y-1"
                style={{ color: user.color }}
              >
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M13.64,21.97C13.14,22.16 12.54,22 12.31,21.5L10.13,16.76L7.62,18.78C7.45,18.92 7.24,19 7,19A1,1 0 0,1 6,18V3A1,1 0 0,1 7,2C7.24,2 7.47,2.09 7.64,2.23L7.65,2.22L19.14,11.86C19.57,12.22 19.62,12.85 19.27,13.27C19.12,13.45 18.91,13.57 18.7,13.61L15.54,14.23L17.74,18.96C18,19.46 17.8,20.05 17.3,20.28L13.64,21.97Z" />
                </svg>
              </div>
              
              {/* User label */}
              <motion.div
                className="absolute top-6 left-2 bg-white rounded-lg shadow-lg px-2 py-1 text-xs font-medium border"
                style={{ borderColor: user.color }}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center gap-1">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-3 h-3 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-3 h-3 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="text-gray-700">{user.name}</span>
                </div>
              </motion.div>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
};

