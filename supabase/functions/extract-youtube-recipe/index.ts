
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const extractVideoId = (url: string): string => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([^&\n?#]+)/,
    /(?:youtu.be\/)([^&\n?#]+)/,
    /(?:youtube.com\/shorts\/)([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return '';
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting YouTube recipe extraction');

    if (!Deno.env.get('GEMINI_API_KEY')) {
      throw new Error('GEMINI_API_KEY is required');
    }

    const { url } = await req.json();
    if (!url) {
      throw new Error('URL is required');
    }

    console.log('Processing URL:', url);
    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // Fetch video metadata
    const oembedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!oembedResponse.ok) {
      throw new Error('Failed to fetch video metadata');
    }

    const metadata = await oembedResponse.json();
    console.log('Fetched metadata:', metadata);

    // Generate recipe using Gemini
    const prompt = `You are a professional chef. Create a detailed recipe based on this YouTube cooking video titled: "${metadata.title}".
    
    Format your response as a JSON object with these exact fields:
    {
      "title": "Recipe name",
      "description": "Brief overview",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "instructions": "Step by step instructions",
      "cook_time": "Estimated time",
      "difficulty": "Easy/Medium/Hard",
      "image_url": "${metadata.thumbnail_url}"
    }`;

    console.log('Sending prompt to Gemini');
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
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

    if (!geminiResponse.ok) {
      throw new Error('Failed to generate recipe with Gemini');
    }

    const geminiData = await geminiResponse.json();
    const recipeText = geminiData.candidates[0].content.parts[0].text;
    console.log('Generated recipe text:', recipeText);

    // Extract JSON from Gemini's response
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse recipe data');
    }

    const recipeData = JSON.parse(jsonMatch[0]);
    console.log('Successfully extracted recipe data');

    return new Response(JSON.stringify(recipeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in extract-youtube-recipe:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
