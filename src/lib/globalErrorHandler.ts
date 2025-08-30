import { logger } from './logger'

/**
 * Global Error Handler for Unhandled Errors and Promise Rejections
 * 
 * This module provides global error handling for:
 * - Unhandled JavaScript errors
 * - Unhandled promise rejections
 * - Network errors
 * - Resource loading errors
 */

interface GlobalErrorContext {
  type: 'unhandled' | 'promise' | 'network' | 'resource';
  url?: string;
  userAgent?: string;
  timestamp: Date;
}

class GlobalErrorHandler {
  private isInitialized = false;

  /**
   * Initialize global error handling
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Handle unhandled JavaScript errors
    window.addEventListener('error', this.handleUnhandledError.bind(this));

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));

    // Handle network errors
    window.addEventListener('offline', this.handleNetworkError.bind(this));
    window.addEventListener('online', this.handleNetworkRecovery.bind(this));

    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError.bind(this), true);

    // Handle console errors (for development)
    if (process.env.NODE_ENV === 'development') {
      this.interceptConsoleErrors();
    }

    this.isInitialized = true;
    logger.info('Global error handler initialized', { component: 'GlobalErrorHandler', action: 'initialize' });
  }

  /**
   * Handle unhandled JavaScript errors
   */
  private handleUnhandledError(event: ErrorEvent): void {
    const context: GlobalErrorContext = {
      type: 'unhandled',
      url: event.filename,
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    logger.error('Unhandled JavaScript error', event.error || new Error(event.message), {
      component: 'GlobalErrorHandler',
      action: 'handleUnhandledError',
      context,
      errorDetails: {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error
      }
    });

    // Prevent default browser error handling
    event.preventDefault();
  }

  /**
   * Handle unhandled promise rejections
   */
  private handleUnhandledRejection(event: PromiseRejectionEvent): void {
    const context: GlobalErrorContext = {
      type: 'promise',
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));

    logger.error('Unhandled promise rejection', error, {
      component: 'GlobalErrorHandler',
      action: 'handleUnhandledRejection',
      context,
      promiseDetails: {
        reason: event.reason,
        promise: event.promise
      }
    });

    // Prevent default browser error handling
    event.preventDefault();
  }

  /**
   * Handle network errors
   */
  private handleNetworkError(): void {
    const context: GlobalErrorContext = {
      type: 'network',
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    logger.warn('Network connection lost', {
      component: 'GlobalErrorHandler',
      action: 'handleNetworkError',
      context
    });

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('networkStatusChanged', { detail: { online: false } }));
  }

  /**
   * Handle network recovery
   */
  private handleNetworkRecovery(): void {
    const context: GlobalErrorContext = {
      type: 'network',
      userAgent: navigator.userAgent,
      timestamp: new Date()
    };

    logger.info('Network connection restored', {
      component: 'GlobalErrorHandler',
      action: 'handleNetworkRecovery',
      context
    });

    // Dispatch custom event for UI updates
    window.dispatchEvent(new CustomEvent('networkStatusChanged', { detail: { online: true } }));
  }

  /**
   * Handle resource loading errors
   */
  private handleResourceError(event: ErrorEvent): void {
    // Only handle resource loading errors (not JavaScript errors)
    if (event.target && event.target !== window) {
      const target = event.target as HTMLElement;
      const context: GlobalErrorContext = {
        type: 'resource',
        url: target instanceof HTMLImageElement ? target.src : 
             target instanceof HTMLScriptElement ? target.src :
             target instanceof HTMLLinkElement ? target.href : undefined,
        userAgent: navigator.userAgent,
        timestamp: new Date()
      };

      logger.warn('Resource loading error', {
        component: 'GlobalErrorHandler',
        action: 'handleResourceError',
        context,
        resourceDetails: {
          tagName: target.tagName,
          src: target instanceof HTMLImageElement ? target.src : 
               target instanceof HTMLScriptElement ? target.src :
               target instanceof HTMLLinkElement ? target.href : undefined,
          error: event.error
        }
      });
    }
  }

  /**
   * Intercept console errors in development
   */
  private interceptConsoleErrors(): void {
    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      logger.error('Console error intercepted', new Error(args.join(' ')), {
        component: 'GlobalErrorHandler',
        action: 'interceptConsoleErrors',
        consoleArgs: args
      });
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      logger.warn('Console warning intercepted', {
        component: 'GlobalErrorHandler',
        action: 'interceptConsoleErrors',
        consoleArgs: args
      });
      originalWarn.apply(console, args);
    };
  }

  /**
   * Cleanup global error handlers
   */
  cleanup(): void {
    if (!this.isInitialized) {
      return;
    }

    // Remove event listeners
    window.removeEventListener('error', this.handleUnhandledError.bind(this));
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
    window.removeEventListener('offline', this.handleNetworkError.bind(this));
    window.removeEventListener('online', this.handleNetworkRecovery.bind(this));
    window.removeEventListener('error', this.handleResourceError.bind(this), true);

    this.isInitialized = false;
    logger.info('Global error handler cleaned up', { component: 'GlobalErrorHandler', action: 'cleanup' });
  }
}

// Create singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

// Auto-initialize when module is imported
if (typeof window !== 'undefined') {
  globalErrorHandler.initialize();
}

export default globalErrorHandler;
