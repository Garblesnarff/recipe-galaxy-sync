
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

class YouTubeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeError';
  }
}

const extractVideoId = (url: string): string => {
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

  throw new YouTubeError('Invalid YouTube URL format');
};

const getVideoMetadata = async (videoId: string) => {
  console.log('Fetching video metadata for:', videoId);
  const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
  
  if (!response.ok) {
    throw new YouTubeError('Video not found or not accessible');
  }

  const data = await response.json();
  console.log('Video metadata:', data);
  return data;
};

const fetchTranscript = async (videoId: string): Promise<string> => {
  console.log('Fetching transcript for:', videoId);
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch video page');
  }

  const html = await response.text();
  const captionsMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/);
  if (!captionsMatch) {
    throw new Error('No captions found for this video');
  }

  const captionUrl = decodeURIComponent(captionsMatch[1]);
  console.log('Caption URL:', captionUrl);

  const transcriptResponse = await fetch(captionUrl);
  if (!transcriptResponse.ok) {
    throw new Error('Failed to fetch transcript');
  }

  const transcriptXml = await transcriptResponse.text();
  const textMatches = transcriptXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
  const transcript = textMatches
    .map(match => {
      const text = match.replace(/<[^>]+>/g, '');
      return decodeURIComponent(text.trim());
    })
    .join(' ');

  console.log('Transcript length:', transcript.length);
  return transcript;
};

const extractRecipe = async (transcript: string, metadata: any) => {
  console.log('Extracting recipe using Gemini');
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
      'Authorization': `Bearer ${GEMINI_API_KEY}`
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
    throw new Error('Failed to process recipe');
  }

  const data = await response.json();
  const recipeText = data.candidates[0].content.parts[0].text;
  
  // Extract JSON from response
  const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from Gemini');
  }

  try {
    const recipe = JSON.parse(jsonMatch[0]);
    console.log('Successfully extracted recipe');
    return recipe;
  } catch (error) {
    console.error('Error parsing recipe JSON:', error);
    throw new Error('Failed to parse recipe data');
  }
};

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      throw new YouTubeError('URL is required');
    }

    console.log('Processing YouTube URL:', url);
    const videoId = extractVideoId(url);
    console.log('Video ID:', videoId);

    let processingRecord = null;
    const authHeader = req.headers.get('Authorization');
    
    if (authHeader) {
      try {
        // Extract the JWT token
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        
        if (!authError && user) {
          // Only create processing record if we have an authenticated user
          const { data: record, error: dbError } = await supabase
            .from('video_processing')
            .insert({
              video_url: url,
              status: 'processing',
              metadata: { video_id: videoId },
              owner_id: user.id
            })
            .select()
            .single();

          if (!dbError) {
            processingRecord = record;
            console.log('Created processing record:', processingRecord.id);
          } else {
            console.error('Error creating processing record:', dbError);
          }
        }
      } catch (authError) {
        console.error('Auth error:', authError);
        // Continue without creating processing record
      }
    }

    // Fetch metadata and transcript in parallel
    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId)
    ]);

    // Extract recipe using Gemini
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
        console.error('Error updating processing record:', updateError);
      }
    }

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error:', error);
    
    const errorResponse = {
      error: error instanceof YouTubeError ? error.message : 'Internal server error',
      details: error.message
    };

    return new Response(JSON.stringify(errorResponse), { 
      status: error instanceof YouTubeError ? 400 : 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
