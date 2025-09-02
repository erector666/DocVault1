# DocVault API Documentation

## Overview

DocVault uses Supabase as its backend service, providing a PostgreSQL database, authentication, storage, and Edge Functions. This document covers the main API endpoints and service integrations.

## Authentication API

### Supabase Auth

```typescript
import { supabase } from './services/supabase';

// Sign up with email and password
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
});

// Sign in with email and password
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Reset password
const { error } = await supabase.auth.resetPasswordForEmail('user@example.com');
```

### Auth State Management

```typescript
// Listen to auth state changes
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('User signed in:', session.user);
  } else if (event === 'SIGNED_OUT') {
    console.log('User signed out');
  }
});
```

## Database API

### Documents Table

```typescript
// Get user documents
const { data: documents, error } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)
  .order('created_at', { ascending: false });

// Insert new document
const { data, error } = await supabase
  .from('documents')
  .insert({
    user_id: userId,
    name: 'document.pdf',
    size: 1024000,
    mime_type: 'application/pdf',
    category: 'Invoice',
    url: 'https://storage-url/document.pdf',
    ai_classification: {
      category: 'Invoice',
      confidence: 0.95,
      method: 'ml'
    },
    extracted_text: 'Document content...',
    language: 'en'
  });

// Update document
const { data, error } = await supabase
  .from('documents')
  .update({ category: 'Contract' })
  .eq('id', documentId);

// Delete document
const { error } = await supabase
  .from('documents')
  .delete()
  .eq('id', documentId);
```

### Categories Table

```typescript
// Get user categories
const { data: categories, error } = await supabase
  .from('categories')
  .select('*')
  .eq('user_id', userId);

// Create category
const { data, error } = await supabase
  .from('categories')
  .insert({
    user_id: userId,
    name: 'Tax Documents',
    color: '#10B981'
  });

// Update category
const { data, error } = await supabase
  .from('categories')
  .update({ name: 'Updated Name', color: '#EF4444' })
  .eq('id', categoryId);

// Delete category
const { error } = await supabase
  .from('categories')
  .delete()
  .eq('id', categoryId);
```

## Storage API

### File Upload

```typescript
// Upload file to storage
const filePath = `${userId}/${Date.now()}-${file.name}`;
const { data, error } = await supabase.storage
  .from('documents')
  .upload(filePath, file);

// Get public URL
const { data } = supabase.storage
  .from('documents')
  .getPublicUrl(filePath);

// Download file
const { data, error } = await supabase.storage
  .from('documents')
  .download(filePath);

// Delete file
const { error } = await supabase.storage
  .from('documents')
  .remove([filePath]);
```

### Storage Policies

Row Level Security (RLS) policies ensure users can only access their own files:

```sql
-- Users can upload to their own folder
CREATE POLICY "Users can upload own documents" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can view their own documents
CREATE POLICY "Users can view own documents" ON storage.objects
  FOR SELECT USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own documents
CREATE POLICY "Users can delete own documents" ON storage.objects
  FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## Edge Functions

### Document Processing Function

```typescript
// Process document with AI
const { data, error } = await supabase.functions.invoke('process-document', {
  body: {
    documentId: 'doc-123',
    extractText: true,
    classify: true,
    detectLanguage: true
  }
});
```

### Translation Function

```typescript
// Translate document text
const { data, error } = await supabase.functions.invoke('translate-text', {
  body: {
    text: 'Hello world',
    targetLanguage: 'es',
    sourceLanguage: 'en'
  }
});
```

### Document Conversion Function

```typescript
// Convert document format
const { data, error } = await supabase.functions.invoke('convert-document', {
  body: {
    documentId: 'doc-123',
    targetFormat: 'pdf',
    options: {
      quality: 'high',
      compression: true
    }
  }
});
```

## AI Services API

### Document Classification

```typescript
import { classifyDocument } from './services/aiService';

// Classify document
const classification = await classifyDocument(
  'invoice.pdf',
  'application/pdf',
  'Invoice #123 Total: $500.00'
);

// Returns:
// {
//   category: 'Invoice',
//   confidence: 0.95,
//   method: 'ml',
//   keywords: ['invoice', 'total', 'amount']
// }
```

### Text Extraction (OCR)

```typescript
import { extractTextFromDocument } from './services/aiService';

// Extract text from file
const text = await extractTextFromDocument(file);

// Supports: PDF, images (JPG, PNG, GIF), text files
```

### Language Detection

```typescript
import { detectLanguage } from './services/aiService';

// Detect document language
const result = detectLanguage('This is an English document');

// Returns:
// {
//   language: 'en',
//   confidence: 0.98
// }
```

## Search API

### Full-Text Search

```typescript
import { searchDocuments } from './services/searchService';

// Search documents
const results = await searchDocuments(
  'invoice 2024',  // query
  userId,          // user ID
  {                // filters
    category: 'Invoice',
    fileType: 'pdf',
    startDate: '2024-01-01',
    endDate: '2024-12-31'
  },
  10,              // limit
  0                // offset
);

// Returns:
// {
//   documents: [...],
//   totalCount: 25,
//   searchTime: 150
// }
```

### Search Suggestions

```typescript
import { getSearchSuggestions } from './services/searchService';

// Get search suggestions
const suggestions = await getSearchSuggestions('inv', userId);

// Returns: ['invoice', 'inventory', 'investment']
```

## Security API

### File Security Check

```typescript
import { performSecurityCheck } from './services/virusScanner';

// Check file security
const result = await performSecurityCheck(file);

// Returns:
// {
//   passed: true,
//   threats: [],
//   checks: {
//     fileType: true,
//     fileSize: true,
//     virusScan: true
//   }
// }
```

### Audit Logging

```typescript
import { auditLogger } from './services/auditLogger';

// Log user action
auditLogger.logDocumentUpload(
  userId,
  documentId,
  fileName,
  true,  // success
  { fileSize: 1024000 }
);

// Query audit logs
const logs = auditLogger.query({
  userId: 'user-123',
  action: 'DOCUMENT_UPLOAD',
  startDate: Date.now() - 86400000,  // Last 24 hours
  limit: 50
});
```

## Error Handling

### Standard Error Response

```typescript
interface ApiError {
  message: string;
  code: string;
  details?: any;
}

// Example error handling
try {
  const result = await supabase.from('documents').select('*');
} catch (error) {
  console.error('API Error:', {
    message: error.message,
    code: error.code,
    details: error.details
  });
}
```

### Common Error Codes

- `PGRST116`: Row Level Security violation
- `23505`: Unique constraint violation
- `42501`: Insufficient privilege
- `23503`: Foreign key violation
- `22001`: String data too long

## Rate Limiting

Supabase implements rate limiting on API calls:

- **Database queries**: 100 requests per second per IP
- **Storage operations**: 60 requests per minute per IP
- **Auth operations**: 30 requests per hour per IP
- **Edge Functions**: 500 requests per minute per project

## Webhooks

### Database Webhooks

```typescript
// Listen to real-time changes
const subscription = supabase
  .channel('documents')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'documents'
  }, (payload) => {
    console.log('New document:', payload.new);
  })
  .subscribe();

// Unsubscribe
subscription.unsubscribe();
```

### Auth Webhooks

Configure webhooks in Supabase dashboard for:
- User sign up
- User sign in
- Password reset
- Email confirmation

## Performance Optimization

### Query Optimization

```typescript
// Use select to limit columns
const { data } = await supabase
  .from('documents')
  .select('id, name, category, created_at')
  .eq('user_id', userId);

// Use indexes for better performance
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)  // Indexed column
  .eq('category', 'Invoice')  // Indexed column
  .order('created_at', { ascending: false });  // Indexed column
```

### Caching

```typescript
import { documentCache } from './services/cacheManager';

// Cache frequently accessed data
const getCachedDocument = async (id: string) => {
  const cached = documentCache.get(id);
  if (cached) return cached;
  
  const { data } = await supabase
    .from('documents')
    .select('*')
    .eq('id', id)
    .single();
  
  documentCache.set(id, data);
  return data;
};
```

## Testing

### Mock Supabase Client

```typescript
// For testing
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => Promise.resolve({ data: [], error: null }))
    }))
  })),
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn()
  },
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      remove: jest.fn()
    }))
  }
};
```

## Environment Variables

Required environment variables:

```bash
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Optional
GOOGLE_TRANSLATE_API_KEY=your-google-translate-key
REACT_APP_ANALYTICS_ID=your-analytics-id
```

## API Limits

### Supabase Limits (Free Tier)

- **Database**: 500MB storage
- **Storage**: 1GB file storage
- **Bandwidth**: 2GB per month
- **Edge Functions**: 500,000 invocations per month
- **Auth users**: 50,000 monthly active users

### File Upload Limits

- **Max file size**: 10MB per file
- **Supported formats**: PDF, DOC, DOCX, TXT, JPG, PNG, GIF
- **Concurrent uploads**: 5 files at once
- **Daily upload limit**: 100 files per user

---

For more detailed information, refer to the [Supabase Documentation](https://supabase.com/docs) and individual service documentation files.
