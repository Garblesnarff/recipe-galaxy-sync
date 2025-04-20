
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors-utils.ts";
import { handleRecipeRequest } from "./request-handler.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("⚡️ Recipe scraper function invoked");
  return handleRecipeRequest(req);
});

