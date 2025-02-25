
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Validation of required environment variables
const requiredEnvVars = {
  GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
};

// CORS headers for browser access
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

class YouTubeError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
    this.name = 'YouTubeError';
  }
}

const supabase = createClient(
  requiredEnvVars.SUPABASE_URL!,
  requiredEnvVars.SUPABASE_SERVICE_ROLE_KEY!
);

const extractVideoId = (url: string): string => {
  console.log('Processing URL:', url);
  
  if (!url) {
    throw new YouTubeError('URL is required');
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu.be\/)([^&\n?#]+)/,
    /(?:youtube.com\/shorts\/)([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      console.log('Found video ID:', match[1]);
      return match[1];
    }
  }

  throw new YouTubeError('Invalid YouTube URL format');
};

const getVideoMetadata = async (videoId: string) => {
  console.log('Fetching metadata for video:', videoId);
  
  const response = await fetch(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
  );

  if (!response.ok) {
    throw new YouTubeError('Video not found or not accessible', 404);
  }

  const data = await response.json();
  console.log('Successfully retrieved video metadata');
  return data;
};

const fetchTranscript = async (videoId: string): Promise<string> => {
  console.log('Fetching transcript for video:', videoId);
  
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  if (!response.ok) {
    throw new YouTubeError('Failed to fetch video page');
  }

  const html = await response.text();
  const captionsMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/);
  
  if (!captionsMatch) {
    throw new YouTubeError('No captions found for this video', 404);
  }

  const captionUrl = decodeURIComponent(captionsMatch[1]);
  console.log('Found caption URL');

  const transcriptResponse = await fetch(captionUrl);
  if (!transcriptResponse.ok) {
    throw new YouTubeError('Failed to fetch transcript');
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

  console.log('Successfully fetched transcript, length:', transcript.length);
  return transcript;
};

const extractRecipe = async (transcript: string, metadata: any) => {
  console.log('Extracting recipe from transcript');
  
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
      'Authorization': `Bearer ${requiredEnvVars.GEMINI_API_KEY}`
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
    throw new Error('Failed to process recipe with Gemini API');
  }

  const data = await response.json();
  const recipeText = data.candidates[0].content.parts[0].text;
  
  const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Gemini');
  }

  const recipe = JSON.parse(jsonMatch[0]);
  console.log('Recipe extracted successfully');
  return recipe;
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Starting request processing`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate environment variables
    for (const [key, value] of Object.entries(requiredEnvVars)) {
      if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
      }
    }

    if (req.method !== 'POST') {
      throw new YouTubeError('Method not allowed', 405);
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new YouTubeError('Content-Type must be application/json');
    }

    const { url } = await req.json();
    if (!url) {
      throw new YouTubeError('URL is required');
    }

    console.log(`[${requestId}] Processing YouTube URL:`, url);
    
    const videoId = extractVideoId(url);
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId)
    ]);

    const recipe = await extractRecipe(transcript, metadata);

    console.log(`[${requestId}] Request completed successfully`);
    return new Response(JSON.stringify({ recipe }), {
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
