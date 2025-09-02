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
  aiClassification?: {
    category: string;
    confidence: number;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
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
