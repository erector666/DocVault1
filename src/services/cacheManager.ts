interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  hits: number;
}

interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  memoryUsage: number;
}

class CacheManager {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize: number;
  private defaultTTL: number;
  private stats = {
    hits: 0,
    misses: 0
  };

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) { // 5 minutes default
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
    
    // Cleanup expired entries periodically
    setInterval(() => this.cleanup(), 60000); // Every minute
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0
    };

    this.cache.set(key, entry);
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check if entry has expired
    if (this.isExpired(entry)) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update hit count and stats
    entry.hits++;
    this.stats.hits++;
    
    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry !== undefined && !this.isExpired(entry);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
    this.stats.hits = 0;
    this.stats.misses = 0;
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTimestamp = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  getStats(): CacheStats {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;
    
    // Estimate memory usage (rough calculation)
    let memoryUsage = 0;
    for (const [key, entry] of this.cache.entries()) {
      memoryUsage += key.length * 2; // String characters are 2 bytes
      memoryUsage += JSON.stringify(entry.data).length * 2;
      memoryUsage += 32; // Overhead for entry metadata
    }

    return {
      totalEntries: this.cache.size,
      totalHits: this.stats.hits,
      totalMisses: this.stats.misses,
      hitRate,
      memoryUsage
    };
  }

  // Get cache entries sorted by most frequently used
  getMostUsed(limit = 10): Array<{ key: string; hits: number; data: any }> {
    const entries = Array.from(this.cache.entries())
      .map(([key, entry]) => ({ key, hits: entry.hits, data: entry.data }))
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);

    return entries;
  }

  // Prefetch data with a loader function
  async prefetch<T>(key: string, loader: () => Promise<T>, ttl?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    try {
      const data = await loader();
      this.set(key, data, ttl);
      return data;
    } catch (error) {
      throw error;
    }
  }

  // Batch operations
  setMany<T>(entries: Array<{ key: string; data: T; ttl?: number }>): void {
    entries.forEach(({ key, data, ttl }) => {
      this.set(key, data, ttl);
    });
  }

  getMany<T>(keys: string[]): Array<{ key: string; data: T | null }> {
    return keys.map(key => ({ key, data: this.get<T>(key) }));
  }

  deleteMany(keys: string[]): number {
    let deletedCount = 0;
    keys.forEach(key => {
      if (this.delete(key)) {
        deletedCount++;
      }
    });
    return deletedCount;
  }
}

// Specialized cache instances
export const documentCache = new CacheManager(50, 10 * 60 * 1000); // 10 minutes for documents
export const searchCache = new CacheManager(30, 5 * 60 * 1000);    // 5 minutes for search results
export const userCache = new CacheManager(20, 15 * 60 * 1000);     // 15 minutes for user data
export const generalCache = new CacheManager(100, 5 * 60 * 1000);  // General purpose cache

// Cache key generators
export const cacheKeys = {
  document: (id: string) => `document:${id}`,
  documents: (userId: string, filters?: any) => 
    `documents:${userId}:${filters ? JSON.stringify(filters) : 'all'}`,
  search: (query: string, userId: string, filters?: any) =>
    `search:${userId}:${query}:${filters ? JSON.stringify(filters) : 'none'}`,
  user: (id: string) => `user:${id}`,
  categories: (userId: string) => `categories:${userId}`,
  translation: (text: string, targetLang: string) => 
    `translation:${targetLang}:${text.substring(0, 50)}`,
  aiClassification: (text: string) => 
    `ai:classification:${text.substring(0, 100)}`
};

// React hook for cache operations
export const useCache = () => {
  return {
    // Document operations
    cacheDocument: (id: string, document: any) => 
      documentCache.set(cacheKeys.document(id), document),
    getCachedDocument: (id: string) => 
      documentCache.get(cacheKeys.document(id)),
    
    // Search operations
    cacheSearch: (query: string, userId: string, results: any, filters?: any) =>
      searchCache.set(cacheKeys.search(query, userId, filters), results),
    getCachedSearch: (query: string, userId: string, filters?: any) =>
      searchCache.get(cacheKeys.search(query, userId, filters)),
    
    // User operations
    cacheUser: (id: string, user: any) =>
      userCache.set(cacheKeys.user(id), user),
    getCachedUser: (id: string) =>
      userCache.get(cacheKeys.user(id)),
    
    // General operations
    cache: (key: string, data: any, ttl?: number) =>
      generalCache.set(key, data, ttl),
    getCached: (key: string) =>
      generalCache.get(key),
    
    // Cache management
    clearDocumentCache: () => documentCache.clear(),
    clearSearchCache: () => searchCache.clear(),
    clearUserCache: () => userCache.clear(),
    clearAllCaches: () => {
      documentCache.clear();
      searchCache.clear();
      userCache.clear();
      generalCache.clear();
    },
    
    // Statistics
    getCacheStats: () => ({
      document: documentCache.getStats(),
      search: searchCache.getStats(),
      user: userCache.getStats(),
      general: generalCache.getStats()
    })
  };
};
