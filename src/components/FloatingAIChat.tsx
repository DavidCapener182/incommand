'use client'

import React, { useState, useEffect } from 'react';
import AIChat from './AIChat';
import HelpCenterModal from './HelpCenterModal';

interface FloatingAIChatProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export default function FloatingAIChat({ className = '', isOpen: isOpenProp, onToggle }: FloatingAIChatProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);

  const isOpen = typeof isOpenProp === 'boolean' ? isOpenProp : internalOpen;
  const toggleChat = onToggle ? onToggle : () => setInternalOpen((v) => !v);

  // Check for unread messages on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const lastMessageTime = localStorage.getItem('lastAIChatMessage');
      const lastViewTime = localStorage.getItem('lastAIChatView');
      
      if (lastMessageTime && lastViewTime) {
        setHasNewMessage(new Date(lastMessageTime) > new Date(lastViewTime));
      }
    }
  }, []);

  // Mark as viewed when opened
  useEffect(() => {
    if (isOpen && typeof window !== 'undefined') {
      localStorage.setItem('lastAIChatView', new Date().toISOString());
      setHasNewMessage(false);
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div className={`fixed bottom-6 right-6 z-[60] ${className}`}>
          <button
            onClick={toggleChat}
            className="relative w-14 h-14 bg-[#2A3990] hover:bg-[#1e2a6a] text-white dark:bg-white dark:text-[#2A3990] dark:hover:bg-gray-200 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
            title="inCommand AI Assistant"
          >
            {/* Notification Badge */}
            {hasNewMessage && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}

            {/* Chat Icon */}
            {!isOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a8.959 8.959 0 01-4.906-1.436L3 21l1.436-5.094A8.959 8.959 0 013 12c0-4.418 3.582-8 8-8s8 3.582 8 8z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}

            {/* Pulse Animation for New Messages */}
            {hasNewMessage && (
              <div className="absolute inset-0 rounded-full bg-[#2A3990] animate-ping opacity-75"></div>
            )}
          </button>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
            inCommand AI Assistant
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}

      {/* Chat Window - Extended to menu bar */}
      {isOpen && (
        <HelpCenterModal isOpen={isOpen} onClose={toggleChat} />
      )}

      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={toggleChat}
        />
      )}

      {/* Mobile Chat Window */}
      {isOpen && (
        <div className="fixed inset-x-4 bottom-4 top-20 z-40 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden md:hidden">
          {/* Mobile Chat Header */}
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-[#232c43] dark:to-[#151d34] border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">inCommand AI</h3>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">Digital Operations Assistant</span>
                </div>
              </div>
            </div>
            
            <button
              onClick={toggleChat}
              className="p-2 rounded-md hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-5 w-5 text-gray-500 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Mobile Chat Content */}
          <div className="h-[calc(100%-80px)]">
            <AIChat isVisible={isOpen} />
          </div>
        </div>
      )}
    </>
  );
} 