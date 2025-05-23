import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "../scrape-recipe/cors-utils.ts";
import { scrapeRecipe } from "../scrape-recipe/scraper.ts";
import { scrapeRecipeEnhanced } from "./enhanced-scraper.ts";

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("🚀 Enhanced recipe scraper function invoked");
  return handleEnhancedRecipeRequest(req);
});

async function handleEnhancedRecipeRequest(req: Request) {
  try {
    const requestData = await req.json().catch(error => {
      console.error('Error parsing request JSON:', error);
      throw new Error('Invalid JSON in request body');
    });
    
    const { url } = requestData;
    console.log('🔍 Attempting to scrape recipe from URL:', url);

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const domain = new URL(url).hostname;
    console.log(`🌐 Processing domain: ${domain}`);

    // Define sites that work well with current implementation
    const reliableSites = [
      'allrecipes.com',
      'simplyrecipes.com', 
      'damndelicious.com',
      'food.com',
      'cooking.nytimes.com',
      'beefitswhatsfordinner.com',
      'pinchofyum.com',
      'onceuponachef.com'
    ];

    // Define sites that need Firecrawl
    const firecrawlSites = [
      'foodnetwork.com',
      'hellofresh.com',
      'epicurious.com',
      'bonappetit.com',
      'tasteofhome.com'
    ];

    let recipe;
    let extractionMethod = 'unknown';

    // Smart routing logic
    if (reliableSites.some(site => domain.includes(site))) {
      console.log('🎯 Using current implementation for reliable site');
      try {
        recipe = await scrapeRecipe(url);
        extractionMethod = 'current';
        console.log('✅ Current implementation succeeded');
      } catch (error) {
        console.log('⚠️ Current implementation failed, trying Firecrawl...');
        recipe = await scrapeWithFirecrawl(url);
        extractionMethod = 'firecrawl_fallback';
      }
    } else if (firecrawlSites.some(site => domain.includes(site))) {
      console.log('🤖 Using enhanced scraper first for challenging site');
      try {
        recipe = await scrapeRecipeEnhanced(url);
        extractionMethod = 'enhanced';
        console.log('✅ Enhanced scraper succeeded');
      } catch (error) {
        console.log('⚠️ Enhanced scraper failed, trying Firecrawl...');
        try {
          recipe = await scrapeWithFirecrawl(url);
          extractionMethod = 'firecrawl_fallback';
        } catch (firecrawlError) {
          console.log('⚠️ Firecrawl also failed, trying current implementation...');
          recipe = await scrapeRecipe(url);
          extractionMethod = 'current_final_fallback';
        }
      }
    } else {
      console.log('🔄 Trying current implementation first for unknown site');
      try {
        recipe = await scrapeRecipe(url);
        extractionMethod = 'current';
        console.log('✅ Current implementation succeeded');
      } catch (error) {
        console.log('⚠️ Current implementation failed, trying Firecrawl...');
        recipe = await scrapeWithFirecrawl(url);
        extractionMethod = 'firecrawl_fallback';
      }
    }

    // Add metadata about extraction method
    const response = {
      ...recipe,
      _metadata: {
        extraction_method: extractionMethod,
        domain: domain,
        extracted_at: new Date().toISOString()
      }
    };

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('❌ All extraction methods failed:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to scrape recipe with all methods',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
}

async function scrapeWithFirecrawl(url: string): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not configured');
  }

  console.log('🔥 Calling Firecrawl API for:', url);
  
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url,
      formats: ['extract'],
      extract: {
        prompt: `Extract recipe information and return as JSON with these exact fields:
        - title (string): Recipe name
        - ingredients (array of strings): List of ingredients with quantities  
        - instructions (string): Step-by-step cooking instructions
        - prep_time (string): Preparation time
        - cook_time (string): Cooking time  
        - servings (number): Number of servings
        - image_url (string): Main recipe image URL
        - description (string): Recipe description`,
        schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            ingredients: { 
              type: "array", 
              items: { type: "string" } 
            },
            instructions: { type: "string" },
            prep_time: { type: "string" },
            cook_time: { type: "string" },
            servings: { type: "number" },
            image_url: { type: "string" },
            description: { type: "string" }
          }
        }
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Firecrawl API error:', response.status, errorText);
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  console.log('🎉 Firecrawl extraction successful');
  
  return data.extract || data.data || data;
}