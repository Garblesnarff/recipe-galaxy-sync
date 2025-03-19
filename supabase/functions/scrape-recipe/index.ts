
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
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request JSON:', error);
      throw new Error('Invalid JSON in request body');
    });
    
    const { url } = requestData;
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

    // Fetch the webpage content with retry logic and a timeout
    try {
      console.log('Fetching webpage content from:', url);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      const response = await fetchWithRetry(url, 3, controller.signal);
      clearTimeout(timeoutId);
      
      const html = await response.text();
      console.log('Successfully fetched webpage content, length:', html.length);

      // Extract initial recipe data
      console.log('Extracting recipe data...');
      const rawInstructions = extractInstructions(html);
      console.log('Extracted raw instructions, length:', rawInstructions?.length || 0);
      
      // Clean instructions using Groq if API key is available
      let processedInstructions = rawInstructions;
      if (GROQ_API_KEY && rawInstructions) {
        console.log('Cleaning instructions with Groq API...');
        try {
          processedInstructions = await cleanInstructions(rawInstructions, GROQ_API_KEY);
          console.log('Successfully cleaned instructions');
        } catch (error) {
          console.warn('Error cleaning instructions with Groq:', error);
          // Continue with raw instructions if cleaning fails
        }
      } else {
        console.warn('GROQ_API_KEY not available or no instructions found. Using raw instructions.');
      }

      // Extract ingredients
      const ingredients = extractIngredients(html);
      console.log('Extracted ingredients count:', ingredients.length);
      
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

      console.log('Successfully extracted recipe data:', {
        title: recipe.title,
        ingredientsCount: recipe.ingredients.length,
        hasInstructions: !!recipe.instructions,
        hasImage: !!recipe.image_url
      });

      return new Response(
        JSON.stringify(recipe),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    } catch (fetchError) {
      console.error('Error fetching or processing webpage:', fetchError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch or process webpage',
          details: fetchError.message || 'Unknown fetch error',
          url
        }),
        { 
          status: 502, // Bad Gateway for fetch failures
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
  } catch (error) {
    console.error('Error in scrape-recipe function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape recipe',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
