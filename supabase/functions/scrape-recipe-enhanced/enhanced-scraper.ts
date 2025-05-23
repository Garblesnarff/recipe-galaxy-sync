import { fetchWithRetry } from "../scrape-recipe/html-utils.ts";
import { extractRecipeWithSitePatterns } from "./site-patterns.ts";
import { cleanInstructions } from "../scrape-recipe/instruction-cleaner.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

export async function scrapeRecipeEnhanced(url: string) {
  const domain = new URL(url).hostname;
  console.log(`🌐 Enhanced processing for domain: ${domain}`);
  
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ];
  
  const userAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
  
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
    
    // Increase timeout for challenging sites
    const timeoutMs = domain.includes('hellofresh') ? 30000 : 
                      domain.includes('foodnetwork') ? 25000 : 20000;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetchWithRetry(
      url, 
      3, 
      controller.signal, 
      fetchHeaders,
      domain.includes('hellofresh') || domain.includes('foodnetwork')
    );
    
    clearTimeout(timeoutId);
    
    let html = await response.text();
    console.log('✅ Successfully fetched webpage content, length:', html.length);

    if (html.length > 1500000) {
      console.log('⚠️ HTML content is very large, trimming to avoid memory issues');
      html = html.substring(0, 1500000);
    }
    
    if (!html.includes('<html') && !html.includes('<body')) {
      console.error('❌ Response does not appear to be HTML:', html.substring(0, 200));
      throw new Error(`Failed to get HTML content from ${domain}. The site may be blocking scrapers.`);
    }

    console.log('🧩 Extracting recipe data with enhanced patterns...');
    
    // Use enhanced extraction with site-specific patterns
    const extractedData = extractRecipeWithSitePatterns(html, domain);
    
    if (!extractedData) {
      throw new Error('Failed to extract recipe data with enhanced patterns');
    }

    // Clean instructions with Groq if available
    let processedInstructions = extractedData.instructions;
    if (GROQ_API_KEY && extractedData.instructions && typeof extractedData.instructions === 'string') {
      console.log('🤖 Cleaning instructions with Groq API...');
      try {
        processedInstructions = await cleanInstructions(extractedData.instructions, GROQ_API_KEY);
        console.log('✨ Successfully cleaned instructions');
      } catch (error) {
        console.warn('⚠️ Error cleaning instructions with Groq:', error);
        processedInstructions = extractedData.instructions;
      }
    }

    // Ensure ingredients is an array
    let ingredients = extractedData.ingredients || [];
    if (!Array.isArray(ingredients)) {
      ingredients = typeof ingredients === 'string' ? [ingredients] : [];
    }

    // Build final recipe object
    const recipe = {
      title: extractedData.title || `${domain} Recipe`,
      ingredients: ingredients,
      instructions: processedInstructions || extractedData.instructions || '',
      prep_time: extractedData.prep_time,
      cook_time: extractedData.cook_time,
      servings: extractedData.servings,
      image_url: extractedData.image_url,
      description: extractedData.description,
      source_url: url,
      extraction_method: extractedData.source || 'enhanced_patterns'
    };

    // Validate extracted data
    if (!recipe.title || recipe.title === `${domain} Recipe`) {
      console.warn('⚠️ No meaningful title extracted');
    }
    
    if (ingredients.length === 0) {
      console.warn('⚠️ No ingredients extracted from recipe');
    }
    
    if (!recipe.instructions) {
      console.warn('⚠️ No instructions extracted from recipe');
    }

    console.log('✅ Successfully extracted enhanced recipe data:', {
      title: recipe.title,
      ingredientsCount: recipe.ingredients.length,
      hasInstructions: !!recipe.instructions,
      hasImage: !!recipe.image_url,
      extractionMethod: recipe.extraction_method
    });

    return recipe;

  } catch (fetchError) {
    let statusCode = 502;
    let errorMessage = 'Failed to fetch or process webpage with enhanced scraper';
    
    if (fetchError.name === 'AbortError') {
      errorMessage = `Timeout fetching recipe from ${domain} after extended timeout`;
      console.error(`⏱️ ${errorMessage}`);
    } else {
      console.error('❌ Error fetching or processing webpage:', fetchError);
    }
    
    // Site-specific error messages
    if (domain.includes('hellofresh')) {
      errorMessage = `HelloFresh recipes require enhanced extraction. Please try copying the ingredients and instructions manually or use the Firecrawl method.`;
      statusCode = 503;
    } else if (domain.includes('foodnetwork')) {
      errorMessage = `Food Network recipes use dynamic content. Enhanced extraction attempted but failed. Please try copying manually or use the Firecrawl method.`;
      statusCode = 503;
    }
    
    throw {
      message: errorMessage,
      details: fetchError.message || 'Unknown fetch error',
      url,
      domain,
      status: statusCode,
      method: 'enhanced_scraper'
    };
  }
}