import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { usePerformanceOptimization } from '../../services/performanceOptimizer';

interface VirtualScrollListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
  className?: string;
  onScroll?: (scrollTop: number) => void;
  loadMore?: () => void;
  hasMore?: boolean;
  loading?: boolean;
}

export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  loadMore,
  hasMore = false,
  loading = false
}: VirtualScrollListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const { calculateVisibleItems } = usePerformanceOptimization();

  const totalHeight = items.length * itemHeight;

  const { startIndex, endIndex } = useMemo(() => {
    return calculateVisibleItems(
      containerHeight,
      itemHeight,
      scrollTop,
      items.length,
      overscan
    );
  }, [containerHeight, itemHeight, scrollTop, items.length, overscan, calculateVisibleItems]);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1);
  }, [items, startIndex, endIndex]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);

    // Infinite scroll logic
    if (loadMore && hasMore && !loading) {
      const scrollHeight = event.currentTarget.scrollHeight;
      const clientHeight = event.currentTarget.clientHeight;
      const threshold = 200; // Load more when 200px from bottom

      if (scrollHeight - newScrollTop - clientHeight < threshold) {
        loadMore();
      }
    }
  }, [onScroll, loadMore, hasMore, loading]);

  const offsetY = startIndex * itemHeight;

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
      role="list"
      aria-label="Virtual scrolling list"
    >
      <div
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{
                height: itemHeight,
                position: 'relative'
              }}
              role="listitem"
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
      
      {loading && (
        <div className="flex justify-center items-center p-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-sm text-gray-600">Loading more...</span>
        </div>
      )}
    </div>
  );
}

// Memoized version for better performance
export const MemoizedVirtualScrollList = React.memo(VirtualScrollList) as typeof VirtualScrollList;
