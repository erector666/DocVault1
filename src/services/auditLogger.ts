interface AuditEvent {
  id: string;
  userId: string;
  action: string;
  resource: string;
  resourceId?: string;
  timestamp: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
  severity: 'info' | 'warning' | 'error' | 'critical';
  success: boolean;
}

interface AuditQuery {
  userId?: string;
  action?: string;
  resource?: string;
  startDate?: number;
  endDate?: number;
  severity?: AuditEvent['severity'];
  success?: boolean;
  limit?: number;
  offset?: number;
}

class AuditLogger {
  private events: AuditEvent[] = [];
  private maxEvents = 1000;

  constructor() {
    // In production, this would connect to a persistent storage system
  }

  log(event: Omit<AuditEvent, 'id' | 'timestamp'>): string {
    const auditEvent: AuditEvent = {
      ...event,
      id: this.generateEventId(),
      timestamp: Date.now()
    };

    this.events.unshift(auditEvent);

    // Keep only the most recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[AUDIT] ${event.action} on ${event.resource}`, auditEvent);
    }

    // In production, send to audit service
    if (process.env.NODE_ENV === 'production') {
      this.sendToAuditService(auditEvent);
    }

    return auditEvent.id;
  }

  private generateEventId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendToAuditService(event: AuditEvent) {
    try {
      // In a real implementation, send to audit logging service
      // await fetch('/api/audit', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // });
      
      console.log('Audit event would be sent to service:', event.id);
    } catch (error) {
      console.error('Failed to send audit event:', error);
    }
  }

  query(filters: AuditQuery = {}): AuditEvent[] {
    let filteredEvents = [...this.events];

    if (filters.userId) {
      filteredEvents = filteredEvents.filter(e => e.userId === filters.userId);
    }

    if (filters.action) {
      filteredEvents = filteredEvents.filter(e => 
        e.action.toLowerCase().includes(filters.action!.toLowerCase())
      );
    }

    if (filters.resource) {
      filteredEvents = filteredEvents.filter(e => 
        e.resource.toLowerCase().includes(filters.resource!.toLowerCase())
      );
    }

    if (filters.startDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp >= filters.startDate!);
    }

    if (filters.endDate) {
      filteredEvents = filteredEvents.filter(e => e.timestamp <= filters.endDate!);
    }

    if (filters.severity) {
      filteredEvents = filteredEvents.filter(e => e.severity === filters.severity);
    }

    if (filters.success !== undefined) {
      filteredEvents = filteredEvents.filter(e => e.success === filters.success);
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || 50;
    
    return filteredEvents.slice(offset, offset + limit);
  }

  getStats(timeRange?: { start: number; end: number }) {
    let events = this.events;
    
    if (timeRange) {
      events = events.filter(e => 
        e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
      );
    }

    const total = events.length;
    const successful = events.filter(e => e.success).length;
    const failed = total - successful;

    const byAction = events.reduce((acc, event) => {
      acc[event.action] = (acc[event.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byResource = events.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const bySeverity = events.reduce((acc, event) => {
      acc[event.severity] = (acc[event.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const byUser = events.reduce((acc, event) => {
      acc[event.userId] = (acc[event.userId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      successful,
      failed,
      successRate: total > 0 ? successful / total : 0,
      byAction,
      byResource,
      bySeverity,
      byUser
    };
  }

  // Predefined audit methods for common actions
  logDocumentUpload(userId: string, documentId: string, fileName: string, success: boolean, metadata?: any) {
    return this.log({
      userId,
      action: 'DOCUMENT_UPLOAD',
      resource: 'document',
      resourceId: documentId,
      success,
      severity: success ? 'info' : 'error',
      metadata: { fileName, ...metadata }
    });
  }

  logDocumentView(userId: string, documentId: string, documentName: string) {
    return this.log({
      userId,
      action: 'DOCUMENT_VIEW',
      resource: 'document',
      resourceId: documentId,
      success: true,
      severity: 'info',
      metadata: { documentName }
    });
  }

  logDocumentDelete(userId: string, documentId: string, documentName: string, success: boolean) {
    return this.log({
      userId,
      action: 'DOCUMENT_DELETE',
      resource: 'document',
      resourceId: documentId,
      success,
      severity: success ? 'warning' : 'error',
      metadata: { documentName }
    });
  }

  logSearch(userId: string, query: string, resultsCount: number, searchTime: number) {
    return this.log({
      userId,
      action: 'SEARCH_PERFORMED',
      resource: 'search',
      success: true,
      severity: 'info',
      metadata: { query, resultsCount, searchTime }
    });
  }

  logLogin(userId: string, success: boolean, ipAddress?: string, userAgent?: string) {
    return this.log({
      userId,
      action: 'USER_LOGIN',
      resource: 'auth',
      success,
      severity: success ? 'info' : 'warning',
      ipAddress,
      userAgent
    });
  }

  logLogout(userId: string) {
    return this.log({
      userId,
      action: 'USER_LOGOUT',
      resource: 'auth',
      success: true,
      severity: 'info'
    });
  }

  logSecurityEvent(userId: string, event: string, severity: AuditEvent['severity'], metadata?: any) {
    return this.log({
      userId,
      action: 'SECURITY_EVENT',
      resource: 'security',
      success: false,
      severity,
      metadata: { event, ...metadata }
    });
  }

  logSystemError(userId: string, error: string, component: string, metadata?: any) {
    return this.log({
      userId,
      action: 'SYSTEM_ERROR',
      resource: 'system',
      success: false,
      severity: 'error',
      metadata: { error, component, ...metadata }
    });
  }

  logDataExport(userId: string, dataType: string, recordCount: number, success: boolean) {
    return this.log({
      userId,
      action: 'DATA_EXPORT',
      resource: 'data',
      success,
      severity: success ? 'info' : 'error',
      metadata: { dataType, recordCount }
    });
  }

  logConfigChange(userId: string, setting: string, oldValue: any, newValue: any) {
    return this.log({
      userId,
      action: 'CONFIG_CHANGE',
      resource: 'configuration',
      success: true,
      severity: 'warning',
      metadata: { setting, oldValue, newValue }
    });
  }
}

// Singleton instance
export const auditLogger = new AuditLogger();

// React hook for audit logging
export const useAuditLogger = () => {
  return {
    log: (event: Omit<AuditEvent, 'id' | 'timestamp'>) => auditLogger.log(event),
    query: (filters?: AuditQuery) => auditLogger.query(filters),
    getStats: (timeRange?: { start: number; end: number }) => auditLogger.getStats(timeRange),
    
    // Convenience methods
    logDocumentUpload: (userId: string, documentId: string, fileName: string, success: boolean, metadata?: any) =>
      auditLogger.logDocumentUpload(userId, documentId, fileName, success, metadata),
    logDocumentView: (userId: string, documentId: string, documentName: string) =>
      auditLogger.logDocumentView(userId, documentId, documentName),
    logDocumentDelete: (userId: string, documentId: string, documentName: string, success: boolean) =>
      auditLogger.logDocumentDelete(userId, documentId, documentName, success),
    logSearch: (userId: string, query: string, resultsCount: number, searchTime: number) =>
      auditLogger.logSearch(userId, query, resultsCount, searchTime),
    logLogin: (userId: string, success: boolean, ipAddress?: string, userAgent?: string) =>
      auditLogger.logLogin(userId, success, ipAddress, userAgent),
    logLogout: (userId: string) => auditLogger.logLogout(userId),
    logSecurityEvent: (userId: string, event: string, severity: AuditEvent['severity'], metadata?: any) =>
      auditLogger.logSecurityEvent(userId, event, severity, metadata),
    logSystemError: (userId: string, error: string, component: string, metadata?: any) =>
      auditLogger.logSystemError(userId, error, component, metadata)
  };
};
