import { documentCache, searchCache, userCache } from './cacheManager';
import { performanceMonitor } from './performanceMonitor';

interface OptimizationConfig {
  enableImageLazyLoading: boolean;
  enableVirtualScrolling: boolean;
  enableComponentMemoization: boolean;
  enableQueryOptimization: boolean;
  enableResourcePreloading: boolean;
  enableServiceWorkerCaching: boolean;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  cacheHitRate: number;
  bundleSize: number;
}

class PerformanceOptimizer {
  private config: OptimizationConfig;
  private metrics: PerformanceMetrics;
  private observers: Map<string, IntersectionObserver | ResizeObserver> = new Map();

  constructor() {
    this.config = {
      enableImageLazyLoading: true,
      enableVirtualScrolling: true,
      enableComponentMemoization: true,
      enableQueryOptimization: true,
      enableResourcePreloading: true,
      enableServiceWorkerCaching: true
    };

    this.metrics = {
      loadTime: 0,
      renderTime: 0,
      memoryUsage: 0,
      cacheHitRate: 0,
      bundleSize: 0
    };

    this.initializeOptimizations();
  }

  private initializeOptimizations(): void {
    if (this.config.enableImageLazyLoading) {
      this.setupImageLazyLoading();
    }

    if (this.config.enableResourcePreloading) {
      this.setupResourcePreloading();
    }

    if (this.config.enableServiceWorkerCaching) {
      this.setupServiceWorkerCaching();
    }

    this.startPerformanceMonitoring();
  }

  // Image Lazy Loading
  private setupImageLazyLoading(): void {
    const imageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            const src = img.dataset.src;
            if (src) {
              img.src = src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    this.observers.set('imageObserver', imageObserver);
  }

  public observeImage(img: HTMLImageElement): void {
    const observer = this.observers.get('imageObserver');
    if (observer && img) {
      observer.observe(img);
    }
  }

  // Resource Preloading
  private setupResourcePreloading(): void {
    // Preload critical resources
    const criticalResources = [
      '/static/css/main.css',
      '/static/js/main.js',
      '/api/user/profile',
      '/api/documents/recent'
    ];

    criticalResources.forEach((resource) => {
      if (resource.endsWith('.css') || resource.endsWith('.js')) {
        this.preloadStaticResource(resource);
      } else {
        this.preloadApiEndpoint(resource);
      }
    });
  }

  private preloadStaticResource(url: string): void {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    if (url.endsWith('.css')) {
      link.as = 'style';
    } else if (url.endsWith('.js')) {
      link.as = 'script';
    }
    
    document.head.appendChild(link);
  }

  private preloadApiEndpoint(url: string): void {
    // Use fetch with low priority to preload API data
    fetch(url, {
      method: 'GET',
      cache: 'force-cache'
    }).catch(() => {
      // Silently fail for preloading
    });
  }

  // Service Worker Caching
  private setupServiceWorkerCaching(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.log('Service Worker registration failed:', error);
        });
    }
  }

  // Query Optimization
  public optimizeQuery(query: string, filters: any): { query: string; cacheKey: string } {
    // Normalize query for better caching
    const normalizedQuery = query.toLowerCase().trim();
    
    // Create cache key from query and filters
    const cacheKey = this.generateCacheKey(normalizedQuery, filters);
    
    // Check if we have cached results
    const cached = searchCache.get(cacheKey);
    if (cached) {
      return { query: normalizedQuery, cacheKey };
    }

    return { query: normalizedQuery, cacheKey };
  }

  private generateCacheKey(query: string, filters: any): string {
    const filterString = JSON.stringify(filters, Object.keys(filters).sort());
    return `search:${query}:${btoa(filterString)}`;
  }

  // Component Memoization Helpers
  public shouldComponentUpdate(prevProps: any, nextProps: any): boolean {
    // Deep comparison for props to determine if component should re-render
    return !this.deepEqual(prevProps, nextProps);
  }

  private deepEqual(obj1: any, obj2: any): boolean {
    if (obj1 === obj2) return true;
    
    if (obj1 == null || obj2 == null) return false;
    
    if (typeof obj1 !== typeof obj2) return false;
    
    if (typeof obj1 !== 'object') return obj1 === obj2;
    
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    
    if (keys1.length !== keys2.length) return false;
    
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;
      if (!this.deepEqual(obj1[key], obj2[key])) return false;
    }
    
    return true;
  }

  // Virtual Scrolling Helper
  public calculateVisibleItems(
    containerHeight: number,
    itemHeight: number,
    scrollTop: number,
    totalItems: number,
    overscan: number = 5
  ): { startIndex: number; endIndex: number; visibleItems: number } {
    const visibleItems = Math.ceil(containerHeight / itemHeight);
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(totalItems - 1, startIndex + visibleItems + overscan * 2);
    
    return { startIndex, endIndex, visibleItems };
  }

  // Performance Monitoring
  private startPerformanceMonitoring(): void {
    // Monitor page load performance
    window.addEventListener('load', () => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      this.metrics.loadTime = navigation.loadEventEnd - navigation.fetchStart;
    });

    // Monitor memory usage
    if ('memory' in performance) {
      const memoryInfo = (performance as any).memory;
      this.metrics.memoryUsage = memoryInfo.usedJSHeapSize;
    }

    // Monitor cache hit rates
    setInterval(() => {
      this.updateCacheMetrics();
    }, 30000); // Every 30 seconds
  }

  private updateCacheMetrics(): void {
    const documentStats = documentCache.getStats();
    const searchStats = searchCache.getStats();
    const userStats = userCache.getStats();

    const totalRequests = documentStats.totalHits + documentStats.totalMisses + 
                         searchStats.totalHits + searchStats.totalMisses + 
                         userStats.totalHits + userStats.totalMisses;
    
    const totalHits = documentStats.totalHits + searchStats.totalHits + userStats.totalHits;
    
    this.metrics.cacheHitRate = totalRequests > 0 ? (totalHits / totalRequests) * 100 : 0;
  }

  // Bundle Size Analysis
  public analyzeBundleSize(): Promise<{ size: number; chunks: any[] }> {
    return new Promise((resolve) => {
      // This would typically be done at build time
      // For runtime, we can estimate based on loaded resources
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));
      
      let totalSize = 0;
      const chunks: any[] = [];
      
      Promise.all([
        ...scripts.map(script => this.getResourceSize((script as HTMLScriptElement).src)),
        ...styles.map(style => this.getResourceSize((style as HTMLLinkElement).href))
      ]).then((sizes) => {
        totalSize = sizes.reduce((sum, size) => sum + size, 0);
        this.metrics.bundleSize = totalSize;
        
        resolve({ size: totalSize, chunks });
      });
    });
  }

  private async getResourceSize(url: string): Promise<number> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      return contentLength ? parseInt(contentLength, 10) : 0;
    } catch {
      return 0;
    }
  }

  // Image Optimization
  public optimizeImageUrl(url: string, width?: number, height?: number, quality?: number): string {
    // Add query parameters for image optimization
    const params = new URLSearchParams();
    
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (quality) params.set('q', quality.toString());
    
    const separator = url.includes('?') ? '&' : '?';
    return params.toString() ? `${url}${separator}${params.toString()}` : url;
  }

  // Code Splitting Helper
  public async loadComponent(componentName: string): Promise<any> {
    const cacheKey = `component:${componentName}`;
    const cached = userCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      let component;
      
      switch (componentName) {
        case 'DocumentViewer':
          component = await import('../components/viewer/DocumentViewer');
          break;
        case 'AdvancedSearch':
          component = await import('../components/search/AdvancedSearch');
          break;
        case 'StorageOptimizer':
          component = await import('../components/storage/StorageOptimizer');
          break;
        case 'TestSuite':
          component = await import('../components/testing/TestSuite');
          break;
        default:
          throw new Error(`Unknown component: ${componentName}`);
      }
      
      userCache.set(cacheKey, component, 300000); // Cache for 5 minutes
      return component;
    } catch (error) {
      console.error(`Failed to load component ${componentName}:`, error);
      throw error;
    }
  }

  // Performance Metrics
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  public getConfig(): OptimizationConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Cleanup
  public cleanup(): void {
    this.observers.forEach((observer) => {
      observer.disconnect();
    });
    this.observers.clear();
  }

  // Performance Recommendations
  public getRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.metrics.loadTime > 3000) {
      recommendations.push('Consider enabling resource preloading to improve load times');
    }
    
    if (this.metrics.cacheHitRate < 70) {
      recommendations.push('Cache hit rate is low. Consider increasing cache TTL or improving cache keys');
    }
    
    if (this.metrics.memoryUsage > 50 * 1024 * 1024) { // 50MB
      recommendations.push('Memory usage is high. Consider implementing virtual scrolling for large lists');
    }
    
    if (this.metrics.bundleSize > 1024 * 1024) { // 1MB
      recommendations.push('Bundle size is large. Consider code splitting and lazy loading');
    }
    
    return recommendations;
  }
}

export const performanceOptimizer = new PerformanceOptimizer();

// React Hook for Performance Optimization
export const usePerformanceOptimization = () => {
  return {
    optimizeQuery: performanceOptimizer.optimizeQuery.bind(performanceOptimizer),
    shouldComponentUpdate: performanceOptimizer.shouldComponentUpdate.bind(performanceOptimizer),
    calculateVisibleItems: performanceOptimizer.calculateVisibleItems.bind(performanceOptimizer),
    optimizeImageUrl: performanceOptimizer.optimizeImageUrl.bind(performanceOptimizer),
    loadComponent: performanceOptimizer.loadComponent.bind(performanceOptimizer),
    getMetrics: performanceOptimizer.getMetrics.bind(performanceOptimizer),
    getRecommendations: performanceOptimizer.getRecommendations.bind(performanceOptimizer)
  };
};
