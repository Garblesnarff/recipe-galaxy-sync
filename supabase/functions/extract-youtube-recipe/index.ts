
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

// Validation of required environment variables
const REQUIRED_ENV_VARS = {
  GEMINI_API_KEY: Deno.env.get('GEMINI_API_KEY'),
  SUPABASE_URL: Deno.env.get('SUPABASE_URL'),
  SUPABASE_SERVICE_ROLE_KEY: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
};

// Validate environment variables
Object.entries(REQUIRED_ENV_VARS).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
});

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

class GeminiError extends Error {
  constructor(message: string, public status = 500) {
    super(message);
    this.name = 'GeminiError';
  }
}

const supabase = createClient(
  REQUIRED_ENV_VARS.SUPABASE_URL,
  REQUIRED_ENV_VARS.SUPABASE_SERVICE_ROLE_KEY
);

const extractVideoId = (url: string): string => {
  if (!url) {
    throw new YouTubeError('URL is required', 400);
  }

  console.log('Processing URL:', url);
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

  throw new YouTubeError('Invalid YouTube URL format', 400);
};

const getVideoMetadata = async (videoId: string) => {
  console.log('Fetching video metadata for:', videoId);
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new YouTubeError('Video not found or not accessible', 404);
    }

    const data = await response.json();
    console.log('Video metadata retrieved successfully');
    return data;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw error instanceof YouTubeError ? error : new YouTubeError('Failed to fetch video metadata', 500);
  }
};

const fetchTranscript = async (videoId: string): Promise<string> => {
  console.log('Fetching transcript for:', videoId);
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new YouTubeError('Failed to fetch video page', 500);
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
      throw new YouTubeError('Failed to fetch transcript', 500);
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
      throw new YouTubeError('Empty transcript', 404);
    }

    console.log('Transcript fetched successfully, length:', transcript.length);
    return transcript;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error instanceof YouTubeError ? error : new YouTubeError('Failed to fetch transcript', 500);
  }
};

const extractRecipe = async (transcript: string, metadata: any) => {
  console.log('Extracting recipe from transcript');
  try {
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
        'Authorization': `Bearer ${REQUIRED_ENV_VARS.GEMINI_API_KEY}`
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
      throw new GeminiError('Failed to process recipe', 500);
    }

    const data = await response.json();
    const recipeText = data.candidates[0].content.parts[0].text;
    
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new GeminiError('Invalid response format from Gemini', 500);
    }

    const recipe = JSON.parse(jsonMatch[0]);
    console.log('Recipe extracted successfully');
    return recipe;
  } catch (error) {
    console.error('Error extracting recipe:', error);
    throw error instanceof GeminiError ? error : new GeminiError('Failed to extract recipe', 500);
  }
};

serve(async (req) => {
  const requestId = crypto.randomUUID();
  console.log(`[${requestId}] Processing request`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Request validation
    if (req.method !== 'POST') {
      throw new YouTubeError('Method not allowed', 405);
    }

    const contentType = req.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      throw new YouTubeError('Content-Type must be application/json', 400);
    }

    const { url } = await req.json();
    if (!url) {
      throw new YouTubeError('URL is required', 400);
    }

    console.log(`[${requestId}] Processing YouTube URL:`, url);
    const videoId = extractVideoId(url);

    // Handle authentication and processing record
    let processingRecord = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          console.log(`[${requestId}] Creating processing record for user:`, user.id);
          const { data: record, error: dbError } = await supabase
            .from('video_processing')
            .insert({
              video_url: url,
              status: 'processing',
              metadata: { video_id: videoId, request_id: requestId },
              owner_id: user.id
            })
            .select()
            .single();

          if (!dbError) {
            processingRecord = record;
            console.log(`[${requestId}] Created processing record:`, processingRecord.id);
          } else {
            console.error(`[${requestId}] Error creating processing record:`, dbError);
          }
        }
      } catch (authError) {
        console.error(`[${requestId}] Auth error:`, authError);
      }
    }

    // Main processing pipeline
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId)
    ]);

    const recipe = await extractRecipe(transcript, metadata);

    // Update processing record if it exists
    if (processingRecord) {
      const { error: updateError } = await supabase
        .from('video_processing')
        .update({
          status: 'completed',
          metadata: { ...processingRecord.metadata, recipe }
        })
        .eq('id', processingRecord.id);

      if (updateError) {
        console.error(`[${requestId}] Error updating processing record:`, updateError);
      }
    }

    console.log(`[${requestId}] Request completed successfully`);
    return new Response(JSON.stringify({
      recipe,
      request_id: requestId
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(`[${requestId}] Error:`, error);
    
    const status = error instanceof YouTubeError || error instanceof GeminiError ? error.status : 500;
    const errorResponse = {
      error: error instanceof Error ? error.message : 'Unknown error',
      request_id: requestId,
      type: error.name || 'UnknownError'
    };

    return new Response(JSON.stringify(errorResponse), { 
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
