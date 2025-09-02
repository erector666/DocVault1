interface AnalyticsEvent {
  event: string;
  properties: Record<string, any>;
  timestamp: number;
  userId?: string;
  sessionId: string;
}

interface UserSession {
  sessionId: string;
  userId?: string;
  startTime: number;
  lastActivity: number;
  pageViews: number;
  events: AnalyticsEvent[];
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private currentSession: UserSession;
  private sessionTimeout = 30 * 60 * 1000; // 30 minutes

  constructor() {
    this.currentSession = this.createNewSession();
    this.initializeTracking();
  }

  private createNewSession(): UserSession {
    return {
      sessionId: this.generateSessionId(),
      startTime: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0,
      events: []
    };
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.track('page_hidden');
      } else {
        this.track('page_visible');
        this.updateLastActivity();
      }
    });

    // Track page unload
    window.addEventListener('beforeunload', () => {
      this.track('page_unload', {
        sessionDuration: Date.now() - this.currentSession.startTime
      });
      this.flushEvents();
    });

    // Track clicks
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        const button = target.tagName === 'BUTTON' ? target : target.closest('button');
        this.track('button_click', {
          buttonText: button?.textContent?.trim(),
          buttonId: button?.id,
          buttonClass: button?.className
        });
      }
    });
  }

  private updateLastActivity() {
    this.currentSession.lastActivity = Date.now();
  }

  private isSessionExpired(): boolean {
    return Date.now() - this.currentSession.lastActivity > this.sessionTimeout;
  }

  track(event: string, properties: Record<string, any> = {}) {
    if (this.isSessionExpired()) {
      this.currentSession = this.createNewSession();
    }

    this.updateLastActivity();

    const analyticsEvent: AnalyticsEvent = {
      event,
      properties: {
        ...properties,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      },
      timestamp: Date.now(),
      userId: this.currentSession.userId,
      sessionId: this.currentSession.sessionId
    };

    this.events.push(analyticsEvent);
    this.currentSession.events.push(analyticsEvent);

    // Keep only last 1000 events in memory
    if (this.events.length > 1000) {
      this.events = this.events.slice(-1000);
    }

    console.log('Analytics Event:', analyticsEvent);
  }

  setUserId(userId: string) {
    this.currentSession.userId = userId;
    this.track('user_identified', { userId });
  }

  trackPageView(page: string, title?: string) {
    this.currentSession.pageViews++;
    this.track('page_view', {
      page,
      title: title || document.title,
      referrer: document.referrer
    });
  }

  trackDocumentAction(action: string, documentId: string, properties: Record<string, any> = {}) {
    this.track('document_action', {
      action,
      documentId,
      ...properties
    });
  }

  trackSearchAction(query: string, resultsCount: number, searchTime: number) {
    this.track('search_performed', {
      query,
      resultsCount,
      searchTime
    });
  }

  trackError(error: Error, context?: string) {
    this.track('error_occurred', {
      errorMessage: error.message,
      errorStack: error.stack,
      context,
      url: window.location.href
    });
  }

  trackPerformance(metric: string, value: number, unit: string = 'ms') {
    this.track('performance_metric', {
      metric,
      value,
      unit
    });
  }

  getEvents(): AnalyticsEvent[] {
    return [...this.events];
  }

  getCurrentSession(): UserSession {
    return { ...this.currentSession };
  }

  getSessionSummary() {
    const session = this.currentSession;
    const sessionDuration = Date.now() - session.startTime;
    
    return {
      sessionId: session.sessionId,
      userId: session.userId,
      duration: sessionDuration,
      pageViews: session.pageViews,
      eventCount: session.events.length,
      startTime: new Date(session.startTime).toISOString(),
      lastActivity: new Date(session.lastActivity).toISOString()
    };
  }

  private async flushEvents() {
    // In production, send events to analytics service
    const eventsToSend = [...this.events];
    
    try {
      // Example: Send to analytics API
      // await fetch('/api/analytics', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ events: eventsToSend })
      // });
      
      console.log('Flushing analytics events:', eventsToSend.length);
      this.events = [];
    } catch (error) {
      console.error('Failed to flush analytics events:', error);
    }
  }

  clearEvents() {
    this.events = [];
    this.currentSession.events = [];
  }
}

// Singleton instance
export const analytics = new AnalyticsService();

// React hook for analytics
export const useAnalytics = () => {
  return {
    track: (event: string, properties?: Record<string, any>) => analytics.track(event, properties),
    trackPageView: (page: string, title?: string) => analytics.trackPageView(page, title),
    trackDocumentAction: (action: string, documentId: string, properties?: Record<string, any>) => 
      analytics.trackDocumentAction(action, documentId, properties),
    trackSearchAction: (query: string, resultsCount: number, searchTime: number) =>
      analytics.trackSearchAction(query, resultsCount, searchTime),
    trackError: (error: Error, context?: string) => analytics.trackError(error, context),
    trackPerformance: (metric: string, value: number, unit?: string) =>
      analytics.trackPerformance(metric, value, unit),
    setUserId: (userId: string) => analytics.setUserId(userId),
    getSessionSummary: () => analytics.getSessionSummary()
  };
};
