
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { decode as base64Decode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

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

async function downloadVideoFrames(videoId: string): Promise<string[]> {
  console.log('Downloading video frames for:', videoId);
  
  try {
    // Get video info using oEmbed
    const infoResponse = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    if (!infoResponse.ok) {
      throw new Error('Failed to fetch video info');
    }
    
    // For now, we'll use the thumbnail as our frame since we can't download video in edge function
    const { thumbnail_url } = await infoResponse.json();
    
    // Get the highest resolution thumbnail
    const hdThumbnail = thumbnail_url.replace('hqdefault', 'maxresdefault');
    
    console.log('Using HD thumbnail:', hdThumbnail);
    return [hdThumbnail];
  } catch (error) {
    console.error('Error downloading video frames:', error);
    throw new YouTubeError('Failed to download video frames');
  }
}

const fetchVideoTranscript = async (videoId: string): Promise<string> => {
  console.log('Fetching transcript for video:', videoId);
  
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch video page');
    }

    const html = await response.text();
    console.log('Successfully fetched video page');

    // Extract captions data
    const captionsMatch = html.match(/"captionTracks":\s*\[.*?"baseUrl":\s*"([^"]+)"/);
    if (!captionsMatch) {
      throw new Error('No caption URL found');
    }

    const captionUrl = decodeURIComponent(captionsMatch[1]);
    console.log('Found caption URL');

    const transcriptResponse = await fetch(captionUrl);
    if (!transcriptResponse.ok) {
      throw new Error('Failed to fetch transcript');
    }

    const transcriptText = await transcriptResponse.text();
    console.log('Successfully fetched transcript');

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

async function downloadImage(url: string): Promise<{ mimeType: string; data: string }> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
  const mimeType = response.headers.get('content-type') || 'image/jpeg';
  return { mimeType, data: base64 };
}

const parseRecipeWithGemini = async (transcript: string, frames: string[], videoMetadata: any): Promise<any> => {
  console.log('Starting recipe parsing with Gemini');
  try {
    // Download and process the frames
    const processedFrames = await Promise.all(frames.map(downloadImage));
    
    const prompt = `You are a professional chef and recipe writer. Analyze this cooking video and create a detailed recipe. 
    The video shows key steps and ingredients for making ${videoMetadata.title}.
    
    Consider both the visual information from the frames and the transcript to create an accurate and detailed recipe.
    
    Provide the output in this exact structured format:
    {
      "title": "Recipe name",
      "description": "Brief overview of the dish",
      "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity", ...],
      "instructions": ["Step 1", "Step 2", ...],
      "cook_time": "Estimated cooking time (if mentioned)",
      "difficulty": "Easy/Medium/Hard based on complexity",
      "image_url": "${videoMetadata.thumbnail_url || ''}"
    }`;

    const contents = [{
      role: 'user',
      parts: [
        { text: prompt },
        ...processedFrames.map(frame => ({
          inlineData: {
            mimeType: frame.mimeType,
            data: frame.data
          }
        })),
        { text: `Transcript:\n${transcript}` }
      ]
    }];

    console.log('Sending request to Gemini API');
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro-vision:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({ contents })
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

    // Parallel fetch of metadata, transcript, and frames
    const [metadata, transcript, frames] = await Promise.all([
      getVideoMetadata(videoId),
      fetchVideoTranscript(videoId),
      downloadVideoFrames(videoId)
    ]);

    console.log('Successfully fetched metadata, transcript, and frames');
    console.log('Transcript length:', transcript.length);
    console.log('Number of frames:', frames.length);

    const recipe = await parseRecipeWithGemini(transcript, frames, metadata);
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
