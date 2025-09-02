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
      keywords: classification.keywords,
      confidence: classification.confidence,
      document_type: classification.documentType,
      language: classification.language,
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
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('url, user_id')
    .eq('id', documentId)
    .single();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  // Extract file path from URL - handle both public URL formats
  let filePath: string;
  
  if (document.url.includes('/storage/v1/object/public/documents/')) {
    // New public URL format
    filePath = document.url.split('/storage/v1/object/public/documents/')[1];
  } else if (document.url.includes('/object/public/documents/')) {
    // Alternative public URL format
    filePath = document.url.split('/object/public/documents/')[1];
  } else {
    // Fallback - try to extract filename from URL
    const urlParts = document.url.split('/');
    filePath = urlParts[urlParts.length - 1];
  }

  console.log('Attempting to delete file at path:', filePath);

  // Delete from storage first
  const { error: storageError } = await supabase.storage
    .from('documents')
    .remove([filePath]);

  if (storageError) {
    console.warn('Storage deletion failed:', storageError.message);
    // Continue with database deletion even if storage fails
  }

  // Delete from database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('id', documentId);

  if (dbError) {
    throw new Error(`Database deletion failed: ${dbError.message}`);
  }

  // If storage deletion failed initially, try alternative approaches
  if (storageError) {
    console.log('Attempting alternative storage deletion methods...');
    
    // Try with different path formats
    const alternativePaths = [
      `${document.user_id}/${filePath}`,
      `documents/${filePath}`,
      filePath.replace(/^documents\//, ''),
    ];

    for (const altPath of alternativePaths) {
      const { error: altError } = await supabase.storage
        .from('documents')
        .remove([altPath]);
      
      if (!altError) {
        console.log(`Successfully deleted file using alternative path: ${altPath}`);
        break;
      }
    }
  }
};
