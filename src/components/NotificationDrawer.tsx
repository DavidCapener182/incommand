'use client'

import React, { useState, useEffect, useRef } from 'react';
import { RecentAction } from '../pages/api/notifications/recent-actions';
import AIChat from './AIChat';


interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onMarkAllRead: () => void;
  onClearAll?: () => void;
}

interface AISummaryData {
  summary: string;
  analysis: {
    totalIncidents: number;
    openIncidents: number;
    highPriorityIncidents: number;
    urgentAlerts: string[];
    recentTrends: string[];
  };
  lastUpdated: string;
  incidentCount: number;
}

export default function NotificationDrawer({ isOpen, onClose, unreadCount, onMarkAllRead, onClearAll }: NotificationDrawerProps) {
  const [activeTab, setActiveTab] = useState<'notifications' | 'chat' | 'push-settings'>('notifications');
  const [actions, setActions] = useState<RecentAction[]>([]);
  const [aiSummary, setAISummary] = useState<AISummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readNotifications, setReadNotifications] = useState<Set<string>>(new Set());
  const [lastLogTimestamp, setLastLogTimestamp] = useState<string | null>(null);
  const [pushLoading, setPushLoading] = useState(false);
  const [pushError, setPushError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<{
    supported: boolean;
    permission: 'default' | 'granted' | 'denied';
    subscribed: boolean;
  } | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  


  // Load read notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('readNotifications');
      if (stored) {
        try {
          const readIds = JSON.parse(stored);
          setReadNotifications(new Set(readIds));
        } catch (error) {
          console.error('Error loading read notifications:', error);
        }
      }
    }
  }, []);

  // Save read notifications to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && readNotifications.size > 0) {
      localStorage.setItem('readNotifications', JSON.stringify(Array.from(readNotifications)));
    }
  }, [readNotifications]);

  // Track last viewed timestamp for filtering notifications
  const getLastViewedTimestamp = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('lastViewedNotifications') || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    }
    return new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  };

  const updateLastViewedTimestamp = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('lastViewedNotifications', new Date().toISOString());
    }
  };

  // Push notification functions
  const loadPushNotificationStatus = async () => {
    setPushLoading(true);
    setPushError(null);
    try {
      // Mock implementation - replace with actual push notification status check
      setPushStatus({
        supported: true,
        permission: 'default',
        subscribed: false
      });
    } catch (error) {
      setPushError('Failed to load push notification status');
    } finally {
      setPushLoading(false);
    }
  };

  const requestPushPermission = async () => {
    setPushLoading(true);
    try {
      // Mock implementation - replace with actual permission request
      setPushStatus(prev => prev ? { ...prev, permission: 'granted' } : null);
    } catch (error) {
      setPushError('Failed to request permission');
    } finally {
      setPushLoading(false);
    }
  };

  const subscribeToPush = async () => {
    setPushLoading(true);
    try {
      // Mock implementation - replace with actual subscription
      setPushStatus(prev => prev ? { ...prev, subscribed: true } : null);
    } catch (error) {
      setPushError('Failed to subscribe');
    } finally {
      setPushLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setPushLoading(true);
    try {
      // Mock implementation - replace with actual unsubscription
      setPushStatus(prev => prev ? { ...prev, subscribed: false } : null);
    } catch (error) {
      setPushError('Failed to unsubscribe');
    } finally {
      setPushLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setPushLoading(true);
    try {
      // Mock implementation - replace with actual test notification
      console.log('Sending test notification...');
    } catch (error) {
      setPushError('Failed to send test notification');
    } finally {
      setPushLoading(false);
    }
  };

  // Fetch data when drawer opens or when read notifications change
  useEffect(() => {
    if (isOpen) {
      fetchNotificationData();
      updateLastViewedTimestamp(); // Update timestamp when drawer opens
    }
  }, [isOpen, readNotifications]);

  // Auto-refresh AI summary 30 seconds after last log is created
  useEffect(() => {
    if (!lastLogTimestamp || !isOpen) return;

    const lastLogTime = new Date(lastLogTimestamp).getTime();
    const now = Date.now();
    const timeSinceLastLog = now - lastLogTime;
    
    // If it's been less than 30 seconds since the last log, set a timer
    if (timeSinceLastLog < 30000) {
      const timeUntilRefresh = 30000 - timeSinceLastLog;
      
      const timer = setTimeout(() => {
        fetchAISummary(); // Refresh only AI summary
      }, timeUntilRefresh);

      return () => clearTimeout(timer);
    }
  }, [lastLogTimestamp, isOpen]);





  // Close drawer when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      if (drawerRef.current && !drawerRef.current.contains(event.target as Node)) {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const fetchNotificationData = async () => {
    setLoading(true);
    setError(null);

    try {
      const lastViewed = getLastViewedTimestamp();
      
      // Fetch recent actions and AI summary in parallel
      const [actionsResponse, summaryResponse] = await Promise.all([
        fetch(`/api/notifications/recent-actions?lastViewed=${encodeURIComponent(lastViewed)}`),
        fetch('/api/notifications/ai-summary')
      ]);

      if (actionsResponse.ok) {
        const actionsData = await actionsResponse.json();
        // Filter out notifications that have been read
        const unreadActions = (actionsData.actions || []).filter(
          (action: RecentAction) => !readNotifications.has(action.id)
        );
        setActions(unreadActions);
        
        // Track the timestamp of the most recent log for auto-refresh
        if (unreadActions.length > 0) {
          const mostRecentTimestamp = unreadActions[0].timestamp;
          setLastLogTimestamp(mostRecentTimestamp);
        }
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setAISummary(summaryData);
      }
    } catch (err) {
      console.error('Error fetching notification data:', err);
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchAISummary = async () => {
    try {
      const summaryResponse = await fetch('/api/notifications/ai-summary');
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setAISummary(summaryData);
      }
    } catch (err) {
      console.error('Error fetching AI summary:', err);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  // Function to format message content with proper bold text
  const formatMessageContent = (content: string) => {
    // Split content by bold markers and create React elements
    const parts = content.split(/(\*\*.*?\*\*)/);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        // This is bold text - remove ** and make it bold
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-semibold">{boldText}</strong>;
      } else {
        // Process regular text for other formatting
        const processedText = part
          .replace(/^#{1,6}\s*/gm, '') // Remove markdown headers
          .replace(/^[-*+]\s+/gm, '• ') // Convert markdown bullets to simple bullets
          .replace(/^\d+\.\s+/gm, '') // Remove numbered list formatting
          .replace(/`([^`]+)`/g, '$1') // Remove backticks but keep content
          .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove markdown links but keep text
          .replace(/_{2,}/g, '') // Remove multiple underscores
          .replace(/_([^_]+)_/g, '$1') // Remove italic underscores but keep content
          .replace(/~~([^~]+)~~/g, '$1') // Remove strikethrough but keep content
          .replace(/^\s*>\s+/gm, '') // Remove blockquotes
          .replace(/^\s*\|\s*/gm, '') // Remove table formatting
          .replace(/\s+/g, ' ') // Normalize whitespace
          .trim();
        
        return processedText;
      }
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const handleActionClick = (action: RecentAction) => {
    // Mark notification as read and remove it from the list
    handleNotificationRead(action.id);
    
    if (action.link) {
      window.location.href = action.link;
      onClose();
    }
  };

  // Clear all notifications function
  const handleClearAll = () => {
    // Mark all current notifications as read
    const allCurrentIds = actions.map(action => action.id);
    setReadNotifications(prev => {
      const newSet = new Set([...Array.from(prev), ...allCurrentIds]);
      return newSet;
    });
    
    setActions([]);
    setAISummary(null);
    
    // Clear localStorage as well to reset everything
    if (typeof window !== 'undefined') {
      localStorage.removeItem('readNotifications');
    }
    
    if (onClearAll) {
      onClearAll();
    }
  };

  // Mark all as read and remove them from the list
  const handleMarkAllRead = () => {
    // Mark all current notifications as read
    const allCurrentIds = actions.map(action => action.id);
    setReadNotifications(prev => {
      const newSet = new Set([...Array.from(prev), ...allCurrentIds]);
      return newSet;
    });
    
    setActions([]); // Remove all notifications from the list
    onMarkAllRead(); // Update the parent component
  };

  // Mark individual notification as read and remove it
  const handleNotificationRead = (notificationId: string) => {
    setActions(prev => prev.filter(action => action.id !== notificationId));
    setReadNotifications(prev => {
      const newSet = new Set(prev);
      newSet.add(notificationId);
      return newSet;
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-25 z-40 transition-opacity" />
      
      {/* Drawer */}
      <div
        ref={drawerRef}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-drawer-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-[#2A3990] text-white flex-shrink-0">
          <div className="flex items-center space-x-3">
            <h2 id="notification-drawer-title" className="text-lg font-semibold">
              Notifications
            </h2>
            {unreadCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500 text-white">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* Clear All Button */}
            {actions.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-1 rounded-md hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-white"
                aria-label="Clear all notifications"
                title="Clear all notifications"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 rounded-md hover:bg-[#1e2a6a] focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Close notifications"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50 flex-shrink-0">
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'notifications'
                ? 'text-[#2A3990] border-b-2 border-[#2A3990] bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'chat'
                ? 'text-[#2A3990] border-b-2 border-[#2A3990] bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            AI Assistant
          </button>
          <button
            onClick={() => setActiveTab('push-settings')}
            className={`flex-1 px-4 py-3 text-sm font-medium ${
              activeTab === 'push-settings'
                ? 'text-[#2A3990] border-b-2 border-[#2A3990] bg-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Push Settings
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'notifications' && (
            <div className="space-y-4">
              {/* AI Summary Section */}
              {aiSummary && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">AI Insights</h3>
                      
                      {/* Parse and format the summary with better structure */}
                      <div className="text-sm text-gray-700 space-y-3">
                        {aiSummary.summary.split('###').map((section, index) => {
                          if (index === 0) return null; // Skip empty first element
                          
                          const lines = section.trim().split('\n');
                          const title = lines[0]?.trim();
                          const content = lines.slice(1).join('\n').trim();
                          
                          if (!title || !content) return null;
                          
                          return (
                            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                              <h4 className="font-semibold text-gray-900 text-xs uppercase tracking-wide mb-2 text-blue-700">
                                {title}
                              </h4>
                              <div className="text-sm text-gray-700 leading-relaxed">
                                {content.split('\n').map((line, lineIndex) => {
                                  if (line.trim() === '') return null;
                                  
                                  return (
                                    <p key={lineIndex} className="mb-1">
                                      {formatMessageContent(line)}
                                    </p>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Quick Stats */}
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-3 bg-white rounded-lg border border-gray-200 shadow-sm">
                          <div className="font-bold text-lg text-gray-900">{aiSummary.analysis.totalIncidents}</div>
                          <div className="text-gray-600 font-medium">Total</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-orange-200 shadow-sm">
                          <div className="font-bold text-lg text-orange-600">{aiSummary.analysis.openIncidents}</div>
                          <div className="text-gray-600 font-medium">Open</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border border-red-200 shadow-sm">
                          <div className="font-bold text-lg text-red-600">{aiSummary.analysis.highPriorityIncidents}</div>
                          <div className="text-gray-600 font-medium">High Priority</div>
                        </div>
                      </div>

                      {/* Urgent Alerts */}
                      {aiSummary.analysis.urgentAlerts.length > 0 && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-red-600">⚠️</span>
                            <span className="text-sm font-semibold text-red-800">Urgent Alerts</span>
                          </div>
                          <div className="space-y-1">
                            {aiSummary.analysis.urgentAlerts.slice(0, 3).map((alert, index) => (
                              <div key={index} className="text-sm text-red-700 leading-relaxed">
                                • {alert}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="mt-3 text-xs text-gray-500 flex items-center space-x-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Updated {formatTimestamp(aiSummary.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="p-8 text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#2A3990]"></div>
                  <p className="mt-2 text-sm text-gray-600">Loading notifications...</p>
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-md m-4">
                  <p className="text-sm text-red-700">{error}</p>
                  <button
                    onClick={fetchNotificationData}
                    className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {/* Recent Actions */}
              {!loading && !error && (
                <div className="divide-y divide-gray-200">
                  {actions.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5zm0 0V3" />
                      </svg>
                      <div className="mt-4">
                        <h3 className="text-sm font-medium text-gray-900">No notifications yet</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          When incidents are created or updated, you'll see them here.
                        </p>
                      </div>
                    </div>
                  ) : (
                    actions.map((action) => (
                      <div
                        key={action.id}
                        onClick={() => handleActionClick(action)}
                        className={`p-4 hover:bg-gray-50 transition-colors duration-150 ${
                          action.link ? 'cursor-pointer' : ''
                        } ${getPriorityColor(action.priority)} border-l-4`}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0">
                            <span className="text-lg" role="img" aria-label={action.type}>
                              {action.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-medium text-gray-900 truncate">
                                {action.title}
                              </h4>
                              <span className="text-xs text-gray-500 ml-2 flex-shrink-0">
                                {formatTimestamp(action.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {action.description}
                            </p>
                            {action.userName && (
                              <p className="text-xs text-gray-500 mt-1">
                                by {action.userName}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

            </div>
          )}

          {/* Chat Tab - AI Assistant */}
          {activeTab === 'chat' && (
            <AIChat isVisible={activeTab === 'chat'} />
          )}

          {/* Push Settings Tab */}
          {activeTab === 'push-settings' && (
            <div className="p-4 space-y-6">
              {/* Push Notification Status */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notification Status</h3>
                
                {pushLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#2A3990]"></div>
                    <span className="ml-2 text-sm text-gray-600">Loading...</span>
                  </div>
                ) : pushError ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">{pushError}</p>
                  </div>
                ) : pushStatus ? (
                  <div className="space-y-4">
                    {/* Support Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Browser Support:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pushStatus.supported 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {pushStatus.supported ? 'Supported' : 'Not Supported'}
                      </span>
                    </div>

                    {/* Permission Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Permission:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pushStatus.permission === 'granted' 
                          ? 'bg-green-100 text-green-800'
                          : pushStatus.permission === 'denied'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {pushStatus.permission === 'granted' ? 'Granted' : 
                         pushStatus.permission === 'denied' ? 'Denied' : 'Default'}
                      </span>
                    </div>

                    {/* Subscription Status */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Subscription:</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        pushStatus.subscribed 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {pushStatus.subscribed ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-500">
                    <p>Click "Check Status" to load push notification information</p>
                  </div>
                )}
              </div>

              {/* Push Notification Controls */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Push Notification Controls</h3>
                
                <div className="space-y-3">
                  {/* Check Status Button */}
                  <button
                    onClick={loadPushNotificationStatus}
                    disabled={pushLoading}
                    className="w-full px-4 py-2 text-sm font-medium text-[#2A3990] bg-white border border-[#2A3990] rounded-md hover:bg-[#2A3990] hover:text-white transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pushLoading ? 'Loading...' : 'Check Status'}
                  </button>

                  {/* Request Permission Button */}
                  {pushStatus && pushStatus.permission === 'default' && (
                    <button
                      onClick={requestPushPermission}
                      disabled={pushLoading}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-blue-600 rounded-md hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pushLoading ? 'Requesting...' : 'Request Permission'}
                    </button>
                  )}

                  {/* Subscribe/Unsubscribe Button */}
                  {pushStatus && pushStatus.permission === 'granted' && (
                    <button
                      onClick={pushStatus.subscribed ? unsubscribeFromPush : subscribeToPush}
                      disabled={pushLoading}
                      className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed ${
                        pushStatus.subscribed
                          ? 'text-red-700 bg-white border border-red-700 hover:bg-red-700 hover:text-white'
                          : 'text-green-700 bg-white border border-green-700 hover:bg-green-700 hover:text-white'
                      }`}
                    >
                      {pushLoading ? 'Processing...' : 
                       pushStatus.subscribed ? 'Unsubscribe' : 'Subscribe'}
                    </button>
                  )}

                  {/* Test Notification Button */}
                  {pushStatus && pushStatus.subscribed && (
                    <button
                      onClick={sendTestNotification}
                      disabled={pushLoading}
                      className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-purple-600 rounded-md hover:bg-purple-700 transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {pushLoading ? 'Sending...' : 'Send Test Notification'}
                    </button>
                  )}
                </div>
              </div>

              {/* Push Notification Preferences */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Incident Alerts</p>
                      <p className="text-xs text-gray-500">Get notified when new incidents are created</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">High Priority Alerts</p>
                      <p className="text-xs text-gray-500">Urgent notifications for critical incidents</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">System Updates</p>
                      <p className="text-xs text-gray-500">Notifications about app updates and maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Help Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">How Push Notifications Work</h4>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Push notifications work even when the app is closed</li>
                  <li>• You'll receive alerts for new incidents and updates</li>
                  <li>• Click on notifications to open the relevant page</li>
                  <li>• You can manage preferences in your browser settings</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer - Mark All Read Button */}
        {!loading && actions.length > 0 && unreadCount > 0 && activeTab === 'notifications' && (
          <div className="p-4 border-t border-gray-200 bg-white flex-shrink-0">
            <button
              onClick={handleMarkAllRead}
              className="w-full px-4 py-2 text-sm font-medium text-[#2A3990] bg-white border border-[#2A3990] rounded-md hover:bg-[#2A3990] hover:text-white transition-colors duration-150"
            >
              Mark All as Read
            </button>
          </div>
        )}
      </div>
    </>
  );
} 