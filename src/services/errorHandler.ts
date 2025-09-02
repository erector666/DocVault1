interface ErrorContext {
  component?: string;
  action?: string;
  userId?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  id: string;
  message: string;
  stack?: string;
  context: ErrorContext;
  severity: 'low' | 'medium' | 'high' | 'critical';
  resolved: boolean;
  createdAt: number;
}

class ErrorHandler {
  private errors: ErrorReport[] = [];
  private maxErrors = 100;
  private errorCallbacks: Array<(error: ErrorReport) => void> = [];

  constructor() {
    // Global error handlers
    window.addEventListener('error', this.handleGlobalError.bind(this));
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
  }

  private handleGlobalError(event: ErrorEvent) {
    this.logError(event.error || new Error(event.message), {
      component: 'Global',
      action: 'Runtime Error',
      metadata: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      }
    }, 'high');
  }

  private handleUnhandledRejection(event: PromiseRejectionEvent) {
    const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
    this.logError(error, {
      component: 'Global',
      action: 'Unhandled Promise Rejection'
    }, 'high');
  }

  logError(
    error: Error | string,
    context: ErrorContext = {},
    severity: ErrorReport['severity'] = 'medium'
  ): string {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    const errorReport: ErrorReport = {
      id: this.generateErrorId(),
      message: errorObj.message,
      stack: errorObj.stack,
      context: {
        ...context,
        timestamp: Date.now()
      },
      severity,
      resolved: false,
      createdAt: Date.now()
    };

    this.errors.unshift(errorReport);
    
    // Keep only the most recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(0, this.maxErrors);
    }

    // Log to console based on severity
    this.logToConsole(errorReport);

    // Notify callbacks
    this.errorCallbacks.forEach(callback => {
      try {
        callback(errorReport);
      } catch (callbackError) {
        console.error('Error in error callback:', callbackError);
      }
    });

    // Send to external service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToExternalService(errorReport);
    }

    return errorReport.id;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private logToConsole(error: ErrorReport) {
    const logMethod = this.getConsoleMethod(error.severity);
    const contextStr = error.context.component 
      ? `[${error.context.component}${error.context.action ? `:${error.context.action}` : ''}]`
      : '';
    
    logMethod(`${contextStr} ${error.message}`, {
      id: error.id,
      stack: error.stack,
      context: error.context
    });
  }

  private getConsoleMethod(severity: ErrorReport['severity']) {
    switch (severity) {
      case 'critical':
      case 'high':
        return console.error;
      case 'medium':
        return console.warn;
      case 'low':
        return console.info;
      default:
        return console.log;
    }
  }

  private async sendToExternalService(error: ErrorReport) {
    try {
      // In a real implementation, send to error tracking service
      // await fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(error)
      // });
      
      console.log('Error would be sent to external service:', error.id);
    } catch (sendError) {
      console.error('Failed to send error to external service:', sendError);
    }
  }

  getErrors(filters?: {
    severity?: ErrorReport['severity'];
    component?: string;
    resolved?: boolean;
    limit?: number;
  }): ErrorReport[] {
    let filteredErrors = [...this.errors];

    if (filters) {
      if (filters.severity) {
        filteredErrors = filteredErrors.filter(e => e.severity === filters.severity);
      }
      if (filters.component) {
        filteredErrors = filteredErrors.filter(e => e.context.component === filters.component);
      }
      if (filters.resolved !== undefined) {
        filteredErrors = filteredErrors.filter(e => e.resolved === filters.resolved);
      }
      if (filters.limit) {
        filteredErrors = filteredErrors.slice(0, filters.limit);
      }
    }

    return filteredErrors;
  }

  resolveError(errorId: string): boolean {
    const error = this.errors.find(e => e.id === errorId);
    if (error) {
      error.resolved = true;
      return true;
    }
    return false;
  }

  clearErrors(filters?: { resolved?: boolean; olderThan?: number }) {
    if (!filters) {
      this.errors = [];
      return;
    }

    this.errors = this.errors.filter(error => {
      if (filters.resolved !== undefined && error.resolved !== filters.resolved) {
        return true; // Keep this error
      }
      if (filters.olderThan && error.createdAt > Date.now() - filters.olderThan) {
        return true; // Keep this error
      }
      return false; // Remove this error
    });
  }

  onError(callback: (error: ErrorReport) => void): () => void {
    this.errorCallbacks.push(callback);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorCallbacks.indexOf(callback);
      if (index > -1) {
        this.errorCallbacks.splice(index, 1);
      }
    };
  }

  getErrorStats() {
    const total = this.errors.length;
    const resolved = this.errors.filter(e => e.resolved).length;
    const unresolved = total - resolved;
    
    const bySeverity = this.errors.reduce((acc, error) => {
      acc[error.severity] = (acc[error.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byComponent = this.errors.reduce((acc, error) => {
      const component = error.context.component || 'Unknown';
      acc[component] = (acc[component] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      resolved,
      unresolved,
      bySeverity,
      byComponent
    };
  }
}

// Singleton instance
export const errorHandler = new ErrorHandler();

// React hook for error handling
export const useErrorHandler = () => {
  return {
    logError: (error: Error | string, context?: ErrorContext, severity?: ErrorReport['severity']) =>
      errorHandler.logError(error, context, severity),
    getErrors: (filters?: Parameters<typeof errorHandler.getErrors>[0]) =>
      errorHandler.getErrors(filters),
    resolveError: (errorId: string) => errorHandler.resolveError(errorId),
    clearErrors: (filters?: Parameters<typeof errorHandler.clearErrors>[0]) =>
      errorHandler.clearErrors(filters),
    onError: (callback: (error: ErrorReport) => void) => errorHandler.onError(callback),
    getErrorStats: () => errorHandler.getErrorStats()
  };
};

// Utility functions for common error scenarios
export const handleApiError = (error: any, context: ErrorContext = {}) => {
  const message = error?.response?.data?.message || error?.message || 'API request failed';
  const statusCode = error?.response?.status;
  
  errorHandler.logError(new Error(message), {
    ...context,
    action: 'API Call',
    metadata: {
      statusCode,
      url: error?.config?.url,
      method: error?.config?.method
    }
  }, statusCode >= 500 ? 'high' : 'medium');
};

export const handleUploadError = (error: any, fileName: string, context: ErrorContext = {}) => {
  errorHandler.logError(error, {
    ...context,
    action: 'File Upload',
    metadata: { fileName }
  }, 'medium');
};

export const handleAuthError = (error: any, context: ErrorContext = {}) => {
  errorHandler.logError(error, {
    ...context,
    action: 'Authentication',
  }, 'high');
};

export const handleValidationError = (errors: string[], context: ErrorContext = {}) => {
  const message = `Validation failed: ${errors.join(', ')}`;
  errorHandler.logError(new Error(message), {
    ...context,
    action: 'Validation',
    metadata: { validationErrors: errors }
  }, 'low');
};
