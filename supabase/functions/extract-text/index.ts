import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': 'http://localhost:3000',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const { documentUrl, documentType } = await req.json()
    
    if (!documentUrl) {
      throw new Error('Missing required parameter: documentUrl')
    }

    // Extract text from document
    const extractedText = await extractTextFromDocument(documentUrl, documentType)
    
    return new Response(
      JSON.stringify({
        success: true,
        extractedText: extractedText.text,
        confidence: extractedText.confidence,
        language: extractedText.language,
        wordCount: extractedText.wordCount,
        characterCount: extractedText.characterCount
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error('Text extraction error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Text extraction failed'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function extractTextFromDocument(documentUrl: string, documentType: string) {
  // This is a mock implementation - replace with actual text extraction service
  // You can integrate with libraries like pdf-parse, mammoth (for DOCX), etc.
  
  const mockExtractions = {
    'application/pdf': {
      text: 'This is a sample PDF document with extracted text content. It contains various paragraphs and information that has been processed through OCR or PDF parsing technology.',
      confidence: 0.95,
      language: 'en',
      wordCount: 25,
      characterCount: 180
    },
    'application/msword': {
      text: 'This is a sample Word document with extracted text content. The document contains formatted text that has been processed and converted to plain text format.',
      confidence: 0.92,
      language: 'en',
      wordCount: 22,
      characterCount: 165
    },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      text: 'This is a sample DOCX document with extracted text content. Modern Word documents contain rich formatting and can be processed to extract clean text content.',
      confidence: 0.94,
      language: 'en',
      wordCount: 24,
      characterCount: 175
    },
    'text/plain': {
      text: 'This is a plain text document. The content is already in text format and requires minimal processing to extract the information.',
      confidence: 1.0,
      language: 'en',
      wordCount: 18,
      characterCount: 135
    }
  }

  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 800))
  
  return mockExtractions[documentType] || {
    text: 'Text extraction not supported for this document type.',
    confidence: 0.0,
    language: 'en',
    wordCount: 0,
    characterCount: 0
  }
}
