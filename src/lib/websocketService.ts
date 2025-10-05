import { supabase } from './supabase';
import { logger } from './logger';

export interface WebSocketMessage {
  type:
    | 'incident-update'
    | 'status-change'
    | 'new-incident'
    | 'user-activity'
    | 'location-update'
    | 'risk_metrics_update'
    | 'incident_summary_update';
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface IncidentUpdate {
  id: string;
  status: 'open' | 'in-progress' | 'closed' | 'resolved';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: string;
  updatedBy: string;
  updateMessage?: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

export interface UserActivity {
  userId: string;
  userName: string;
  action: string;
  target: string;
  timestamp: number;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
}

class WebSocketService {
  private channels: Map<string, any> = new Map();
  private messageHandlers: Map<string, ((message: WebSocketMessage) => void)[]> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  // Subscribe to a channel
  subscribe(channelName: string, handlers: ((message: WebSocketMessage) => void)[]) {
    if (this.channels.has(channelName)) {
      // Add handlers to existing channel
      const existingHandlers = this.messageHandlers.get(channelName) || [];
      this.messageHandlers.set(channelName, [...existingHandlers, ...handlers]);
      return;
    }

    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: channelName,
        },
        broadcast: {
          self: true,
        },
      },
    });

    // Set up message handlers
    this.messageHandlers.set(channelName, handlers);

    // Handle all broadcast events
    channel.on('broadcast', { event: '*' }, ({ event, payload, user_id }) => {
      const message: WebSocketMessage = {
        type: event as any,
        payload,
        timestamp: Date.now(),
        userId: user_id
      };

      const handlers = this.messageHandlers.get(channelName) || [];
      handlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          logger.error('Error handling WebSocket message', error, { channelName, event, payload });
        }
      });
    });

    // Handle connection status
    channel.subscribe((status) => {
      logger.info('WebSocket channel status', { channelName, status });
      
      if (status === 'SUBSCRIBED') {
        this.reconnectAttempts.set(channelName, 0);
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        this.handleReconnect(channelName);
      }
    });

    this.channels.set(channelName, channel);
  }

  // Unsubscribe from a channel
  unsubscribe(channelName: string) {
    const channel = this.channels.get(channelName);
    if (channel) {
      channel.unsubscribe();
      this.channels.delete(channelName);
      this.messageHandlers.delete(channelName);
      this.reconnectAttempts.delete(channelName);
    }
  }

  // Send a message to a channel
  send(channelName: string, message: Omit<WebSocketMessage, 'timestamp'>) {
    const channel = this.channels.get(channelName);
    if (!channel) {
      logger.warn(`Channel ${channelName} not found, cannot send message`);
      return false;
    }

    try {
      channel.send({
        type: 'broadcast',
        event: message.type,
        payload: message.payload
      });
      return true;
    } catch (error) {
      logger.error('Error sending WebSocket message', error, { channelName, message });
      return false;
    }
  }

  // Send incident update
  sendIncidentUpdate(channelName: string, update: IncidentUpdate) {
    return this.send(channelName, {
      type: 'incident-update',
      payload: update
    });
  }

  // Send user activity
  sendUserActivity(channelName: string, activity: UserActivity) {
    return this.send(channelName, {
      type: 'user-activity',
      payload: activity
    });
  }

  // Send location update
  sendLocationUpdate(channelName: string, location: { latitude: number; longitude: number; accuracy: number }) {
    return this.send(channelName, {
      type: 'location-update',
      payload: location
    });
  }

  // Send incident summary update
  sendIncidentSummaryUpdate(channelName: string, summary: { open: number; in_progress: number; closed: number; total: number; timestamp?: string }) {
    return this.send(channelName, {
      type: 'incident_summary_update',
      payload: summary
    });
  }

  // Handle reconnection
  private handleReconnect(channelName: string) {
    const attempts = this.reconnectAttempts.get(channelName) || 0;
    
    if (attempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts reached for channel ${channelName}`);
      return;
    }

    this.reconnectAttempts.set(channelName, attempts + 1);
    
    setTimeout(() => {
      logger.info(`Attempting to reconnect to channel ${channelName} (attempt ${attempts + 1})`);
      
      const handlers = this.messageHandlers.get(channelName) || [];
      this.unsubscribe(channelName);
      this.subscribe(channelName, handlers);
    }, this.reconnectDelay * Math.pow(2, attempts)); // Exponential backoff
  }

  // Get connection status for a channel
  isConnected(channelName: string): boolean {
    const channel = this.channels.get(channelName);
    return channel?.subscription?.state === 'SUBSCRIBED';
  }

  // Get all active channels
  getActiveChannels(): string[] {
    return Array.from(this.channels.keys());
  }

  // Cleanup all connections
  cleanup() {
    this.channels.forEach((channel, channelName) => {
      this.unsubscribe(channelName);
    });
  }
}

// Create singleton instance
export const websocketService = new WebSocketService();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    websocketService.cleanup();
  });
}

export default websocketService;
