
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

interface CaptionTrack {
  baseUrl: string;
  name: { simpleText: string };
  languageCode: string;
  kind: string;
  isTranslatable: boolean;
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

const fetchTranscriptData = async (videoId: string): Promise<CaptionTrack[]> => {
  const innertubeApiKey = 'AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8';
  const url = `https://www.youtube.com/youtubei/v1/get_transcript?key=${innertubeApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: {
        client: {
          clientName: 'WEB',
          clientVersion: '2.20220609.01.00',
        },
      },
      params: btoa(JSON.stringify({ videoId })),
    }),
  });

  if (!response.ok) {
    throw new YouTubeError('Failed to fetch transcript data');
  }

  const data = await response.json();
  const captionTracks = data?.actions?.[0]?.updateEngagementPanelAction?.content
    ?.transcriptRenderer?.body?.transcriptBodyRenderer?.cueGroups;

  if (!captionTracks) {
    throw new YouTubeError('No captions available for this video');
  }

  return captionTracks;
};

const getVideoMetadata = async (videoId: string) => {
  try {
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new YouTubeError('Video not found or not accessible');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching video metadata:', error);
    throw new YouTubeError('Failed to fetch video metadata');
  }
};

const fetchTranscript = async (videoId: string): Promise<string> => {
  try {
    const captionTracks = await fetchTranscriptData(videoId);
    
    // Extract and combine text from all cue groups
    const transcriptText = captionTracks
      .map(group => group.transcript.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (!transcriptText) {
      throw new YouTubeError('Failed to extract transcript text');
    }

    return transcriptText;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new YouTubeError(
      error instanceof YouTubeError 
        ? error.message 
        : 'Failed to fetch video transcript'
    );
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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing YouTube URL:', url);

    const videoId = extractVideoId(url);
    console.log('Extracted video ID:', videoId);

    const [metadata, transcript] = await Promise.all([
      getVideoMetadata(videoId),
      fetchTranscript(videoId)
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
    
    const status = error instanceof YouTubeError ? 400 : 500;
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error instanceof YouTubeError ? error.message : 'Internal server error'
      }),
      { 
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
