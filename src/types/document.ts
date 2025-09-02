export interface Document {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  mimeType?: string;
  category?: string;
  ai_category?: string;
  ai_confidence?: number;
  ai_keywords?: string[];
  extracted_text?: string;
  language?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  createdAt?: string;
  uploadedAt?: string;
  tags?: string[];
  metadata?: {
    language?: string;
    isTranslation?: boolean;
    originalDocumentId?: string;
    sourceLanguage?: string;
    targetLanguage?: string;
    translationConfidence?: number;
    translations?: Record<string, any>;
    confidence?: number;
    extractedText?: string;
    keywords?: string[];
    documentType?: string;
  };
  aiClassification?: {
    category: string;
    confidence: number;
  };
}

export interface DocumentUploadResult {
  data?: Document;
  error?: {
    message: string;
  };
}

export interface DocumentMetadata {
  category: string;
  confidence: number;
  extractedText?: string;
  keywords: string[];
  language?: string;
  documentType?: string;
  method?: string;
}
