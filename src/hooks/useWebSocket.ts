import { useEffect, useRef, useCallback } from 'react';
import { websocketService, WebSocketMessage } from '@/lib/websocketService';
import { useAuth } from '@/contexts/AuthContext';

interface UseWebSocketOptions {
  channelName: string;
  onMessage?: (message: WebSocketMessage) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  autoReconnect?: boolean;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (type: string, payload: any) => boolean;
  sendIncidentUpdate: (update: any) => boolean;
  sendUserActivity: (activity: any) => boolean;
  sendLocationUpdate: (location: any) => boolean;
  subscribe: (handler: (message: WebSocketMessage) => void) => void;
  unsubscribe: (handler: (message: WebSocketMessage) => void) => void;
}

export const useWebSocket = ({
  channelName,
  onMessage,
  onConnect,
  onDisconnect,
  autoReconnect = true
}: UseWebSocketOptions): UseWebSocketReturn => {
  const { user } = useAuth();
  const handlersRef = useRef<Set<(message: WebSocketMessage) => void>>(new Set());
  const isConnectedRef = useRef(false);

  // Add message handler
  const subscribe = useCallback((handler: (message: WebSocketMessage) => void) => {
    handlersRef.current.add(handler);
    
    // Subscribe to the channel with all current handlers
    const handlers = Array.from(handlersRef.current);
    websocketService.subscribe(channelName, handlers);
  }, [channelName]);

  // Remove message handler
  const unsubscribe = useCallback((handler: (message: WebSocketMessage) => void) => {
    handlersRef.current.delete(handler);
    
    // Re-subscribe with remaining handlers
    const handlers = Array.from(handlersRef.current);
    if (handlers.length === 0) {
      websocketService.unsubscribe(channelName);
    } else {
      websocketService.subscribe(channelName, handlers);
    }
  }, [channelName]);

  // Send message
  const sendMessage = useCallback((type: string, payload: any) => {
    return websocketService.send(channelName, { type: type as any, payload });
  }, [channelName]);

  // Send incident update
  const sendIncidentUpdate = useCallback((update: any) => {
    return websocketService.sendIncidentUpdate(channelName, update);
  }, [channelName]);

  // Send user activity
  const sendUserActivity = useCallback((activity: any) => {
    return websocketService.sendUserActivity(channelName, activity);
  }, [channelName]);

  // Send location update
  const sendLocationUpdate = useCallback((location: any) => {
    return websocketService.sendLocationUpdate(channelName, location);
  }, [channelName]);

  // Initialize connection
  useEffect(() => {
    if (!user) return;

    // Add default message handler if provided
    if (onMessage) {
      handlersRef.current.add(onMessage);
    }

    // Subscribe to the channel
    const handlers = Array.from(handlersRef.current);
    websocketService.subscribe(channelName, handlers);

    // Set up connection monitoring
    const checkConnection = () => {
      const connected = websocketService.isConnected(channelName);
      if (connected !== isConnectedRef.current) {
        isConnectedRef.current = connected;
        if (connected && onConnect) {
          onConnect();
        } else if (!connected && onDisconnect) {
          onDisconnect();
        }
      }
    };

    // Check connection status periodically
    const interval = setInterval(checkConnection, 1000);
    checkConnection(); // Initial check

    return () => {
      clearInterval(interval);
      
      // Remove default message handler
      if (onMessage) {
        handlersRef.current.delete(onMessage);
      }
      
      // Unsubscribe if no handlers remain
      if (handlersRef.current.size === 0) {
        websocketService.unsubscribe(channelName);
      }
    };
  }, [channelName, user, onMessage, onConnect, onDisconnect]);

  return {
    isConnected: isConnectedRef.current,
    sendMessage,
    sendIncidentUpdate,
    sendUserActivity,
    sendLocationUpdate,
    subscribe,
    unsubscribe
  };
};
