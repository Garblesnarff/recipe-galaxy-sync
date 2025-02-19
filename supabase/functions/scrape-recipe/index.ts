
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScrapedRecipe {
  title?: string;
  description?: string;
  ingredients?: string[];
  instructions?: string;
  cook_time?: string;
  difficulty?: string;
  image_url?: string;
  source_url: string;
}

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

    // Fetch the webpage content
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.statusText}`);
    }

    const html = await response.text();
    console.log('Successfully fetched webpage content');

    // Basic metadata extraction using regex
    const getMetaContent = (name: string): string => {
      const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
      return match ? match[1] : '';
    };

    // Extract recipe data
    const recipe: ScrapedRecipe = {
      title: getMetaContent('og:title') || 
             html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1]?.trim(),
      description: getMetaContent('og:description') || 
                  getMetaContent('description'),
      image_url: getMetaContent('og:image'),
      source_url: url,
    };

    // Extract ingredients
    const ingredientsList = html.match(/<li[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/li>/gi);
    if (ingredientsList) {
      recipe.ingredients = ingredientsList
        .map(item => item.replace(/<[^>]+>/g, '').trim())
        .filter(item => item.length > 0);
    }

    // Extract instructions
    const instructionsMatch = html.match(/<div[^>]*class="[^"]*instructions[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (instructionsMatch) {
      recipe.instructions = instructionsMatch[1]
        .replace(/<[^>]+>/g, '\n')
        .replace(/\s+/g, ' ')
        .trim();
    }

    // Extract cook time
    const timeMatch = html.match(/cook[^\d]*(\d+)[\s-]*min/i);
    if (timeMatch) {
      recipe.cook_time = `${timeMatch[1]} minutes`;
    }

    console.log('Successfully extracted recipe data:', recipe);

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
