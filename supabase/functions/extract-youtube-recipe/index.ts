
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { corsHeaders, parseRequestBody, processYoutubeUrl } from "./request-handler.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log("Handling OPTIONS request with CORS headers");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get and validate the request body
    const { url } = await parseRequestBody(req);

    // Check for Gemini API key
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    if (!geminiApiKey) {
      console.error('GEMINI_API_KEY is missing');
      throw new Error('GEMINI_API_KEY is required');
    }
    console.log('GEMINI_API_KEY is configured');

    // Process the YouTube URL
    const recipeData = await processYoutubeUrl(url, geminiApiKey);

    // Return the recipe data
    return new Response(JSON.stringify(recipeData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

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
