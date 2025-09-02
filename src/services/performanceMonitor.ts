interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  category: 'load' | 'interaction' | 'api' | 'render';
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    averageLoadTime: number;
    averageApiTime: number;
    totalInteractions: number;
    errorRate: number;
  };
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page_load', navEntry.loadEventEnd - navEntry.fetchStart, 'load');
            this.recordMetric('dom_content_loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'load');
            this.recordMetric('first_paint', navEntry.loadEventEnd - navEntry.fetchStart, 'render');
          }
        }
      });
      navObserver.observe({ entryTypes: ['navigation'] });
      this.observers.push(navObserver);

      // Resource timing
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/') || entry.name.includes('supabase')) {
            this.recordMetric('api_request', entry.duration, 'api');
          }
        }
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
      this.observers.push(resourceObserver);

      // Long tasks
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('long_task', entry.duration, 'render');
        }
      });
      longTaskObserver.observe({ entryTypes: ['longtask'] });
      this.observers.push(longTaskObserver);
    }
  }

  recordMetric(name: string, value: number, category: PerformanceMetric['category']) {
    this.metrics.push({
      name,
      value,
      timestamp: Date.now(),
      category
    });

    // Keep only last 1000 metrics
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000);
    }
  }

  recordInteraction(action: string, duration: number) {
    this.recordMetric(`interaction_${action}`, duration, 'interaction');
  }

  recordApiCall(endpoint: string, duration: number, success: boolean) {
    this.recordMetric(`api_${endpoint}`, duration, 'api');
    if (!success) {
      this.recordMetric('api_error', 1, 'api');
    }
  }

  getReport(): PerformanceReport {
    const loadMetrics = this.metrics.filter(m => m.category === 'load');
    const apiMetrics = this.metrics.filter(m => m.category === 'api' && !m.name.includes('error'));
    const interactionMetrics = this.metrics.filter(m => m.category === 'interaction');
    const errorMetrics = this.metrics.filter(m => m.name.includes('error'));

    const averageLoadTime = loadMetrics.length > 0 
      ? loadMetrics.reduce((sum, m) => sum + m.value, 0) / loadMetrics.length 
      : 0;

    const averageApiTime = apiMetrics.length > 0
      ? apiMetrics.reduce((sum, m) => sum + m.value, 0) / apiMetrics.length
      : 0;

    const errorRate = this.metrics.length > 0
      ? errorMetrics.length / this.metrics.length
      : 0;

    return {
      metrics: [...this.metrics],
      summary: {
        averageLoadTime,
        averageApiTime,
        totalInteractions: interactionMetrics.length,
        errorRate
      }
    };
  }

  getMetricsByCategory(category: PerformanceMetric['category']): PerformanceMetric[] {
    return this.metrics.filter(m => m.category === category);
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const recordInteraction = (action: string) => {
    const startTime = performance.now();
    return () => {
      const duration = performance.now() - startTime;
      performanceMonitor.recordInteraction(action, duration);
    };
  };

  const recordApiCall = async <T>(
    endpoint: string,
    apiCall: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    let success = true;
    
    try {
      const result = await apiCall();
      return result;
    } catch (error) {
      success = false;
      throw error;
    } finally {
      const duration = performance.now() - startTime;
      performanceMonitor.recordApiCall(endpoint, duration, success);
    }
  };

  return {
    recordInteraction,
    recordApiCall,
    getReport: () => performanceMonitor.getReport(),
    clearMetrics: () => performanceMonitor.clearMetrics()
  };
};
