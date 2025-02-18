
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import FirecrawlApp from '@mendable/firecrawl-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Attempting to scrape recipe from URL:', url);

    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!firecrawlApiKey) {
      throw new Error('Firecrawl API key not configured');
    }

    const firecrawl = new FirecrawlApp({ apiKey: firecrawlApiKey });
    
    const result = await firecrawl.crawlUrl(url, {
      limit: 1,
      scrapeOptions: {
        formats: ['markdown', 'html'],
        selectors: {
          title: ['h1', 'meta[property="og:title"]'],
          description: ['meta[name="description"]', 'meta[property="og:description"]'],
          image: ['meta[property="og:image"]', 'img.recipe-image'],
          ingredients: ['.recipe-ingredients', '.ingredients-list'],
          instructions: ['.recipe-instructions', '.instructions-list'],
          cookTime: ['.cook-time', '.recipe-time'],
          difficulty: ['.recipe-difficulty', '.difficulty-level']
        }
      }
    });

    console.log('Firecrawl response:', result);

    if (!result.success) {
      throw new Error('Failed to scrape recipe');
    }

    // Parse the scraped data
    const processedData = {
      title: result.data?.[0]?.title || '',
      description: result.data?.[0]?.description || '',
      image_url: result.data?.[0]?.image || '',
      ingredients: result.data?.[0]?.ingredients || [],
      instructions: result.data?.[0]?.instructions || '',
      cook_time: result.data?.[0]?.cookTime || '',
      difficulty: result.data?.[0]?.difficulty || 'Medium',
      recipe_type: 'imported',
      source_url: url,
    };

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in scrape-recipe function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
