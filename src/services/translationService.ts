import { supabase } from './supabase';
import { Document } from './documentService';

export interface TranslationResult {
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
}

export interface SupportedLanguage {
  code: string;
  name: string;
}

/**
 * Real translation service using Google Translate API
 */
export const translateDocument = async (
  documentId: string,
  documentUrl: string,
  documentType: string,
  targetLanguage: string,
  sourceLanguage?: string
): Promise<TranslationResult> => {
  try {
    // Get document from Supabase to extract text
    const { data: document, error } = await supabase
      .from('documents')
      .select('ai_analysis')
      .eq('id', documentId)
      .single();

    if (error || !document?.ai_analysis?.extractedText) {
      throw new Error('Document text not available for translation');
    }

    const textToTranslate = document.ai_analysis.extractedText;
    
    // Use Google Translate API via Supabase Edge Function
    const { data: translationData, error: translateError } = await supabase.functions
      .invoke('translate-text', {
        body: {
          text: textToTranslate,
          targetLanguage,
          sourceLanguage: sourceLanguage || 'auto'
        }
      });

    if (translateError) {
      console.error('Translation API error:', translateError);
      // Fallback to mock translation if API fails
      return {
        translatedText: `[Translation unavailable - API error]`,
        sourceLanguage: sourceLanguage || 'en',
        targetLanguage,
        confidence: 0.0
      };
    }

    return {
      translatedText: translationData.translatedText,
      sourceLanguage: translationData.detectedSourceLanguage || sourceLanguage || 'en',
      targetLanguage,
      confidence: translationData.confidence || 0.95
    };
  } catch (error) {
    console.error('Error translating document:', error);
    throw new Error('Translation service temporarily unavailable');
  }
};

/**
 * Get supported languages for translation
 */
export const getSupportedLanguages = async (): Promise<SupportedLanguage[]> => {
  try {
    // Mock supported languages
    // In production, this would fetch from translation API
    const supportedLanguages: SupportedLanguage[] = [
      { code: 'en', name: 'English' },
      { code: 'mk', name: 'Macedonian' },
      { code: 'fr', name: 'French' },
      { code: 'es', name: 'Spanish' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' }
    ];

    return supportedLanguages;
  } catch (error) {
    console.error('Error getting supported languages:', error);
    throw error;
  }
};

/**
 * Save a translated version of a document
 */
export const saveTranslatedDocument = async (
  originalDocument: Document,
  translationResult: TranslationResult
): Promise<Document> => {
  try {
    // Create metadata for the translated document
    const translatedMetadata = {
      ...originalDocument.metadata,
      isTranslation: true,
      originalDocumentId: originalDocument.id,
      sourceLanguage: translationResult.sourceLanguage,
      targetLanguage: translationResult.targetLanguage,
      translationConfidence: translationResult.confidence
    };

    // Create a new document entry for the translated version
    const translatedDocumentData = {
      name: `${originalDocument.name} (${translationResult.targetLanguage})`,
      url: originalDocument.url, // In production, this would be a new URL for translated content
      type: originalDocument.type,
      size: originalDocument.size,
      user_id: originalDocument.user_id,
      category: originalDocument.category,
      metadata: translatedMetadata
    };

    const { data: newDocument, error: insertError } = await supabase
      .from('documents')
      .insert([translatedDocumentData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`Failed to save translated document: ${insertError.message}`);
    }

    // Update the original document to include reference to this translation
    const originalTranslations = originalDocument.metadata?.translations || {};
    originalTranslations[translationResult.targetLanguage] = {
      timestamp: Date.now(),
      confidence: translationResult.confidence
    };

    const { error: updateError } = await supabase
      .from('documents')
      .update({
        metadata: {
          ...originalDocument.metadata,
          translations: originalTranslations
        }
      })
      .eq('id', originalDocument.id);

    if (updateError) {
      console.warn('Failed to update original document with translation reference:', updateError);
    }

    return newDocument as Document;
  } catch (error) {
    console.error('Error saving translated document:', error);
    throw error;
  }
};

