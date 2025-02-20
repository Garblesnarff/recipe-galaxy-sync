
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

// Custom error types for better error handling
class YouTubeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'YouTubeError';
  }
}

class TranscriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TranscriptError';
  }
}

const extractVideoId = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\n?#]+)/,
    /youtube.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  throw new YouTubeError('Invalid YouTube URL format');
};

const getVideoMetadata = async (videoId: string) => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      throw new YouTubeError('Video not found or not accessible');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new YouTubeError('Failed to fetch video metadata');
  }
};

const getTranscript = async (videoId: string): Promise<string> => {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const html = await response.text();
    console.log('Fetched YouTube page HTML');

    // Extract captions URL
    const captionsMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionsMatch) {
      throw new TranscriptError('No captions found for this video');
    }

    const captions = JSON.parse(`[${captionsMatch[1]}]`);
    const englishCaptions = captions.find((c: any) => 
      c.languageCode === "en" || c.languageCode === "en-US" || c.languageCode === "en-GB"
    );

    if (!englishCaptions?.baseUrl) {
      throw new TranscriptError('No English captions available');
    }

    console.log('Found English captions URL');

    // Fetch transcript XML
    const transcriptResponse = await fetch(englishCaptions.baseUrl);
    const transcriptXml = await transcriptResponse.text();
    
    // Extract text from XML
    const textSegments = transcriptXml
      .match(/<text[^>]*>(.*?)<\/text>/g)
      ?.map(segment => {
        const textMatch = segment.match(/>([^<]*)</);
        return textMatch ? textMatch[1].trim() : '';
      })
      .filter(text => text.length > 0) || [];

    if (textSegments.length === 0) {
      throw new TranscriptError('Failed to parse transcript text');
    }

    console.log(`Extracted ${textSegments.length} text segments`);
    return textSegments.join(' ');
  } catch (error) {
    console.error('Error in transcript extraction:', error);
    if (error instanceof TranscriptError) {
      throw error;
    }
    throw new TranscriptError('Failed to extract video transcript');
  }
};

const parseRecipeWithGemini = async (transcript: string, videoMetadata: any): Promise<any> => {
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

    // Extract video ID and get metadata
    const videoId = extractVideoId(url);
    const metadata = await getVideoMetadata(videoId);
    console.log('Got video metadata for:', metadata.title);

    // Get transcript and parse recipe
    const transcript = await getTranscript(videoId);
    console.log('Got transcript, length:', transcript.length);
    
    const recipe = await parseRecipeWithGemini(transcript, metadata);
    console.log('Successfully extracted recipe');

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error processing request:', error);
    
    // Determine appropriate status code and message
    let status = 500;
    let message = 'Internal server error';
    
    if (error instanceof YouTubeError) {
      status = 400;
      message = error.message;
    } else if (error instanceof TranscriptError) {
      status = 422;
      message = error.message;
    }

    return new Response(
      JSON.stringify({ 
        error: message,
        details: error.message 
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
