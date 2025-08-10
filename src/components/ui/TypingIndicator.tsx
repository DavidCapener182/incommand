import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPresence } from '@/hooks/usePresence';

interface TypingIndicatorProps {
  users: UserPresence[];
  fieldName: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ 
  users, 
  fieldName, 
  position = 'bottom' 
}) => {
  const typingUsers = users.filter(user => 
    user.typing?.field === fieldName && 
    Date.now() - user.typing.timestamp < 3000
  );

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top':
        return 'bottom-full left-0 mb-2';
      case 'bottom':
        return 'top-full left-0 mt-2';
      case 'left':
        return 'right-full top-0 mr-2';
      case 'right':
        return 'left-full top-0 ml-2';
      default:
        return 'top-full left-0 mt-2';
    }
  };

  if (typingUsers.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`absolute ${getPositionClasses()} z-10`}
        initial={{ opacity: 0, scale: 0.8, y: 5 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 5 }}
        transition={{ duration: 0.2 }}
      >
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 px-3 py-2">
          <div className="flex items-center gap-2">
            {/* Typing animation */}
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-1.5 h-1.5 bg-gray-400 rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5]
                  }}
                  transition={{
                    duration: 1.4,
                    repeat: Infinity,
                    delay: i * 0.2
                  }}
                />
              ))}
            </div>
            
            {/* User info */}
            <div className="flex items-center gap-1">
              {typingUsers.slice(0, 2).map((user, index) => (
                <div key={user.id} className="flex items-center gap-1">
                  {user.avatar ? (
                    <img 
                      src={user.avatar} 
                      alt={user.name}
                      className="w-4 h-4 rounded-full"
                    />
                  ) : (
                    <div 
                      className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: user.color }}
                    >
                      {getInitials(user.name)}
                    </div>
                  )}
                  <span className="text-xs text-gray-600 font-medium">
                    {user.name}
                  </span>
                  {index < typingUsers.length - 1 && index < 1 && (
                    <span className="text-xs text-gray-400">,</span>
                  )}
                </div>
              ))}
              
              {typingUsers.length > 2 && (
                <span className="text-xs text-gray-400">
                  +{typingUsers.length - 2} more
                </span>
              )}
            </div>
            
            <span className="text-xs text-gray-500">typing...</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
