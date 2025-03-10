
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { cleanText, fetchWithRetry } from "./html-utils.ts";
import { extractIngredients, extractInstructions, getMetaContent } from "./recipe-extractor.ts";
import { cleanInstructions } from "./instruction-cleaner.ts";

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Get the Groq API key from environment variables
const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Attempting to scrape recipe from URL:', url);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Fetch the webpage content with retry logic
    const response = await fetchWithRetry(url);
    const html = await response.text();
    console.log('Successfully fetched webpage content');

    // Extract initial recipe data
    const rawInstructions = extractInstructions(html);
    console.log('Initial instructions extracted, sending to Groq for cleaning...');
    
    // Clean instructions using Groq if API key is available
    let processedInstructions = rawInstructions;
    if (GROQ_API_KEY) {
      processedInstructions = await cleanInstructions(rawInstructions, GROQ_API_KEY);
    } else {
      console.warn('GROQ_API_KEY not available. Skipping instruction cleaning.');
    }

    // Extract ingredients
    const ingredients = extractIngredients(html);
    
    // Build the recipe object
    const recipe = {
      title: getMetaContent(html, 'og:title') || 
             cleanText(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || ''),
      description: getMetaContent(html, 'og:description') || 
                  getMetaContent(html, 'description'),
      image_url: getMetaContent(html, 'og:image'),
      source_url: url,
      ingredients: ingredients,
      instructions: processedInstructions
    };

    // Extract cook time (if available)
    const timeMatch = html.match(/cook[^\d]*(\d+)[\s-]*min/i);
    if (timeMatch) {
      recipe.cook_time = `${timeMatch[1]} minutes`;
    }

    console.log('Successfully extracted and cleaned recipe data');

    return new Response(
      JSON.stringify(recipe),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error in scrape-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape recipe',
        details: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
