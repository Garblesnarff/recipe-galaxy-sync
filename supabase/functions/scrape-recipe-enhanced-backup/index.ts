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
  console.log("🔑 Firecrawl API key available:", !!FIRECRAWL_API_KEY);
  
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

    // Define sites that need special handling
    const challengingSites = [
      'foodnetwork.com',
      'hellofresh.com',
      'epicurious.com',
      'bonappetit.com',
      'tasteofhome.com'
    ];

    let recipe;
    let extractionMethod = 'unknown';
    let debugInfo = {
      domain,
      isReliableSite: reliableSites.some(site => domain.includes(site)),
      isChallengingSite: challengingSites.some(site => domain.includes(site)),
      hasFirecrawlKey: !!FIRECRAWL_API_KEY,
      attempts: []
    };

    // Smart routing logic with detailed logging
    if (reliableSites.some(site => domain.includes(site))) {
      console.log('🎯 Using current implementation for reliable site');
      debugInfo.attempts.push('current_implementation');
      try {
        recipe = await scrapeRecipe(url);
        extractionMethod = 'current';
        console.log('✅ Current implementation succeeded');
      } catch (error) {
        console.log('⚠️ Current implementation failed:', error.message);
        debugInfo.attempts.push('current_failed');
        if (FIRECRAWL_API_KEY) {
          debugInfo.attempts.push('firecrawl_fallback');
          try {
            recipe = await scrapeWithFirecrawl(url);
            extractionMethod = 'firecrawl_fallback';
            console.log('✅ Firecrawl fallback succeeded');
          } catch (firecrawlError) {
            console.log('❌ Firecrawl fallback also failed:', firecrawlError.message);
            throw new Error(`All methods failed. Current: ${error.message}, Firecrawl: ${firecrawlError.message}`);
          }
        } else {
          throw error;
        }
      }
    } else if (challengingSites.some(site => domain.includes(site))) {
      console.log('🤖 Using enhanced approach for challenging site');
      
      // Try enhanced scraper first
      debugInfo.attempts.push('enhanced_scraper');
      try {
        console.log('🔧 Attempting enhanced scraper...');
        recipe = await scrapeRecipeEnhanced(url);
        extractionMethod = 'enhanced';
        console.log('✅ Enhanced scraper succeeded');
      } catch (enhancedError) {
        console.log('⚠️ Enhanced scraper failed:', enhancedError.message);
        debugInfo.attempts.push('enhanced_failed');
        
        // Try Firecrawl if available
        if (FIRECRAWL_API_KEY) {
          debugInfo.attempts.push('firecrawl_primary');
          try {
            console.log('🔥 Attempting Firecrawl...');
            recipe = await scrapeWithFirecrawl(url);
            extractionMethod = 'firecrawl';
            console.log('✅ Firecrawl succeeded');
          } catch (firecrawlError) {
            console.log('⚠️ Firecrawl failed:', firecrawlError.message);
            debugInfo.attempts.push('firecrawl_failed');
            
            // Final fallback to current implementation
            debugInfo.attempts.push('current_final_fallback');
            try {
              console.log('🔄 Trying current implementation as final fallback...');
              recipe = await scrapeRecipe(url);
              extractionMethod = 'current_final_fallback';
              console.log('✅ Current implementation final fallback succeeded');
            } catch (currentError) {
              console.log('❌ All methods failed');
              throw new Error(`All methods failed. Enhanced: ${enhancedError.message}, Firecrawl: ${firecrawlError.message}, Current: ${currentError.message}`);
            }
          }
        } else {
          throw new Error(`Enhanced scraper failed and no Firecrawl key available: ${enhancedError.message}`);
        }
      }
    } else {
      console.log('🔄 Trying current implementation first for unknown site');
      debugInfo.attempts.push('current_unknown_site');
      try {
        recipe = await scrapeRecipe(url);
        extractionMethod = 'current';
        console.log('✅ Current implementation succeeded');
      } catch (error) {
        console.log('⚠️ Current implementation failed, trying enhanced then Firecrawl...');
        debugInfo.attempts.push('current_failed');
        
        try {
          debugInfo.attempts.push('enhanced_fallback');
          recipe = await scrapeRecipeEnhanced(url);
          extractionMethod = 'enhanced_fallback';
          console.log('✅ Enhanced fallback succeeded');
        } catch (enhancedError) {
          if (FIRECRAWL_API_KEY) {
            debugInfo.attempts.push('firecrawl_final');
            recipe = await scrapeWithFirecrawl(url);
            extractionMethod = 'firecrawl_final';
            console.log('✅ Firecrawl final attempt succeeded');
          } else {
            throw new Error(`All available methods failed: ${error.message}`);
          }
        }
      }
    }

    // Add comprehensive metadata
    const response = {
      ...recipe,
      _metadata: {
        extraction_method: extractionMethod,
        domain: domain,
        extracted_at: new Date().toISOString(),
        debug_info: debugInfo
      }
    };

    console.log('🎉 Recipe extraction completed with method:', extractionMethod);
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
        details: error.message || 'Unknown error',
        debug_info: {
          error_type: error.constructor.name,
          error_stack: error.stack
        }
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
    throw new Error('Firecrawl API key not configured in environment');
  }

  console.log('🔥 Calling Firecrawl API for:', url);
  console.log('🔑 Using API key (first 10 chars):', FIRECRAWL_API_KEY.substring(0, 10) + '...');
  
  try {
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

    console.log('🌐 Firecrawl API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firecrawl API error details:', errorText);
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Firecrawl response received, data keys:', Object.keys(data));
    
    // Handle different response formats
    let extractedData = data.extract || data.data || data;
    
    if (!extractedData || typeof extractedData !== 'object') {
      console.log('⚠️ Unexpected Firecrawl response format:', data);
      throw new Error('Firecrawl returned unexpected response format');
    }
    
    console.log('🎉 Firecrawl extraction successful');
    return extractedData;
    
  } catch (fetchError) {
    console.error('❌ Firecrawl fetch error:', fetchError);
    throw new Error(`Firecrawl request failed: ${fetchError.message}`);
  }
}