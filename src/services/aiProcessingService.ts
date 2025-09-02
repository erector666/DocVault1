import { supabase } from './supabase';

export interface AIProcessingResult {
  extractedText: string;
  categories: string[];
  tags: string[];
  language: string;
  summary: string;
  confidence: number;
}

/**
 * Process a document with AI after upload using Supabase Edge Functions
 */
export const processDocumentWithAI = async (
  documentId: string,
  documentUrl: string,
  documentType: string
): Promise<AIProcessingResult> => {
  try {
    console.log('🤖 Starting AI processing for document:', documentId);
    
    // Use Supabase Edge Function for document processing
    const { data: aiResult, error } = await supabase.functions
      .invoke('process-document', {
        body: {
          fileUrl: documentUrl,
          fileName: documentId,
          fileType: documentType,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

    if (error) {
      console.error('AI processing error:', error);
      throw new Error(`AI processing failed: ${error.message}`);
    }

    console.log('✅ AI processing completed:', aiResult);
    
    // Update document with AI results
    await supabase
      .from('documents')
      .update({
        ai_analysis: {
          extractedText: aiResult.extractedText,
          categories: [aiResult.classification.category],
          tags: aiResult.classification.keywords,
          language: aiResult.classification.language,
          summary: aiResult.extractedText.substring(0, 200) + '...',
          confidence: aiResult.classification.confidence,
          processedAt: aiResult.processedAt
        }
      })
      .eq('id', documentId);

    return {
      extractedText: aiResult.extractedText,
      categories: [aiResult.classification.category],
      tags: aiResult.classification.keywords,
      language: aiResult.classification.language,
      summary: aiResult.extractedText.substring(0, 200) + '...',
      confidence: aiResult.classification.confidence
    };
  } catch (error) {
    console.error('❌ AI processing failed:', error);
    throw error;
  }
};

/**
 * Extract text from a document using Supabase Edge Functions
 */
export const extractTextFromDocument = async (
  documentUrl: string,
  documentType: string
): Promise<string> => {
  try {
    const { data: result, error } = await supabase.functions
      .invoke('process-document', {
        body: {
          fileUrl: documentUrl,
          fileName: 'extract-text',
          fileType: documentType,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

    if (error) {
      throw new Error(`Text extraction failed: ${error.message}`);
    }

    return result.extractedText;
  } catch (error) {
    console.error('Error extracting text:', error);
    throw error;
  }
};

/**
 * Classify a document using AI
 */
export const classifyDocument = async (
  documentId: string,
  documentUrl: string,
  documentType: string
): Promise<{ categories: string[]; tags: string[]; confidence: number }> => {
  try {
    const { data: result, error } = await supabase.functions
      .invoke('process-document', {
        body: {
          fileUrl: documentUrl,
          fileName: documentId,
          fileType: documentType,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

    if (error) {
      throw new Error(`Document classification failed: ${error.message}`);
    }

    return {
      categories: [result.classification.category],
      tags: result.classification.keywords,
      confidence: result.classification.confidence
    };
  } catch (error) {
    console.error('Error classifying document:', error);
    throw error;
  }
};

/**
 * Detect language of a document
 */
export const detectLanguage = async (
  documentUrl: string,
  documentType: string
): Promise<string> => {
  try {
    const { data: result, error } = await supabase.functions
      .invoke('process-document', {
        body: {
          fileUrl: documentUrl,
          fileName: 'detect-language',
          fileType: documentType,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

    if (error) {
      throw new Error(`Language detection failed: ${error.message}`);
    }

    return result.classification.language;
  } catch (error) {
    console.error('Error detecting language:', error);
    throw error;
  }
};

/**
 * Generate document summary
 */
export const generateDocumentSummary = async (
  documentUrl: string,
  documentType: string,
  maxLength: number = 200
): Promise<string> => {
  try {
    const { data: result, error } = await supabase.functions
      .invoke('process-document', {
        body: {
          fileUrl: documentUrl,
          fileName: 'generate-summary',
          fileType: documentType,
          userId: (await supabase.auth.getUser()).data.user?.id
        }
      });

    if (error) {
      throw new Error(`Summary generation failed: ${error.message}`);
    }

    const text = result.extractedText;
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  } catch (error) {
    console.error('Error generating summary:', error);
    throw error;
  }
};
