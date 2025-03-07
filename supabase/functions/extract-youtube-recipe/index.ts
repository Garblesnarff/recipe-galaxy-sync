
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
  console.log("Starting YouTube recipe extraction");
  console.log(`Request method: ${req.method}`);
  console.log(`Content-Type: ${req.headers.get('content-type')}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get request body as raw data
    let requestBody;
    
    try {
      // Try to get body as JSON directly
      requestBody = await req.json();
      console.log('Successfully parsed request body directly:', JSON.stringify(requestBody));
    } catch (jsonError) {
      console.log('Could not parse request as JSON directly, trying text method');
      // If direct JSON parsing fails, try the text method
      try {
        const bodyText = await req.text();
        console.log('Raw request body length:', bodyText.length);
        console.log('Raw request body:', bodyText);
        
        // Check for empty request body
        if (!bodyText || bodyText.trim() === '') {
          console.error('Empty request body received');
          throw new Error('Empty request body');
        }
        
        requestBody = JSON.parse(bodyText);
        console.log('Parsed request body from text:', JSON.stringify(requestBody));
      } catch (textError) {
        console.error('Failed to get request body as text:', textError);
        throw new Error(`Failed to parse request body: ${textError.message}`);
      }
    }
    
    // Validate URL
    const { url } = requestBody;
    if (!url) {
      console.error('URL is missing from request body');
      throw new Error('URL is required');
    }
    console.log('Processing URL:', url);

    // Check for Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is missing');
      throw new Error('GEMINI_API_KEY is required');
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      console.error('Invalid YouTube URL, could not extract video ID');
      throw new Error('Invalid YouTube URL');
    }
    console.log('Extracted video ID:', videoId);

    // Fetch video metadata
    console.log('Fetching video metadata...');
    const oembedResponse = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
    );

    if (!oembedResponse.ok) {
      console.error('Failed to fetch video metadata, status:', oembedResponse.status);
      throw new Error('Failed to fetch video metadata');
    }

    const metadata = await oembedResponse.json();
    console.log('Fetched metadata:', JSON.stringify(metadata));

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
        'Authorization': `Bearer ${geminiApiKey}`
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
      const errorData = await geminiResponse.text();
      console.error('Gemini API error:', errorData);
      throw new Error('Failed to generate recipe with Gemini');
    }

    const geminiData = await geminiResponse.json();
    console.log('Received response from Gemini');
    
    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error('Invalid response format from Gemini:', JSON.stringify(geminiData));
      throw new Error('Invalid response format from Gemini');
    }

    const recipeText = geminiData.candidates[0].content.parts[0].text;
    console.log('Generated recipe text preview:', recipeText.substring(0, 100) + '...');

    // Extract JSON from Gemini's response
    const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('Failed to parse recipe data - no JSON object found');
      throw new Error('Failed to parse recipe data');
    }

    try {
      const recipeData = JSON.parse(jsonMatch[0]);
      console.log('Successfully extracted recipe data:', JSON.stringify(recipeData));
      return new Response(JSON.stringify(recipeData), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse recipe JSON data');
    }

  } catch (error) {
    console.error('Error in extract-youtube-recipe:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'An unknown error occurred',
        status: 'error'
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
