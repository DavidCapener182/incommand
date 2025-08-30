// Logging utility for consistent logging across the application
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogContext {
  component?: string;
  action?: string;
  userId?: string;
  eventId?: string;
  [key: string]: any;
}

class Logger {
  private level: LogLevel;
  private isProduction: boolean;

  constructor() {
    this.isProduction = process.env.NODE_ENV === 'production';
    // In production, only show ERROR and WARN
    // In development, show all levels
    this.level = this.isProduction ? LogLevel.WARN : LogLevel.DEBUG;
  }

  private formatMessage(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` [${Object.entries(context).map(([k, v]) => `${k}:${v}`).join(', ')}]` : '';
    return `[${timestamp}] ${level}${contextStr}: ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, error?: Error | any, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.ERROR)) return;
    
    const formattedMessage = this.formatMessage('ERROR', message, context);
    console.error(formattedMessage, error || '');
  }

  warn(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.WARN)) return;
    
    const formattedMessage = this.formatMessage('WARN', message, context);
    console.warn(formattedMessage);
  }

  info(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.INFO)) return;
    
    const formattedMessage = this.formatMessage('INFO', message, context);
    console.info(formattedMessage);
  }

  debug(message: string, context?: LogContext): void {
    if (!this.shouldLog(LogLevel.DEBUG)) return;
    
    const formattedMessage = this.formatMessage('DEBUG', message, context);
    console.debug(formattedMessage);
  }

  // Special method for development-only logs that should never appear in production
  dev(message: string, context?: LogContext): void {
    if (this.isProduction) return;
    
    const formattedMessage = this.formatMessage('DEV', message, context);
    console.log(formattedMessage);
  }

  // Method to log API responses in a consistent way
  apiResponse(endpoint: string, status: number, responseTime?: number, context?: LogContext): void {
    const message = `API ${endpoint} - Status: ${status}${responseTime ? `, Time: ${responseTime}ms` : ''}`;
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    
    if (level === LogLevel.ERROR) {
      this.error(message, undefined, { ...context, endpoint, status, responseTime });
    } else {
      this.info(message, { ...context, endpoint, status, responseTime });
    }
  }

  // Method to log database operations
  db(operation: string, table: string, success: boolean, error?: any, context?: LogContext): void {
    const message = `DB ${operation} on ${table} - ${success ? 'SUCCESS' : 'FAILED'}`;
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    
    if (level === LogLevel.ERROR) {
      this.error(message, error, { ...context, operation, table });
    } else {
      this.info(message, { ...context, operation, table });
    }
  }
}

// Export a singleton instance
export const logger = new Logger();

// Export convenience functions
export const logError = (message: string, error?: Error | any, context?: LogContext) => 
  logger.error(message, error, context);

export const logWarn = (message: string, context?: LogContext) => 
  logger.warn(message, context);

export const logInfo = (message: string, context?: LogContext) => 
  logger.info(message, context);

export const logDebug = (message: string, context?: LogContext) => 
  logger.debug(message, context);

export const logDev = (message: string, context?: LogContext) => 
  logger.dev(message, context);
