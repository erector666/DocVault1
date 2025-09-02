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
    const { text, targetLanguage, sourceLanguage = 'auto' } = await req.json()

    // Google Translate API endpoint
    const apiKey = Deno.env.get('GOOGLE_TRANSLATE_API_KEY') || 'AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY';
    if (!apiKey) {
      throw new Error('Google Translate API key not configured')
    }

    const translateUrl = `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`
    
    const response = await fetch(translateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: text,
        target: targetLanguage,
        source: sourceLanguage === 'auto' ? undefined : sourceLanguage,
        format: 'text'
      })
    })

    if (!response.ok) {
      throw new Error(`Google Translate API error: ${response.statusText}`)
    }

    const data = await response.json()
    const translation = data.data.translations[0]

    return new Response(
      JSON.stringify({
        translatedText: translation.translatedText,
        detectedSourceLanguage: translation.detectedSourceLanguage,
        confidence: 0.95 // Google Translate doesn't provide confidence scores
      }),
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
