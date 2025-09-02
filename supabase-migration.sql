-- Migration script to add missing columns to existing documents table
-- Run this in Supabase SQL Editor if documents table already exists

-- Add missing columns for AI analysis
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS confidence FLOAT,
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS language TEXT;

-- Add indexes for new columns
CREATE INDEX IF NOT EXISTS idx_documents_keywords ON documents USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_documents_confidence ON documents(confidence);
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_language ON documents(language);

-- Update existing documents with default values
UPDATE documents 
SET 
  keywords = '{}',
  confidence = 0.0,
  document_type = 'Unknown Document',
  language = 'en'
WHERE keywords IS NULL OR confidence IS NULL OR document_type IS NULL OR language IS NULL;
