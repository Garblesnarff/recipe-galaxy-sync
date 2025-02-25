
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Custom error class for better error handling
class YouTubeError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'YouTubeError';
  }
}

function validateEnvironment() {
  const required = ['GEMINI_API_KEY', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
  const missing = required.filter(key => !Deno.env.get(key));
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

const extractVideoId = (url: string): string => {
  if (!url) throw new YouTubeError('URL is required');

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu.be\/)([^&\n?#]+)/,
    /(?:youtube.com\/shorts\/)([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new YouTubeError('Invalid YouTube URL format');
};

const getVideoMetadata = async (videoId: string) => {
  try {
    const response = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!response.ok) {
      throw new YouTubeError(`Failed to fetch video metadata: ${response.statusText}`, response.status);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw error;
  }
};

const fetchTranscript = async (videoId: string): Promise<string> => {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new YouTubeError(`Failed to fetch video page: ${response.statusText}`, response.status);
    }

    const html = await response.text();
    const captionsMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/);
    
    if (!captionsMatch) {
      throw new YouTubeError('No captions found for this video', 404);
    }

    const captionUrl = decodeURIComponent(captionsMatch[1]);
    const transcriptResponse = await fetch(captionUrl);
    
    if (!transcriptResponse.ok) {
      throw new YouTubeError(`Failed to fetch transcript: ${transcriptResponse.statusText}`, transcriptResponse.status);
    }

    const transcriptXml = await transcriptResponse.text();
    const textMatches = transcriptXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    const transcript = textMatches
      .map(match => {
        const text = match.replace(/<[^>]+>/g, '');
        return decodeURIComponent(text.trim());
      })
      .join(' ');

    if (!transcript) {
      throw new YouTubeError('Empty transcript');
    }

    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
};

const extractRecipe = async (transcript: string, metadata: any) => {
  try {
    console.log('Extracting recipe with Gemini API');
    const prompt = `You are a professional chef and recipe writer. Convert this YouTube cooking video transcript into a detailed recipe. The video's title is: "${metadata.title}"

    Format the recipe in this exact JSON structure:
    {
      "title": "Recipe name",
      "description": "Brief overview of the dish",
      "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity"],
      "instructions": "Step-by-step instructions",
      "cook_time": "Estimated time (if mentioned)",
      "difficulty": "Easy/Medium/Hard",
      "image_url": "${metadata.thumbnail_url}"
    }

    Analyze this transcript and create a detailed recipe:
    ${transcript}`;

    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${error}`);
    }

    const data = await response.json();
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const recipeText = data.candidates[0].content.parts[0].text;
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }

    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    console.error('Error extracting recipe:', error);
    throw error;
  }
};

serve(async (req) => {
  console.log('Received request:', req.method, req.url);
  const requestId = crypto.randomUUID();

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables first
    validateEnvironment();

    // Validate request method
    if (req.method !== 'POST') {
      throw new YouTubeError('Method not allowed', 405);
    }

    // Validate content type
    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new YouTubeError('Content-Type must be application/json');
    }

    // Parse request body
    const { url } = await req.json();
    if (!url) {
      throw new YouTubeError('URL is required');
    }

    console.log(`[${requestId}] Processing YouTube URL:`, url);
    
    // Extract video ID and fetch data
    const videoId = extractVideoId(url);
    console.log(`[${requestId}] Extracted video ID:`, videoId);

    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId)
    ]);

    console.log(`[${requestId}] Successfully fetched metadata and transcript`);

    // Extract recipe from transcript
    const recipe = await extractRecipe(transcript, metadata);
    console.log(`[${requestId}] Successfully extracted recipe`);

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    const status = error instanceof YouTubeError ? error.status : 500;
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Unknown error',
      request_id: requestId
    };

    return new Response(JSON.stringify(errorResponse), { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
