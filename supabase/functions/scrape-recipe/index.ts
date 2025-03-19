
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

  console.log("⚡️ Recipe scraper function invoked");
  
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

    // Extract domain for logging and potential site-specific handling
    const domain = new URL(url).hostname;
    console.log(`🌐 Processing domain: ${domain}`);
    
    // Different user agents to rotate through if needed
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
    ];
    
    // Select a random user agent
    const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    
    // Site-specific headers to help bypass anti-scraping measures
    const fetchHeaders = {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Referer': 'https://www.google.com/',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'cross-site',
      'Sec-Fetch-User': '?1',
    };

    try {
      console.log('📥 Fetching webpage content from:', url);
      
      // Set a shorter timeout for problematic sites
      const timeoutMs = domain.includes('hellofresh') ? 20000 : 30000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      // Use fetchWithRetry with our enhanced headers
      const response = await fetchWithRetry(
        url, 
        3, 
        controller.signal, 
        fetchHeaders,
        domain.includes('hellofresh') // Pass flag for problematic sites
      );
      
      clearTimeout(timeoutId);
      
      let html = await response.text();
      console.log('✅ Successfully fetched webpage content, length:', html.length);

      // Memory usage optimization - trim very large HTML responses
      if (html.length > 1000000) {
        console.log('⚠️ HTML content is very large, trimming to avoid memory issues');
        html = html.substring(0, 1000000);
      }
      
      // Check if we got a valid HTML page (look for basic HTML structure)
      if (!html.includes('<html') && !html.includes('<body')) {
        console.error('❌ Response does not appear to be HTML:', html.substring(0, 200));
        throw new Error(`Failed to get HTML content from ${domain}. The site may be blocking scrapers.`);
      }

      // Extract initial recipe data
      console.log('🧩 Extracting recipe data...');
      const rawInstructions = extractInstructions(html);
      console.log('📝 Extracted raw instructions, length:', rawInstructions?.length || 0);
      
      // Clean instructions using Groq if API key is available
      let processedInstructions = rawInstructions;
      if (GROQ_API_KEY && rawInstructions) {
        console.log('🤖 Cleaning instructions with Groq API...');
        try {
          processedInstructions = await cleanInstructions(rawInstructions, GROQ_API_KEY);
          console.log('✨ Successfully cleaned instructions');
        } catch (error) {
          console.warn('⚠️ Error cleaning instructions with Groq:', error);
          // Continue with raw instructions if cleaning fails
        }
      } else {
        console.warn('⚠️ GROQ_API_KEY not available or no instructions found. Using raw instructions.');
      }

      // Extract ingredients
      const ingredients = extractIngredients(html);
      console.log('🧪 Extracted ingredients count:', ingredients.length);
      
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

      // Validate extracted content
      if (!recipe.title) {
        console.warn('⚠️ No title extracted from recipe');
        recipe.title = domain + " Recipe"; // Fallback title
      }
      
      if (ingredients.length === 0) {
        console.warn('⚠️ No ingredients extracted from recipe');
      }
      
      if (!recipe.instructions) {
        console.warn('⚠️ No instructions extracted from recipe');
      }

      console.log('✅ Successfully extracted recipe data:', {
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
      // Handle domain-specific error cases
      let statusCode = 502; // Default to Bad Gateway
      let errorMessage = 'Failed to fetch or process webpage';
      
      if (fetchError.name === 'AbortError') {
        errorMessage = `Timeout fetching recipe from ${domain} after ${domain.includes('hellofresh') ? 20 : 30} seconds`;
        console.error(`⏱️ ${errorMessage}`);
      } else {
        console.error('❌ Error fetching or processing webpage:', fetchError);
      }
      
      // More descriptive error for HelloFresh
      if (domain.includes('hellofresh')) {
        errorMessage = `HelloFresh recipes are currently difficult to import due to their website structure. Please try copying the ingredients and instructions manually.`;
        statusCode = 503; // Service Unavailable
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          details: fetchError.message || 'Unknown fetch error',
          url,
          domain
        }),
        { 
          status: statusCode,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
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
});
