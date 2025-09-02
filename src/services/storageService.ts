import { supabase } from './supabase';

export interface StorageUsage {
  totalSize: number;
  documentCount: number;
  lastUpdated: Date;
}

/**
 * Calculate storage usage from Supabase documents
 */
export const calculateStorageUsage = async (userId: string): Promise<StorageUsage> => {
  try {
    console.log('Calculating storage for user:', userId);
    
    // Get files from Supabase Storage bucket
    const { data: files, error: storageError } = await supabase.storage
      .from('documents')
      .list(userId, {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    console.log('Storage bucket query result:', { files, storageError });

    if (storageError) {
      console.error('Error querying Supabase storage bucket:', storageError);
    }

    // Also get from documents table for backup
    const { data: documents, error: dbError } = await supabase
      .from('documents')
      .select('size')
      .eq('user_id', userId);

    console.log('Database query result:', { documents, dbError });

    let totalSize = 0;
    let documentCount = 0;

    // Use storage bucket data if available
    if (files && files.length > 0) {
      totalSize = files.reduce((sum, file) => {
        const size = file.metadata?.size || 0;
        console.log(`File: ${file.name}, Size: ${size}`);
        return sum + size;
      }, 0);
      documentCount = files.length;
      console.log('Using storage bucket data:', { totalSize, documentCount, files });
    } 
    // Fallback to database data
    else if (documents && documents.length > 0) {
      totalSize = documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
      documentCount = documents.length;
      console.log('Using database data:', { totalSize, documentCount });
    }
    // If no data found, try to get bucket info
    else {
      console.log('No files found in bucket or database. Checking bucket existence...');
      const { data: bucketList, error: bucketError } = await supabase.storage.listBuckets();
      console.log('Available buckets:', bucketList, bucketError);
      
      // Try to list all files in the documents bucket
      const { data: allFiles, error: allFilesError } = await supabase.storage
        .from('documents')
        .list('', { limit: 100 });
      console.log('All files in documents bucket:', allFiles, allFilesError);
    }
    
    console.log('Final calculated storage:', { totalSize, documentCount });
    
    return {
      totalSize,
      documentCount,
      lastUpdated: new Date(),
    };
  } catch (error) {
    console.error('Error calculating storage usage:', error);
    return {
      totalSize: 0,
      documentCount: 0,
      lastUpdated: new Date(),
    };
  }
};

/**
 * Get storage usage with caching to avoid excessive Firestore reads
 */
let storageCache: { [userId: string]: { data: StorageUsage; timestamp: number } } = {};
const CACHE_DURATION = 30000; // 30 seconds

export const getStorageUsage = async (userId: string): Promise<StorageUsage> => {
  const now = Date.now();
  const cached = storageCache[userId];
  
  // Return cached data if it's still valid
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return cached.data;
  }
  
  // Calculate fresh data
  const usage = await calculateStorageUsage(userId);
  
  // Cache the result
  storageCache[userId] = {
    data: usage,
    timestamp: now
  };
  
  return usage;
};

/**
 * Clear storage cache (useful when documents are uploaded/deleted)
 */
export const clearStorageCache = (userId?: string) => {
  if (userId) {
    delete storageCache[userId];
  } else {
    storageCache = {};
  }
};
