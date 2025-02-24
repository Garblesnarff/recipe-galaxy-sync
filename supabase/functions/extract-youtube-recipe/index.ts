
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      console.log('Extracted video ID:', match[1]);
      return match[1];
    }
  }

  throw new YouTubeError('Invalid YouTube URL format');
};

const fetchVideoTranscript = async (videoId: string): Promise<string> => {
  console.log('Fetching transcript for video:', videoId);
  
  try {
    // First attempt: Try fetching the video page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video page');
    }

    const html = await response.text();
    console.log('Successfully fetched video page');

    // Extract captions data from ytInitialPlayerResponse
    const playerResponseMatch = html.match(/"playerCaptionsTracklistRenderer":\s*({[^}]+})/);
    if (!playerResponseMatch) {
      throw new Error('No captions data found in video page');
    }

    // Find caption URL from the data
    const captionsMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/);
    if (!captionsMatch) {
      throw new Error('No caption URL found');
    }

    const captionUrl = decodeURIComponent(captionsMatch[1]);
    console.log('Found caption URL');

    // Fetch the actual transcript
    const transcriptResponse = await fetch(captionUrl);
    if (!transcriptResponse.ok) {
      throw new Error('Failed to fetch transcript');
    }

    const transcriptText = await transcriptResponse.text();
    console.log('Successfully fetched transcript');

    // Extract text from XML-like response
    const textLines = transcriptText
      .match(/<text[^>]*>(.*?)<\/text>/g)
      ?.map(line => {
        const textMatch = line.match(/<text[^>]*>(.*?)<\/text>/);
        return textMatch ? textMatch[1].trim() : '';
      })
      .filter(Boolean)
      .join(' ') || '';

    if (!textLines) {
      throw new Error('Failed to extract text from transcript');
    }

    return textLines;

  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new YouTubeError(`Failed to fetch transcript: ${error.message}`);
  }
};

const getVideoMetadata = async (videoId: string) => {
  console.log('Fetching video metadata for:', videoId);
  
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new YouTubeError('Video not found or not accessible');
    }

    const data = await response.json();
    console.log('Successfully fetched video metadata');
    return data;
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new YouTubeError('Failed to fetch video metadata');
  }
};

const parseRecipeWithGemini = async (transcript: string, videoMetadata: any): Promise<any> => {
  console.log('Starting recipe parsing with Gemini');
  try {
    const prompt = `Extract a detailed recipe from the following YouTube video transcript titled "${videoMetadata.title}". 
    Provide the output in this exact structured format:
    {
      "title": "Recipe name",
      "description": "Brief overview of the dish",
      "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity", ...],
      "instructions": ["Step 1", "Step 2", ...],
      "cook_time": "Estimated cooking time (if mentioned)",
      "difficulty": "Easy/Medium/Hard based on complexity",
      "image_url": "${videoMetadata.thumbnail_url || ''}"
    }

    If any field cannot be determined from the transcript, use an empty string or empty array as appropriate.
    Do not include any explanatory text, only output the JSON object.

    Transcript:
    ${transcript}`;

    console.log('Sending request to Gemini API');
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
      throw new Error('Failed to process recipe with Gemini');
    }

    const data = await response.json();
    const recipeText = data.candidates[0].content.parts[0].text;
    
    // Extract and validate JSON
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Gemini');
    }
    
    const recipe = JSON.parse(jsonMatch[0]);
    console.log('Successfully parsed recipe data');
    return recipe;
  } catch (error) {
    console.error('Error in recipe parsing:', error);
    throw new Error('Failed to parse recipe from video');
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing YouTube URL:', url);

    if (!url) {
      throw new YouTubeError('URL is required');
    }

    const videoId = extractVideoId(url);
    console.log('Successfully extracted video ID:', videoId);

    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchVideoTranscript(videoId)
    ]);

    console.log('Successfully fetched metadata and transcript');
    console.log('Transcript length:', transcript.length);

    const recipe = await parseRecipeWithGemini(transcript, metadata);
    console.log('Successfully extracted recipe');

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
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
