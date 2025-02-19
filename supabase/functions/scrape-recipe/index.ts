
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

function extractIngredients(html: string): string[] {
  const ingredients: Set<string> = new Set();

  // Try Schema.org Recipe markup first (JSON-LD)
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeIngredient) {
        recipeData.recipeIngredient.forEach((ingredient: string) => 
          ingredients.add(ingredient.trim()));
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common ingredient list patterns if Schema.org didn't work
  if (ingredients.size === 0) {
    // Look for lists with ingredient-related classes
    const ingredientPatterns = [
      /<(?:li|div)[^>]*class="[^"]*(?:ingredient|ingredients)[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*class="[^"]*recipe-ingred[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*itemprop="recipeIngredient"[^>]*>(.*?)<\/(?:li|div)>/gi
    ];

    for (const pattern of ingredientPatterns) {
      const matches = [...html.matchAll(pattern)];
      matches.forEach(match => {
        const ingredient = match[1]
          .replace(/<[^>]+>/g, '') // Remove HTML tags
          .replace(/\s+/g, ' ')    // Normalize whitespace
          .trim();
        if (ingredient) {
          ingredients.add(ingredient);
        }
      });
    }

    // If still no ingredients found, try looking for any list items within ingredient sections
    if (ingredients.size === 0) {
      const sections = html.match(/<(?:div|section)[^>]*>(?:.*?ingredients?.*?)<\/(?:div|section)>/gi);
      if (sections) {
        sections.forEach(section => {
          const items = section.match(/<li[^>]*>(.*?)<\/li>/gi);
          if (items) {
            items.forEach(item => {
              const ingredient = item
                .replace(/<[^>]+>/g, '')
                .replace(/\s+/g, ' ')
                .trim();
              if (ingredient) {
                ingredients.add(ingredient);
              }
            });
          }
        });
      }
    }
  }

  return Array.from(ingredients);
}

function extractInstructions(html: string): string {
  // Try Schema.org Recipe markup first
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeInstructions) {
        if (Array.isArray(recipeData.recipeInstructions)) {
          // Handle array of instructions
          return recipeData.recipeInstructions
            .map((instruction: any) => {
              if (typeof instruction === 'string') return instruction;
              return instruction.text || instruction.description || '';
            })
            .filter(Boolean)
            .join('\n\n');
        } else if (typeof recipeData.recipeInstructions === 'string') {
          return recipeData.recipeInstructions;
        }
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common instruction patterns
  const instructionPatterns = [
    /<(?:div|section)[^>]*class="[^"]*(?:instruction|instructions|steps|preparation|method)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    /<(?:ol|ul)[^>]*class="[^"]*(?:instruction|instructions|steps|preparation|method)[^"]*"[^>]*>([\s\S]*?)<\/(?:ol|ul)>/i,
    /<(?:div|section)[^>]*itemprop="recipeInstructions"[^>]*>([\s\S]*?)<\/(?:div|section)>/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match) {
      const instructions = match[1]
        .replace(/<(?:li|p)[^>]*>/gi, '') // Remove opening li/p tags
        .replace(/<\/(?:li|p)>/gi, '\n')  // Replace closing li/p tags with newlines
        .replace(/<br\s*\/?>/gi, '\n')    // Replace <br> tags with newlines
        .replace(/<[^>]+>/g, '')          // Remove any remaining HTML tags
        .replace(/\n\s*\n/g, '\n\n')      // Normalize multiple newlines
        .replace(/^\s+|\s+$/g, '')        // Trim whitespace
        .split('\n')                      // Split into lines
        .filter(line => line.trim())      // Remove empty lines
        .join('\n');                      // Join back with newlines
      
      if (instructions) {
        return instructions;
      }
    }
  }

  return '';
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
      ingredients: extractIngredients(html),
      instructions: extractInstructions(html)
    };

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
