import { createClient } from '@supabase/supabase-js';
import { classifyDocument, extractTextFromDocument } from './aiService';
import { performSecurityCheck } from './virusScanner';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL!;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  user_id: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  confidence?: number;
  document_type?: string;
  language?: string;
  ai_analysis?: any;
  created_at: string;
  updated_at: string;
  metadata?: {
    language?: string;
    isTranslation?: boolean;
    originalDocumentId?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    translationConfidence?: number;
    translations?: {
      [languageCode: string]: {
        timestamp: number;
        confidence: number;
      };
    };
  };
}

export interface Category {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

// Document service functions
export const getDocuments = async (userId: string): Promise<Document[]> => {
  // Get documents from database
  const { data: dbDocuments, error: dbError } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (dbError) {
    console.error('Error fetching documents from database:', dbError);
    throw new Error(dbError.message);
  }

  // Get files from storage bucket
  const { data: storageFiles, error: storageError } = await supabase.storage
    .from('documents')
    .list(userId, {
      limit: 1000,
      offset: 0,
    });

  if (storageError) {
    console.error('Error fetching files from storage:', storageError);
    // Don't throw error, just use database data
    return dbDocuments || [];
  }

  // Sync logic: if file exists in storage but not in database, add it
  const dbFileNames = new Set((dbDocuments || []).map(doc => {
    const urlParts = doc.url.split('/');
    return urlParts[urlParts.length - 1];
  }));

  const storageFileNames = new Set(storageFiles?.map(file => file.name) || []);

  // Add missing files from storage to database
  const missingFiles = storageFiles?.filter(file => !dbFileNames.has(file.name)) || [];
  
  for (const file of missingFiles) {
    const { data: urlData } = supabase.storage
      .from('documents')
      .getPublicUrl(`${userId}/${file.name}`);

    // Add to database
    const { error: insertError } = await supabase
      .from('documents')
      .insert({
        name: file.name,
        type: file.metadata?.mimetype || 'application/octet-stream',
        size: file.metadata?.size || 0,
        url: urlData.publicUrl,
        user_id: userId,
      });

    if (insertError) {
      console.error('Error syncing file to database:', insertError);
    }
  }

  // Remove database entries for files that don't exist in storage
  const orphanedDocs = (dbDocuments || []).filter(doc => {
    const urlParts = doc.url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return !storageFileNames.has(fileName);
  });

  for (const doc of orphanedDocs) {
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', doc.id);

    if (deleteError) {
      console.error('Error removing orphaned document:', deleteError);
    }
  }

  // Fetch updated documents after sync
  const { data: syncedDocuments, error: syncError } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (syncError) {
    console.error('Error fetching synced documents:', syncError);
    return dbDocuments || [];
  }

  return syncedDocuments || [];
};

/**
 * Sync frontend with Supabase - remove orphaned database records
 * This function should be called periodically to ensure consistency
 */
export const syncWithSupabase = async (userId: string): Promise<{
  orphanedRecordsRemoved: number;
  orphanedFilesRemoved: number;
}> => {
  try {
    console.log('Starting Supabase sync for user:', userId);
    
    let orphanedRecordsRemoved = 0;
    let orphanedFilesRemoved = 0;

    // Get all documents for the user
    const { data: documents, error: fetchError } = await supabase
      .from('documents')
      .select('id, url, name, user_id')
      .eq('user_id', userId);

    if (fetchError) {
      throw new Error(`Failed to fetch documents: ${fetchError.message}`);
    }

    if (!documents || documents.length === 0) {
      console.log('No documents found for user');
      return { orphanedRecordsRemoved: 0, orphanedFilesRemoved: 0 };
    }

    console.log(`Checking ${documents.length} documents for consistency...`);

    // Check each document's storage file
    for (const document of documents) {
      try {
        // Extract file path
        let filePath: string;
        if (document.url.includes('/storage/v1/object/public/documents/')) {
          filePath = document.url.split('/storage/v1/object/public/documents/')[1];
        } else if (document.url.includes('/object/public/documents/')) {
          filePath = document.url.split('/object/public/documents/')[1];
        } else {
          filePath = `${document.user_id}/${document.name}`;
        }

        // Check if file exists in storage
        const { data: fileExists, error: checkError } = await supabase.storage
          .from('documents')
          .list(filePath.split('/').slice(0, -1).join('/'), {
            limit: 1000,
            search: filePath.split('/').pop()
          });

        if (checkError) {
          console.warn(`Error checking file existence for ${document.name}:`, checkError.message);
          continue;
        }

        // If file doesn't exist in storage, remove the database record
        if (!fileExists || fileExists.length === 0) {
          console.log(`Removing orphaned database record for: ${document.name}`);
          
          const { error: deleteError } = await supabase
            .from('documents')
            .delete()
            .eq('id', document.id);

          if (deleteError) {
            console.error(`Failed to remove orphaned record for ${document.name}:`, deleteError.message);
          } else {
            orphanedRecordsRemoved++;
          }
        }
      } catch (error) {
        console.error(`Error processing document ${document.name}:`, error);
      }
    }

    // Also check for orphaned storage files (files without database records)
    try {
      const { data: storageFiles, error: storageError } = await supabase.storage
        .from('documents')
        .list(userId, { limit: 1000 });

      if (!storageError && storageFiles) {
        for (const file of storageFiles) {
          // Check if this file has a corresponding database record
          const fileName = file.name;
          const hasRecord = documents.some(doc => doc.name === fileName);

          if (!hasRecord) {
            console.log(`Removing orphaned storage file: ${fileName}`);
            
            const { error: removeError } = await supabase.storage
              .from('documents')
              .remove([`${userId}/${fileName}`]);

            if (removeError) {
              console.error(`Failed to remove orphaned file ${fileName}:`, removeError.message);
            } else {
              orphanedFilesRemoved++;
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking for orphaned storage files:', error);
    }

    console.log(`Sync completed. Removed ${orphanedRecordsRemoved} orphaned records and ${orphanedFilesRemoved} orphaned files.`);
    
    return { orphanedRecordsRemoved, orphanedFilesRemoved };

  } catch (error) {
    console.error('Error in syncWithSupabase:', error);
    throw error;
  }
};

/**
 * Force cleanup of a specific file from both storage and database
 * Use this when you know a file should be deleted but normal deletion failed
 */
export const forceCleanupFile = async (fileName: string, userId: string): Promise<void> => {
  try {
    console.log(`Force cleaning up file: ${fileName} for user: ${userId}`);
    
    // Try to remove from storage with multiple path variations
    const possiblePaths = [
      `${userId}/${fileName}`,
      fileName,
      `${userId}/${fileName.replace(/^[^\/]+\//, '')}`,
    ];

    let storageCleaned = false;
    for (const path of possiblePaths) {
      try {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([path]);
        
        if (!storageError) {
          console.log(`Successfully cleaned up storage file at path: ${path}`);
          storageCleaned = true;
          break;
        }
      } catch (error) {
        console.log(`Failed to clean up path ${path}:`, error);
      }
    }

    // Remove from database if it exists
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('name', fileName)
      .eq('user_id', userId);

    if (dbError && dbError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.warn(`Database cleanup warning: ${dbError.message}`);
    }

    if (storageCleaned) {
      console.log(`Successfully force cleaned up file: ${fileName}`);
    } else {
      console.warn(`File ${fileName} may still exist in storage`);
    }

  } catch (error) {
    console.error(`Error in forceCleanupFile for ${fileName}:`, error);
    throw error;
  }
};

// File type validation
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// File validation function (used internally)
const performFileValidation = (file: File): void => {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error(`File type ${file.type} not allowed. Allowed types: ${ALLOWED_FILE_TYPES.join(', ')}`);
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size ${file.size} exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`);
  }
  
  // Basic filename validation
  if (file.name.length > 255) {
    throw new Error('Filename too long (max 255 characters)');
  }
  
  // Check for suspicious file extensions
  const suspiciousExtensions = ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com'];
  const hassuspicious = suspiciousExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  if (hassuspicious) {
    throw new Error('File type not allowed for security reasons');
  }
};

export const uploadDocument = async (
  file: File,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<Document> => {
  try {
    // Perform comprehensive security check including virus scanning
    const securityCheck = await performSecurityCheck(file);
    if (!securityCheck.passed) {
      throw new Error(`Security check failed: ${securityCheck.issues.join(', ')}`);
    }
    
    const fileName = `${Date.now()}-${file.name}`;
    const filePath = `${userId}/${fileName}`;

    if (onProgress) onProgress(10);

    // Extract text from document first
    const extractedText = await extractTextFromDocument(file);
    
    if (onProgress) onProgress(40);
    
    // Classify document based on filename and extracted text
    const classification = await classifyDocument(file.name, file.type, extractedText);

    if (onProgress) onProgress(60);

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    if (onProgress) onProgress(80);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document record in database with AI classification
    const documentData = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      user_id: userId,
      category: classification.category,
      ai_analysis: {
        extractedText: extractedText,
        classification: classification,
        processedAt: new Date().toISOString(),
        fileValidation: {
          validated: true,
          validatedAt: new Date().toISOString()
        }
      }
    };

    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert([documentData])
      .select()
      .single();

    if (dbError) {
      // Clean up uploaded file if database insert fails
      await supabase.storage.from('documents').remove([filePath]);
      throw new Error(`Database error: ${dbError.message}`);
    }

    if (onProgress) onProgress(100);

    return document as Document;
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

export const getDocument = async (documentId: string): Promise<Document | null> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No rows found
      return null;
    }
    throw new Error(error.message);
  }

  return data;
};

export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // First, get the document details
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('url, user_id, name')
      .eq('id', documentId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch document: ${fetchError.message}`);
    }

    if (!document) {
      throw new Error('Document not found');
    }

    console.log('Deleting document:', document.name, 'with URL:', document.url);

    // Extract file path from URL more reliably
    let filePath: string;
    
    if (document.url.includes('/storage/v1/object/public/documents/')) {
      // New public URL format: https://.../storage/v1/object/public/documents/userId/filename
      filePath = document.url.split('/storage/v1/object/public/documents/')[1];
    } else if (document.url.includes('/object/public/documents/')) {
      // Alternative public URL format
      filePath = document.url.split('/object/public/documents/')[1];
    } else {
      // Fallback - construct path from user_id and filename
      filePath = `${document.user_id}/${document.name}`;
    }

    console.log('Extracted file path:', filePath);

    // Try multiple path variations to ensure deletion
    const possiblePaths = [
      filePath,
      `${document.user_id}/${document.name}`,
      document.name,
      filePath.replace(/^[^\/]+\//, ''), // Remove user_id prefix if present
    ];

    console.log('Attempting deletion with paths:', possiblePaths);

    // Delete from storage using multiple path attempts
    let storageDeleted = false;
    for (const path of possiblePaths) {
      try {
        const { error: storageError } = await supabase.storage
          .from('documents')
          .remove([path]);
        
        if (!storageError) {
          console.log(`Successfully deleted storage file at path: ${path}`);
          storageDeleted = true;
          break;
        } else {
          console.log(`Storage deletion failed for path ${path}:`, storageError.message);
        }
      } catch (error) {
        console.log(`Error trying path ${path}:`, error);
      }
    }

    if (!storageDeleted) {
      console.warn('Storage deletion failed for all attempted paths');
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`);
    }

    console.log('Successfully deleted document from database');

    // If storage deletion failed, log it but don't fail the operation
    if (!storageDeleted) {
      console.warn('Document deleted from database but storage cleanup may be incomplete');
    }

  } catch (error) {
    console.error('Error in deleteDocument:', error);
    throw error;
  }
};
