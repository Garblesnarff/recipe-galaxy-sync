
import { corsHeaders } from "./cors-utils.ts";
import { scrapeRecipe } from "./scraper.ts";

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

    const recipe = await scrapeRecipe(url);

    return new Response(
      JSON.stringify(recipe),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('❌ Unhandled error in scrape-recipe function:', error);
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
}

