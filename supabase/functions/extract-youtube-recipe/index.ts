
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { extractVideoInfo } from "./youtube-utils.ts";
import { extractRecipeFromVideo } from "./gemini-client.ts";
import { handleYouTubeRequest } from "./request-handler.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204  
    });
  }

  try {
    const result = await handleYouTubeRequest(req);
    return new Response(JSON.stringify(result), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      }
    });
  } catch (error) {
    console.error('Error in YouTube recipe extraction:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to extract recipe from YouTube video',
        details: error.toString()
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
