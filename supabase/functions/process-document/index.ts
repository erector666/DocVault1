import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileName, fileType, userId } = await req.json()

    // This would integrate with Google Cloud Vision API for OCR
    // For now, return a mock response
    const mockAnalysis = {
      extractedText: `Mock extracted text from ${fileName}`,
      classification: {
        category: 'Other',
        confidence: 0.8,
        keywords: ['document', 'text'],
        documentType: fileType.includes('pdf') ? 'PDF Document' : 'Image Document',
        language: 'en'
      },
      processedAt: new Date().toISOString()
    }

    return new Response(
      JSON.stringify(mockAnalysis),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
