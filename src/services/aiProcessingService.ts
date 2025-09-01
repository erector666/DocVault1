import { 
  classifyDocument, 
  extractTextFromDocument, 
  detectLanguage, 
  generateDocumentSummary 
} from './classificationService';
import { updateDocument } from './documentService';

export interface AIProcessingResult {
  extractedText: string;
  categories: string[];
  tags: string[];
  language: string;
  summary: string;
  confidence: number;
}

/**
 * Process a document with AI after upload
 */
export const processDocumentWithAI = async (
  documentId: string,
  documentUrl: string,
  documentType: string
): Promise<AIProcessingResult> => {
  try {
    console.log('🤖 Starting AI processing for document:', documentId);
    
    // Step 1: Extract text from document
    console.log('📝 Extracting text...');
    const extractedText = await extractTextFromDocument(documentUrl, documentType);
    
    // Step 2: Detect language
    console.log('🗣️ Detecting language...');
    const language = await detectLanguage(documentUrl, documentType);
    
    // Step 3: Classify document
    console.log('🏷️ Classifying document...');
    const classification = await classifyDocument(documentId, documentUrl, documentType);
    
    // Step 4: Generate summary
    console.log('📄 Generating summary...');
    const summary = await generateDocumentSummary(documentUrl, documentType);
    
    // Combine all AI results
    const aiResult: AIProcessingResult = {
      extractedText,
      categories: classification.categories,
      tags: classification.tags,
      language,
      summary: summary || 'Summary not available',
      confidence: classification.confidence
    };
    
    console.log('✅ AI processing completed:', aiResult);
    
    // Update document with AI results
    await updateDocument(documentId, {
      metadata: {
        aiProcessed: true,
        extractedText,
        categories: classification.categories,
        tags: classification.tags,
        language,
        summary: summary,
        confidence: classification.confidence,
        processedAt: new Date().toISOString()
      }
    });
    
    return aiResult;
  } catch (error) {
    console.error('❌ AI processing failed:', error);
    throw error;
  }
};
