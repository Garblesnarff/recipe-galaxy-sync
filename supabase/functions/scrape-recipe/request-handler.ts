
import { corsHeaders } from "./cors-utils.ts";
import { scrapeRecipe } from "./scraper.ts";
import { scrapeRecipeEnhanced } from "./enhanced-scraper.ts";
import { scrapeWithFirecrawl } from "./firecrawl-fallback.ts";

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

export async function handleRecipeRequest(req: Request) {
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

