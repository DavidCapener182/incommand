import { logger } from './logger'

/**
 * Centralized Error Handling Service for PWA Components
 * 
 * This service provides consistent error handling across all PWA components
 * including logging, user notifications, and error recovery mechanisms.
 */

export interface ErrorContext {
  component: string;
  action: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export interface ErrorLog {
  id: string;
  timestamp: Date;
  error: Error;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  resolution?: string;
}

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';

class ErrorHandler {
  private errorLogs: ErrorLog[] = [];
  private isOnline: boolean = navigator.onLine;
  private pendingErrors: ErrorLog[] = [];

  constructor() {
    this.initializeOnlineStatus();
  }

  /**
   * Initialize online status monitoring
   */
  private initializeOnlineStatus(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingErrors();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Handle an error with consistent logging and user notification
   */
  async handleError(
    error: Error,
    context: ErrorContext,
    severity: ErrorSeverity = 'medium',
    showUserNotification: boolean = true
  ): Promise<void> {
    const errorLog: ErrorLog = {
      id: this.generateErrorId(),
      timestamp: new Date(),
      error,
      context,
      severity,
      resolved: false
    };

    // Log the error
    this.logError(errorLog);

    // Store error for potential sync
    this.errorLogs.push(errorLog);

    // Show user notification if requested
    if (showUserNotification) {
      this.showUserNotification(errorLog);
    }

    // Attempt to sync error log if online
    if (this.isOnline) {
      await this.syncErrorLog(errorLog);
    } else {
      this.pendingErrors.push(errorLog);
    }

    // Handle critical errors
    if (severity === 'critical') {
      this.handleCriticalError(errorLog);
    }
  }

  /**
   * Generate unique error ID
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log error to console and local storage
   */
  private logError(errorLog: ErrorLog): void {
    const logMessage = `[${errorLog.severity.toUpperCase()}] ${errorLog.context.component}.${errorLog.context.action}: ${errorLog.error.message}`;
    
    switch (errorLog.severity) {
      case 'low':
        logger.info(logMessage, { component: 'ErrorHandler', action: 'logError', severity: 'low' });
        break;
      case 'medium':
        logger.warn(logMessage, { component: 'ErrorHandler', action: 'logError', severity: 'medium' });
        break;
      case 'high':
      case 'critical':
        logger.error(logMessage, errorLog.error, { component: 'ErrorHandler', action: 'logError', severity: errorLog.severity });
        break;
    }

    // Store in local storage for persistence
    this.storeErrorLocally(errorLog);
  }

  /**
   * Store error in local storage
   */
  private storeErrorLocally(errorLog: ErrorLog): void {
    try {
      const storedErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      storedErrors.push({
        ...errorLog,
        error: {
          name: errorLog.error.name,
          message: errorLog.error.message,
          stack: errorLog.error.stack
        }
      });

      // Keep only last 100 errors
      if (storedErrors.length > 100) {
        storedErrors.splice(0, storedErrors.length - 100);
      }

      localStorage.setItem('errorLogs', JSON.stringify(storedErrors));
    } catch (error) {
      console.error('Failed to store error locally:', error);
    }
  }

  /**
   * Show user notification for error
   */
  private showUserNotification(errorLog: ErrorLog): void {
    const message = this.getUserFriendlyMessage(errorLog);
    
    // Dispatch custom event for notification system
    const event = new CustomEvent('showErrorNotification', {
      detail: {
        message,
        severity: errorLog.severity,
        errorId: errorLog.id
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Get user-friendly error message
   */
  private getUserFriendlyMessage(errorLog: ErrorLog): string {
    const { component, action } = errorLog.context;
    
    switch (component) {
      case 'PushNotificationManager':
        return 'Unable to manage notifications. Please check your browser settings.';
      case 'OfflineSync':
        return 'Unable to sync data. Changes will be saved when you\'re back online.';
      case 'IncidentCreation':
        return 'Unable to create incident. Please try again or contact support.';
      case 'CameraCapture':
        return 'Unable to access camera. Please check permissions and try again.';
      default:
        return 'An error occurred. Please try again or contact support if the problem persists.';
    }
  }

  /**
   * Handle critical errors
   */
  private handleCriticalError(errorLog: ErrorLog): void {
    // Log critical error to external service
    this.logToExternalService(errorLog);
    
    // Show critical error modal
    const event = new CustomEvent('showCriticalError', {
      detail: {
        error: errorLog.error,
        context: errorLog.context,
        errorId: errorLog.id
      }
    });
    
    window.dispatchEvent(event);
  }

  /**
   * Log error to external service
   */
  private async logToExternalService(errorLog: ErrorLog): Promise<void> {
    try {
      const response = await fetch('/api/errors/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          errorId: errorLog.id,
          timestamp: errorLog.timestamp.toISOString(),
          error: {
            name: errorLog.error.name,
            message: errorLog.error.message,
            stack: errorLog.error.stack
          },
          context: errorLog.context,
          severity: errorLog.severity,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });

      if (!response.ok) {
        console.error('Failed to log error to external service');
      }
    } catch (error) {
      console.error('Error logging to external service:', error);
    }
  }

  /**
   * Sync error log to server
   */
  private async syncErrorLog(errorLog: ErrorLog): Promise<void> {
    try {
      const response = await fetch('/api/errors/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorLog)
      });

      if (response.ok) {
        errorLog.resolved = true;
        errorLog.resolution = 'synced';
      }
    } catch (error) {
      console.error('Failed to sync error log:', error);
    }
  }

  /**
   * Process pending errors when back online
   */
  private async processPendingErrors(): Promise<void> {
    for (const errorLog of this.pendingErrors) {
      await this.syncErrorLog(errorLog);
    }
    this.pendingErrors = [];
  }

  /**
   * Get error logs
   */
  getErrorLogs(): ErrorLog[] {
    return [...this.errorLogs];
  }

  /**
   * Clear resolved errors
   */
  clearResolvedErrors(): void {
    this.errorLogs = this.errorLogs.filter(log => !log.resolved);
    
    // Also clear from local storage
    try {
      const storedErrors = JSON.parse(localStorage.getItem('errorLogs') || '[]');
      const unresolvedErrors = storedErrors.filter((error: any) => !error.resolved);
      localStorage.setItem('errorLogs', JSON.stringify(unresolvedErrors));
    } catch (error) {
      console.error('Failed to clear resolved errors from storage:', error);
    }
  }

  /**
   * Mark error as resolved
   */
  markErrorResolved(errorId: string, resolution: string): void {
    const errorLog = this.errorLogs.find(log => log.id === errorId);
    if (errorLog) {
      errorLog.resolved = true;
      errorLog.resolution = resolution;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    resolved: number;
    unresolved: number;
    bySeverity: Record<ErrorSeverity, number>;
    byComponent: Record<string, number>;
  } {
    const stats = {
      total: this.errorLogs.length,
      resolved: this.errorLogs.filter(log => log.resolved).length,
      unresolved: this.errorLogs.filter(log => !log.resolved).length,
      bySeverity: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      },
      byComponent: {} as Record<string, number>
    };

    this.errorLogs.forEach(log => {
      stats.bySeverity[log.severity]++;
      stats.byComponent[log.context.component] = (stats.byComponent[log.context.component] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const errorHandler = new ErrorHandler();

// Export utility functions
export const handleError = (
  error: Error,
  context: ErrorContext,
  severity?: ErrorSeverity,
  showUserNotification?: boolean
) => errorHandler.handleError(error, context, severity, showUserNotification);

export const getErrorLogs = () => errorHandler.getErrorLogs();
export const clearResolvedErrors = () => errorHandler.clearResolvedErrors();
export const markErrorResolved = (errorId: string, resolution: string) => 
  errorHandler.markErrorResolved(errorId, resolution);
export const getErrorStats = () => errorHandler.getErrorStats();

export default errorHandler;
