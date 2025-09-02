import { supabase } from './supabase';
import { clearStorageCache } from './storageService';
import { classifyDocument, extractTextFromDocument, convertToPDF } from './classificationService';

export interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  path: string;
  user_id: string;
  category?: string;
  tags?: string[];
  keywords?: string[];
  confidence?: number;
  document_type?: string;
  language?: string;
  ai_analysis?: any; // JSONB field for AI processing results
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface DocumentUploadProgress {
  progress: number;
  snapshot: any;
}

/**
 * Upload a document to Supabase Storage and save metadata to database
 */
export const uploadDocument = async (
  file: File, 
  userId: string,
  category?: string,
  tags?: string[],
  metadata?: Record<string, any>,
  onProgress?: (progress: DocumentUploadProgress) => void
): Promise<Document> => {
  try {
    const fileName = `${Date.now()}_${file.name}`;
    const filePath = `${userId}/${fileName}`;
    
    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      throw uploadError;
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    // Create document metadata in database
    const documentData: Omit<Document, 'id'> = {
      name: file.name,
      type: file.type,
      size: file.size,
      url: publicUrl,
      path: filePath,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(category && { category }),
      ...(tags && { tags }),
      ...(metadata && { metadata })
    };
    
    // Add document to database
    const { data: docData, error: insertError } = await supabase
      .from('documents')
      .insert(documentData)
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Clear storage cache to reflect new upload
    clearStorageCache(userId);
    
    // 🆕 Start AI processing pipeline in background
    processDocumentWithAI(docData.id, publicUrl, file.type).catch(error => {
      console.error('AI processing failed for document:', docData.id, error);
    });
    
    // Return the document with its ID
    if (!docData.id) {
      throw new Error('Document created but no ID returned');
    }
    
    return {
      id: docData.id,
      ...documentData
    };
  } catch (error) {
    console.error('Error uploading document:', error);
    throw error;
  }
};

// 🆕 AI Processing Pipeline
const processDocumentWithAI = async (documentId: string, documentUrl: string, documentType: string) => {
  try {
    console.log(`Starting AI processing for document: ${documentId}`);
    
    // Step 1: Extract text from document
    const extractedText = await extractTextFromDocument(documentUrl, documentType);
    console.log(`Text extraction completed for document: ${documentId}`);
    
    // Step 2: Classify document
    const classification = await classifyDocument(documentId, documentUrl, documentType);
    console.log(`Classification completed for document: ${documentId}`);
    
    // Step 3: Convert to PDF (if not already PDF)
    let pdfUrl = documentUrl;
    if (documentType !== 'application/pdf') {
      const pdfResult = await convertToPDF(documentUrl, documentType, documentId);
      pdfUrl = pdfResult.pdfUrl;
      console.log(`PDF conversion completed for document: ${documentId}`);
    }
    
    // Step 4: Update document with AI results
    const aiAnalysis = {
      extractedText: extractedText.extractedText,
      classification: classification.classification,
      pdfUrl,
      processedAt: new Date().toISOString(),
      confidence: classification.classification.confidence,
      language: classification.classification.language,
      summary: classification.classification.summary,
      keywords: classification.classification.keywords,
      wordCount: extractedText.wordCount,
      characterCount: extractedText.characterCount
    };
    
    const { error: updateError } = await supabase
      .from('documents')
      .update({
        ai_analysis: aiAnalysis,
        keywords: classification.classification.keywords,
        language: classification.classification.language,
        confidence: classification.classification.confidence,
        document_type: classification.classification.categories[0] || 'Unknown'
      })
      .eq('id', documentId);
      
    if (updateError) {
      throw updateError;
    }
    
    console.log(`AI processing completed successfully for document: ${documentId}`);
    
  } catch (error) {
    console.error('AI processing failed:', error);
    // Update status to failed (you might want to add a status field to your schema)
    // await supabase
    //   .from('documents')
    //   .update({ status: 'failed' })
    //   .eq('id', documentId);
  }
};

/**
 * Get a document by ID
 */
export const getDocument = async (documentId: string): Promise<Document | null> => {
  try {
    const { data: document, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw error;
    }
    
    return document as Document;
  } catch (error) {
    console.error('Error getting document:', error);
    throw error;
  }
};

/**
 * Get all documents for a user
 */
export const getUserDocuments = async (
  userId: string,
  category?: string,
  orderByField: string = 'uploadedAt',
  orderDirection: 'asc' | 'desc' = 'desc'
): Promise<Document[]> => {
  try {
    console.log('🔍 DEBUG - getUserDocuments called with:');
    console.log('User ID:', userId);
    console.log('Category:', category);
    console.log('Order By:', orderByField);
    console.log('Order Direction:', orderDirection);

    let query = supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order(orderByField, { ascending: orderDirection === 'asc' });
    
    if (category) {
      query = query.eq('category', category);
    }
    
    console.log('🔍 DEBUG - Query created for Supabase');
    
    const { data: documents, error } = await query;
    
    if (error) {
      console.error('❌ ERROR in getUserDocuments:', error);
      throw error;
    }
    
    console.log('🔍 DEBUG - Number of documents found:', documents?.length || 0);
    console.log('🔍 DEBUG - Final documents array:', documents);
    
    return (documents || []) as Document[];
  } catch (error) {
    console.error('❌ ERROR in getUserDocuments:', error);
    throw error;
  }
};

/**
 * Update a document's metadata
 */
export const updateDocument = async (
  documentId: string,
  updates: Partial<Document>
): Promise<void> => {
  try {
    // Add last modified timestamp
    const updatedData = {
      ...updates,
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('documents')
      .update(updatedData)
      .eq('id', documentId);
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating document:', error);
    throw error;
  }
};

/**
 * Delete a document from database and Storage
 */
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    // Get document data to get the storage path
    const { data: document, error: fetchError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .single();
    
    if (fetchError || !document) {
      throw new Error('Document not found');
    }
    
    // Delete from Storage
    if (document.path) {
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([document.path]);
      
      if (storageError) {
        console.warn('Failed to delete from storage:', storageError);
      }
    }
    
    // Delete from database
    const { error: deleteError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    if (deleteError) {
      throw deleteError;
    }
    
    // Clear storage cache to reflect deletion
    clearStorageCache(document.userId);
  } catch (error) {
    console.error('Error deleting document:', error);
    throw error;
  }
};

/**
 * Search documents by name, tags, or content
 */
export const searchDocuments = async (
  userId: string,
  searchTerm: string
): Promise<Document[]> => {
  try {
    // For basic search, we'll just query by userId and filter client-side
    // In a production app, you would use a more sophisticated search solution like Algolia
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    // Simple client-side filtering
    const filteredDocuments = (documents || []).filter((doc: Document) => {
      return (
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (doc.tags && doc.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (doc.metadata && doc.metadata.content && doc.metadata.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
    
    return filteredDocuments as Document[];
  } catch (error) {
    console.error('Error searching documents:', error);
    throw error;
  }
};

/**
 * Get document categories for a user
 */
export const getDocumentCategories = async (userId: string): Promise<string[]> => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('category')
      .eq('user_id', userId)
      .not('category', 'is', null);
    
    if (error) {
      throw error;
    }
    
    const categories = new Set<string>();
    (documents || []).forEach((doc: any) => {
      if (doc.category) {
        categories.add(doc.category);
      }
    });
    
    return Array.from(categories);
  } catch (error) {
    console.error('Error getting document categories:', error);
    throw error;
  }
};

/**
 * Get document tags for a user
 */
export const getDocumentTags = async (userId: string): Promise<string[]> => {
  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('tags')
      .eq('user_id', userId)
      .not('tags', 'is', null);
    
    if (error) {
      throw error;
    }
    
    const tags = new Set<string>();
    (documents || []).forEach((doc: any) => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag: string) => tags.add(tag));
      }
    });
    
    return Array.from(tags);
  } catch (error) {
    console.error('Error getting document tags:', error);
    throw error;
  }
};
