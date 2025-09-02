import { supabase } from './supabase';
import { Document } from './documentService';

export interface SearchResult {
  documents: Document[];
  totalCount: number;
  searchTime: number;
}

export interface SearchFilters {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  fileType?: string;
  minSize?: number;
  maxSize?: number;
  language?: string;
}

/**
 * Full-text search across documents
 */
export const searchDocuments = async (
  query: string,
  userId: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchResult> => {
  const startTime = Date.now();
  
  try {
    let searchQuery = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Full-text search in document content and metadata
    if (query.trim()) {
      searchQuery = searchQuery.or(`
        name.ilike.%${query}%,
        ai_analysis->>extractedText.ilike.%${query}%,
        keywords.cs.{${query}},
        category.ilike.%${query}%
      `);
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        searchQuery = searchQuery.eq('category', filters.category);
      }
      
      if (filters.dateFrom) {
        searchQuery = searchQuery.gte('created_at', filters.dateFrom);
      }
      
      if (filters.dateTo) {
        searchQuery = searchQuery.lte('created_at', filters.dateTo);
      }
      
      if (filters.fileType) {
        searchQuery = searchQuery.eq('type', filters.fileType);
      }
      
      if (filters.minSize) {
        searchQuery = searchQuery.gte('size', filters.minSize);
      }
      
      if (filters.maxSize) {
        searchQuery = searchQuery.lte('size', filters.maxSize);
      }
      
      if (filters.language) {
        searchQuery = searchQuery.eq('language', filters.language);
      }
    }

    // Apply pagination and ordering
    const { data: documents, error, count } = await searchQuery
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw new Error(`Search failed: ${error.message}`);
    }

    const searchTime = Date.now() - startTime;

    return {
      documents: documents || [],
      totalCount: count || 0,
      searchTime
    };
  } catch (error) {
    console.error('Search error:', error);
    throw error;
  }
};

/**
 * Get search suggestions based on partial query
 */
export const getSearchSuggestions = async (
  partialQuery: string,
  userId: string,
  limit: number = 5
): Promise<string[]> => {
  try {
    if (partialQuery.length < 2) return [];

    // Get suggestions from document names and keywords
    const { data: documents } = await supabase
      .from('documents')
      .select('name, keywords')
      .eq('user_id', userId)
      .or(`name.ilike.%${partialQuery}%, keywords.cs.{${partialQuery}}`)
      .limit(limit * 2);

    const suggestions = new Set<string>();

    documents?.forEach(doc => {
      // Add matching parts of document names
      if (doc.name.toLowerCase().includes(partialQuery.toLowerCase())) {
        suggestions.add(doc.name);
      }
      
      // Add matching keywords
      doc.keywords?.forEach((keyword: string) => {
        if (keyword.toLowerCase().includes(partialQuery.toLowerCase())) {
          suggestions.add(keyword);
        }
      });
    });

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
};

/**
 * Get popular search terms for user
 */
export const getPopularSearchTerms = async (userId: string): Promise<string[]> => {
  try {
    // Get most common keywords from user's documents
    const { data: documents } = await supabase
      .from('documents')
      .select('keywords')
      .eq('user_id', userId);

    const keywordCounts = new Map<string, number>();

    documents?.forEach(doc => {
      doc.keywords?.forEach((keyword: string) => {
        keywordCounts.set(keyword, (keywordCounts.get(keyword) || 0) + 1);
      });
    });

    return Array.from(keywordCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([keyword]) => keyword);
  } catch (error) {
    console.error('Error getting popular search terms:', error);
    return [];
  }
};

/**
 * Advanced search with complex filters and sorting
 */
export const advancedSearch = async (
  searchParams: {
    query?: string;
    filters: SearchFilters;
    sortBy: 'created_at' | 'name' | 'size' | 'confidence';
    sortOrder: 'asc' | 'desc';
    limit: number;
    offset: number;
  },
  userId: string
): Promise<SearchResult> => {
  const startTime = Date.now();
  
  try {
    let searchQuery = supabase
      .from('documents')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply text search
    if (searchParams.query?.trim()) {
      searchQuery = searchQuery.or(`
        name.ilike.%${searchParams.query}%,
        ai_analysis->>extractedText.ilike.%${searchParams.query}%,
        keywords.cs.{${searchParams.query}},
        category.ilike.%${searchParams.query}%
      `);
    }

    // Apply all filters
    const filters = searchParams.filters;
    if (filters.category) searchQuery = searchQuery.eq('category', filters.category);
    if (filters.dateFrom) searchQuery = searchQuery.gte('created_at', filters.dateFrom);
    if (filters.dateTo) searchQuery = searchQuery.lte('created_at', filters.dateTo);
    if (filters.fileType) searchQuery = searchQuery.eq('type', filters.fileType);
    if (filters.minSize) searchQuery = searchQuery.gte('size', filters.minSize);
    if (filters.maxSize) searchQuery = searchQuery.lte('size', filters.maxSize);
    if (filters.language) searchQuery = searchQuery.eq('language', filters.language);

    // Apply sorting
    const { data: documents, error, count } = await searchQuery
      .order(searchParams.sortBy, { ascending: searchParams.sortOrder === 'asc' })
      .range(searchParams.offset, searchParams.offset + searchParams.limit - 1);

    if (error) {
      throw new Error(`Advanced search failed: ${error.message}`);
    }

    const searchTime = Date.now() - startTime;

    return {
      documents: documents || [],
      totalCount: count || 0,
      searchTime
    };
  } catch (error) {
    console.error('Advanced search error:', error);
    throw error;
  }
};
