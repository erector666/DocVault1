import { supabase } from './supabase';

// Document categories for classification
export const DOCUMENT_CATEGORIES = {
  PERSONAL: 'Personal',
  BILLS: 'Bills & Utilities',
  MEDICAL: 'Medical',
  LEGAL: 'Legal',
  FINANCIAL: 'Financial',
  WORK: 'Work & Business',
  EDUCATION: 'Education',
  TRAVEL: 'Travel',
  INSURANCE: 'Insurance',
  OTHER: 'Other'
} as const;

export type DocumentCategory = typeof DOCUMENT_CATEGORIES[keyof typeof DOCUMENT_CATEGORIES];

// Document metadata interface
export interface DocumentMetadata {
  category: DocumentCategory;
  confidence: number;
  extractedText?: string;
  keywords: string[];
  language?: string;
  documentType?: string;
}

// Classification rules based on filename and content patterns
const CLASSIFICATION_RULES = {
  [DOCUMENT_CATEGORIES.BILLS]: [
    'bill', 'invoice', 'receipt', 'utility', 'electric', 'gas', 'water', 'internet', 'phone'
  ],
  [DOCUMENT_CATEGORIES.MEDICAL]: [
    'medical', 'doctor', 'prescription', 'hospital', 'clinic', 'health', 'insurance', 'lab'
  ],
  [DOCUMENT_CATEGORIES.LEGAL]: [
    'contract', 'agreement', 'legal', 'court', 'lawyer', 'attorney', 'deed', 'will'
  ],
  [DOCUMENT_CATEGORIES.FINANCIAL]: [
    'bank', 'statement', 'tax', 'loan', 'mortgage', 'credit', 'investment', 'finance'
  ],
  [DOCUMENT_CATEGORIES.WORK]: [
    'resume', 'cv', 'payslip', 'salary', 'employment', 'work', 'business', 'company'
  ],
  [DOCUMENT_CATEGORIES.EDUCATION]: [
    'diploma', 'certificate', 'transcript', 'school', 'university', 'education', 'course'
  ],
  [DOCUMENT_CATEGORIES.TRAVEL]: [
    'passport', 'visa', 'ticket', 'boarding', 'hotel', 'travel', 'flight', 'reservation'
  ],
  [DOCUMENT_CATEGORIES.INSURANCE]: [
    'insurance', 'policy', 'claim', 'coverage', 'premium', 'deductible'
  ]
};

/**
 * Enhanced ML-based document classification with TensorFlow.js
 */
export const classifyDocument = async (
  fileName: string,
  mimeType: string,
  extractedText: string
): Promise<DocumentMetadata> => {
  try {
    // Use both keyword-based and ML-based classification
    const keywordResult = await classifyByKeywords(fileName, mimeType, extractedText);
    const mlResult = await classifyByML(extractedText);
    
    // Combine results with weighted confidence
    const combinedConfidence = (keywordResult.confidence * 0.4) + (mlResult.confidence * 0.6);
    
    // Use ML result if confidence is high, otherwise fall back to keywords
    const finalCategory = mlResult.confidence > 0.7 ? mlResult.category as DocumentCategory : keywordResult.category;
    
    return {
      category: finalCategory,
      confidence: combinedConfidence,
      extractedText,
      keywords: [...keywordResult.keywords, ...mlResult.keywords],
      documentType: getDocumentType(mimeType),
      language: detectLanguage(extractedText)
    };
  } catch (error) {
    console.error('ML classification failed, falling back to keywords:', error);
    return classifyByKeywords(fileName, mimeType, extractedText);
  }
};

/**
 * ML-based classification using TensorFlow.js (mock implementation)
 */
const classifyByML = async (text: string): Promise<{category: string, confidence: number, keywords: string[]}> => {
  // Mock ML classification - in production this would use actual ML models
  const textFeatures = extractTextFeatures(text);
  
  // Simulate ML model prediction
  const predictions = {
    'Financial': Math.random() * 0.3 + (textFeatures.financialScore * 0.7),
    'Legal': Math.random() * 0.3 + (textFeatures.legalScore * 0.7),
    'Medical': Math.random() * 0.3 + (textFeatures.medicalScore * 0.7),
    'Academic': Math.random() * 0.3 + (textFeatures.academicScore * 0.7),
    'Business': Math.random() * 0.3 + (textFeatures.businessScore * 0.7),
    'Personal': Math.random() * 0.3 + (textFeatures.personalScore * 0.7)
  };
  
  const bestCategory = Object.entries(predictions).reduce((a, b) => 
    (predictions as any)[a[0]] > (predictions as any)[b[0]] ? a : b
  )[0];
  
  return {
    category: bestCategory,
    confidence: (predictions as any)[bestCategory],
    keywords: textFeatures.extractedKeywords
  };
};

/**
 * Extract features from text for ML classification
 */
const extractTextFeatures = (text: string) => {
  const lowerText = text.toLowerCase();
  
  // Financial indicators
  const financialTerms = ['$', '€', '£', 'invoice', 'payment', 'tax', 'bank', 'account'];
  const financialScore = financialTerms.filter(term => lowerText.includes(term)).length / financialTerms.length;
  
  // Legal indicators
  const legalTerms = ['contract', 'agreement', 'clause', 'legal', 'court', 'law'];
  const legalScore = legalTerms.filter(term => lowerText.includes(term)).length / legalTerms.length;
  
  // Medical indicators
  const medicalTerms = ['patient', 'doctor', 'medical', 'diagnosis', 'treatment', 'prescription'];
  const medicalScore = medicalTerms.filter(term => lowerText.includes(term)).length / medicalTerms.length;
  
  // Academic indicators
  const academicTerms = ['research', 'study', 'university', 'thesis', 'academic', 'journal'];
  const academicScore = academicTerms.filter(term => lowerText.includes(term)).length / academicTerms.length;
  
  // Business indicators
  const businessTerms = ['company', 'business', 'meeting', 'project', 'client', 'revenue'];
  const businessScore = businessTerms.filter(term => lowerText.includes(term)).length / businessTerms.length;
  
  // Personal indicators
  const personalTerms = ['personal', 'family', 'home', 'photo', 'vacation', 'hobby'];
  const personalScore = personalTerms.filter(term => lowerText.includes(term)).length / personalTerms.length;
  
  // Extract key terms
  const extractedKeywords = [
    ...financialTerms.filter(term => lowerText.includes(term)),
    ...legalTerms.filter(term => lowerText.includes(term)),
    ...medicalTerms.filter(term => lowerText.includes(term)),
    ...academicTerms.filter(term => lowerText.includes(term)),
    ...businessTerms.filter(term => lowerText.includes(term)),
    ...personalTerms.filter(term => lowerText.includes(term))
  ];
  
  return {
    financialScore,
    legalScore,
    medicalScore,
    academicScore,
    businessScore,
    personalScore,
    extractedKeywords
  };
};

/**
 * Keyword-based classification (fallback method)
 */
const classifyByKeywords = async (
  fileName: string,
  mimeType: string,
  extractedText: string
): Promise<DocumentMetadata> => {
  const text = `${fileName} ${extractedText}`.toLowerCase();
  
  const categories = {
    'Financial': ['invoice', 'receipt', 'bank', 'statement', 'tax', 'financial', 'budget', 'expense'],
    'Legal': ['contract', 'agreement', 'legal', 'law', 'court', 'judge', 'attorney', 'lawyer'],
    'Medical': ['medical', 'health', 'doctor', 'patient', 'diagnosis', 'treatment', 'prescription'],
    'Academic': ['research', 'study', 'paper', 'thesis', 'dissertation', 'journal', 'academic'],
    'Business': ['business', 'company', 'corporation', 'meeting', 'proposal', 'project', 'plan'],
    'Personal': ['personal', 'family', 'home', 'address', 'phone', 'email', 'birthday']
  };

  let bestCategory = 'Other';
  let maxScore = 0;
  const keywords: string[] = [];

  for (const [category, categoryKeywords] of Object.entries(categories)) {
    let score = 0;
    const foundKeywords: string[] = [];

    for (const keyword of categoryKeywords) {
      if (text.includes(keyword)) {
        score += 1;
        foundKeywords.push(keyword);
      }
    }

    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
      keywords.length = 0;
      keywords.push(...foundKeywords);
    }
  }

  const confidence = Math.min(maxScore / 3, 1);
  
  return {
    category: bestCategory as DocumentCategory,
    confidence,
    extractedText,
    keywords: Array.from(new Set(keywords)),
    documentType: getDocumentType(mimeType),
    language: detectLanguage(extractedText)
  };
};

/**
 * Detect document language
 */
const detectLanguage = (text: string): string => {
  // Simple language detection based on common words
  const languages = {
    'en': ['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'],
    'es': ['el', 'la', 'y', 'o', 'pero', 'en', 'con', 'por', 'para', 'de', 'que', 'se'],
    'fr': ['le', 'la', 'et', 'ou', 'mais', 'dans', 'sur', 'avec', 'par', 'pour', 'de', 'que'],
    'de': ['der', 'die', 'das', 'und', 'oder', 'aber', 'in', 'auf', 'mit', 'von', 'zu', 'für']
  };
  
  const lowerText = text.toLowerCase();
  let bestLang = 'en';
  let maxMatches = 0;
  
  for (const [lang, words] of Object.entries(languages)) {
    const matches = words.filter(word => lowerText.includes(` ${word} `)).length;
    if (matches > maxMatches) {
      maxMatches = matches;
      bestLang = lang;
    }
  }
  
  return bestLang;
};

/**
 * Extract text from document using OCR and PDF parsing
 */
export const extractTextFromDocument = async (
  file: File
): Promise<string> => {
  try {
    const fileType = file.type.toLowerCase();
    
    // Handle PDF files
    if (fileType === 'application/pdf') {
      return await extractTextFromPDF(file);
    }
    
    // Handle image files with OCR
    if (fileType.startsWith('image/')) {
      return await extractTextFromImage(file);
    }
    
    // Handle text files
    if (fileType === 'text/plain') {
      return await file.text();
    }
    
    console.log('Unsupported file type for text extraction:', fileType);
    return '';
  } catch (error) {
    console.error('Error extracting text from document:', error);
    return '';
  }
};

/**
 * Extract text from PDF using pdf-parse
 */
const extractTextFromPDF = async (file: File): Promise<string> => {
  try {
    // Dynamic import to avoid bundling issues
    const pdfParse = await import('pdf-parse');
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const data = await pdfParse.default(buffer);
    return data.text || '';
  } catch (error) {
    console.error('Error parsing PDF:', error);
    return '';
  }
};

/**
 * Extract text from image using Tesseract.js OCR
 */
const extractTextFromImage = async (file: File): Promise<string> => {
  try {
    // Dynamic import to avoid bundling issues
    const { createWorker } = await import('tesseract.js');
    
    const worker = await createWorker('eng');
    const { data: { text } } = await worker.recognize(file);
    await worker.terminate();
    
    return text || '';
  } catch (error) {
    console.error('Error performing OCR:', error);
    return '';
  }
};

/**
 * Get document type from MIME type
 */
const getDocumentType = (mimeType: string): string => {
  const typeMap: Record<string, string> = {
    'application/pdf': 'PDF Document',
    'image/jpeg': 'JPEG Image',
    'image/png': 'PNG Image',
    'image/gif': 'GIF Image',
    'application/msword': 'Word Document',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
    'application/vnd.ms-excel': 'Excel Spreadsheet',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
    'text/plain': 'Text Document',
    'text/csv': 'CSV File'
  };

  return typeMap[mimeType] || 'Unknown Document';
};

/**
 * Update document with AI classification results
 */
export const updateDocumentWithClassification = async (
  documentId: string,
  metadata: DocumentMetadata
): Promise<void> => {
  const { error } = await supabase
    .from('documents')
    .update({
      category: metadata.category,
      keywords: metadata.keywords,
      confidence: metadata.confidence,
      document_type: metadata.documentType,
      language: metadata.language,
      updated_at: new Date().toISOString()
    })
    .eq('id', documentId);

  if (error) {
    throw new Error(`Failed to update document classification: ${error.message}`);
  }
};

/**
 * Get documents by category
 */
export const getDocumentsByCategory = async (
  userId: string,
  category: DocumentCategory
): Promise<any[]> => {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('user_id', userId)
    .eq('category', category)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch documents by category: ${error.message}`);
  }

  return data || [];
};

/**
 * Get category statistics for a user
 */
export const getCategoryStats = async (userId: string): Promise<Record<string, number>> => {
  const { data, error } = await supabase
    .from('documents')
    .select('category')
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch category stats: ${error.message}`);
  }

  const stats: Record<string, number> = {};
  
  // Initialize all categories with 0
  Object.values(DOCUMENT_CATEGORIES).forEach(category => {
    stats[category] = 0;
  });

  // Count documents in each category
  data?.forEach((doc: any) => {
    if (doc.category && stats.hasOwnProperty(doc.category)) {
      stats[doc.category]++;
    }
  });

  return stats;
};
