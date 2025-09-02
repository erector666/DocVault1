import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Google Cloud Vision API configuration
const GOOGLE_CLOUD_VISION_API_KEY = Deno.env.get('GOOGLE_CLOUD_VISION_API_KEY') || 'AIzaSyB9-fp3cRPul2gSP9QKEOykzJoox9q9cFY';
const GOOGLE_CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate';

interface VisionAPIResponse {
  responses: Array<{
    textAnnotations?: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
    labelAnnotations?: Array<{
      description: string;
      score: number;
    }>;
    safeSearchAnnotation?: {
      adult: string;
      spoof: string;
      medical: string;
      violence: string;
      racy: string;
    };
  }>;
}

async function extractTextFromImage(imageUrl: string, fileName: string): Promise<{
  extractedText: string;
  classification: {
    category: string;
    confidence: number;
    keywords: string[];
    documentType: string;
    language: string;
  };
  processedAt: string;
}> {
  try {
    // Download the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

    const requestBody = {
      requests: [
        {
          image: {
            content: base64Image
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            },
            {
              type: 'LABEL_DETECTION',
              maxResults: 10
            },
            {
              type: 'SAFE_SEARCH_DETECTION',
              maxResults: 1
            }
          ]
        }
      ]
    };

    const response = await fetch(`${GOOGLE_CLOUD_VISION_API_URL}?key=${GOOGLE_CLOUD_VISION_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.statusText}`);
    }

    const data: VisionAPIResponse = await response.json();
    const response_data = data.responses[0];

    // Extract text
    let extractedText = '';
    if (response_data.textAnnotations && response_data.textAnnotations.length > 0) {
      extractedText = response_data.textAnnotations[0].description;
    }

    // Extract labels for classification
    const labels = response_data.labelAnnotations?.map(label => ({
      name: label.description,
      confidence: label.score
    })) || [];

    // Determine document type based on labels and filename
    let documentType = 'Other';
    let category = 'General';
    
    // Check filename for better classification
    const fileNameLower = fileName.toLowerCase();
    const extractedTextLower = extractedText.toLowerCase();
    
    // Financial document detection
    if (labels.some(label => ['receipt', 'invoice', 'bill', 'statement', 'bank', 'financial', 'payment'].includes(label.name.toLowerCase())) ||
        fileNameLower.includes('bank') || fileNameLower.includes('ubs') || fileNameLower.includes('statement') || 
        fileNameLower.includes('receipt') || fileNameLower.includes('invoice') || fileNameLower.includes('bill') ||
        extractedTextLower.includes('bank') || extractedTextLower.includes('ubs') || 
        extractedTextLower.includes('statement') || extractedTextLower.includes('balance') ||
        extractedTextLower.includes('account') || extractedTextLower.includes('transaction')) {
      documentType = 'Financial Document';
      category = 'Financial';
    }
    // ID document detection
    else if (labels.some(label => ['id', 'passport', 'license', 'card', 'identity'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('id') || fileNameLower.includes('passport') || fileNameLower.includes('license') ||
             extractedTextLower.includes('identification') || extractedTextLower.includes('passport')) {
      documentType = 'ID Document';
      category = 'Identity Document';
    }
    // Legal document detection
    else if (labels.some(label => ['contract', 'agreement', 'legal', 'document', 'paper'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('contract') || fileNameLower.includes('agreement') || fileNameLower.includes('legal') ||
             extractedTextLower.includes('contract') || extractedTextLower.includes('agreement') ||
             extractedTextLower.includes('legal') || extractedTextLower.includes('terms')) {
      documentType = 'Legal Document';
      category = 'Legal';
    }
    // Medical document detection
    else if (labels.some(label => ['medical', 'health', 'prescription', 'doctor'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('medical') || fileNameLower.includes('health') || fileNameLower.includes('prescription') ||
             extractedTextLower.includes('medical') || extractedTextLower.includes('health') ||
             extractedTextLower.includes('prescription') || extractedTextLower.includes('doctor')) {
      documentType = 'Medical Document';
      category = 'Medical';
    }
    // Work/Business document detection
    else if (labels.some(label => ['business', 'work', 'office', 'corporate'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('business') || fileNameLower.includes('work') || fileNameLower.includes('corporate') ||
             extractedTextLower.includes('business') || extractedTextLower.includes('work') ||
             extractedTextLower.includes('corporate') || extractedTextLower.includes('office')) {
      documentType = 'Business Document';
      category = 'Work & Business';
    }
    // Education document detection
    else if (labels.some(label => ['education', 'school', 'university', 'certificate'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('education') || fileNameLower.includes('school') || fileNameLower.includes('certificate') ||
             extractedTextLower.includes('education') || extractedTextLower.includes('school') ||
             extractedTextLower.includes('certificate') || extractedTextLower.includes('university')) {
      documentType = 'Education Document';
      category = 'Education';
    }
    // Insurance document detection
    else if (labels.some(label => ['insurance', 'policy', 'coverage'].includes(label.name.toLowerCase())) ||
             fileNameLower.includes('insurance') || fileNameLower.includes('policy') || fileNameLower.includes('coverage') ||
             extractedTextLower.includes('insurance') || extractedTextLower.includes('policy') ||
             extractedTextLower.includes('coverage')) {
      documentType = 'Insurance Document';
      category = 'Insurance';
    }
    // General document detection
    else if (labels.some(label => ['document', 'text', 'paper'].includes(label.name.toLowerCase()))) {
      documentType = 'General Document';
      category = 'Other';
    }

    return {
      extractedText,
      classification: {
        category,
        confidence: labels.length > 0 ? labels[0].confidence : 0.8,
        keywords: labels.map(label => label.name),
        documentType,
        language: 'en' // Default, could be enhanced with language detection
      },
      processedAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error processing image with Google Vision API:', error);
    // Fallback to mock response if API fails
    return {
      extractedText: `Error processing image: ${error.message}`,
      classification: {
        category: 'Error',
        confidence: 0.0,
        keywords: ['error', 'processing_failed'],
        documentType: 'Unknown',
        language: 'en'
      },
      processedAt: new Date().toISOString()
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { fileUrl, fileName, fileType, userId } = await req.json()

    console.log(`Processing document: ${fileName} (${fileType}) for user: ${userId}`);

    let analysisResult;

    if (fileType.includes('image') || fileType.includes('pdf')) {
      // Use Google Cloud Vision API for images and PDFs
      analysisResult = await extractTextFromImage(fileUrl, fileName);
    } else {
      // For other file types, return basic analysis
      analysisResult = {
        extractedText: `Text extraction not supported for ${fileType} files`,
        classification: {
          category: 'Unsupported',
          confidence: 0.5,
          keywords: ['unsupported', 'file_type'],
          documentType: fileType,
          language: 'en'
        },
        processedAt: new Date().toISOString()
      };
    }

    console.log('AI analysis completed:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Document processing error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
