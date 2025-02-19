
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

function cleanText(text: string): string {
  return decodeHtmlEntities(text)
    .replace(/\s+/g, ' ')
    .replace(/\n\s*/g, '\n')
    .trim();
}

function extractIngredients(html: string): string[] {
  const ingredients: Set<string> = new Set();
  console.log('Extracting ingredients from HTML...');

  // Try Schema.org Recipe markup first (JSON-LD)
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeIngredient) {
        console.log('Found ingredients in Schema.org data');
        recipeData.recipeIngredient.forEach((ingredient: string) => 
          ingredients.add(cleanText(ingredient)));
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common ingredient list patterns if Schema.org didn't work
  if (ingredients.size === 0) {
    const ingredientPatterns = [
      /<(?:li|div)[^>]*class="[^"]*(?:ingredient|ingredients)[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*class="[^"]*recipe-ingred[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*itemprop="recipeIngredient"[^>]*>(.*?)<\/(?:li|div)>/gi
    ];

    for (const pattern of ingredientPatterns) {
      const matches = [...html.matchAll(pattern)];
      matches.forEach(match => {
        const ingredient = cleanText(match[1]);
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
              const ingredient = cleanText(item.replace(/<[^>]+>/g, ''));
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
  console.log('Extracting instructions from HTML...');
  
  // Try Schema.org Recipe markup first
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeInstructions) {
        console.log('Found instructions in Schema.org data');
        if (Array.isArray(recipeData.recipeInstructions)) {
          return recipeData.recipeInstructions
            .map((instruction: any) => {
              if (typeof instruction === 'string') return cleanText(instruction);
              return cleanText(instruction.text || instruction.description || '');
            })
            .filter(Boolean)
            .join('\n\n');
        } else if (typeof recipeData.recipeInstructions === 'string') {
          return cleanText(recipeData.recipeInstructions);
        }
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common instruction patterns
  const instructionBlocks: string[] = [];
  
  // Look for instruction containers
  const instructionPatterns = [
    /<(?:div|section)[^>]*class="[^"]*(?:instruction|instructions|steps|preparation|method)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    /<(?:div|section)[^>]*itemprop="recipeInstructions"[^>]*>([\s\S]*?)<\/(?:div|section)>/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match) {
      const content = match[1];
      
      // Try to find ordered lists first
      const orderedList = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
      if (orderedList) {
        const steps = orderedList[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (steps) {
          steps.forEach((step, index) => {
            const cleanStep = cleanText(step.replace(/<[^>]+>/g, ''));
            if (cleanStep) {
              instructionBlocks.push(`${index + 1}. ${cleanStep}`);
            }
          });
        }
      } else {
        // Try paragraphs if no ordered list is found
        const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (paragraphs) {
          paragraphs.forEach((para, index) => {
            const cleanPara = cleanText(para.replace(/<[^>]+>/g, ''));
            if (cleanPara) {
              instructionBlocks.push(`${index + 1}. ${cleanPara}`);
            }
          });
        }
      }
      
      if (instructionBlocks.length > 0) {
        break;
      }
    }
  }

  // If no structured content is found, try to find any text content in the instruction section
  if (instructionBlocks.length === 0) {
    const instructionSection = html.match(/<div[^>]*>[\s\S]*?instructions?[\s\S]*?<\/div>/i);
    if (instructionSection) {
      const cleanInstructions = cleanText(instructionSection[0].replace(/<[^>]+>/g, ''));
      if (cleanInstructions) {
        // Split by periods and create numbered steps
        const steps = cleanInstructions.split(/\.(?=\s|$)/).filter(Boolean);
        steps.forEach((step, index) => {
          const cleanStep = cleanText(step);
          if (cleanStep) {
            instructionBlocks.push(`${index + 1}. ${cleanStep}`);
          }
        });
      }
    }
  }

  return instructionBlocks.join('\n\n');
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

    // Extract metadata using meta tags
    const getMetaContent = (name: string): string => {
      const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
        || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
      return match ? cleanText(match[1]) : '';
    };

    // Extract recipe data
    const recipe = {
      title: getMetaContent('og:title') || 
             cleanText(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || ''),
      description: getMetaContent('og:description') || 
                  getMetaContent('description'),
      image_url: getMetaContent('og:image'),
      source_url: url,
      ingredients: extractIngredients(html),
      instructions: extractInstructions(html)
    };

    // Extract cook time (if available)
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
