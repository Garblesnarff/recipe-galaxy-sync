
import { fetchWithRetry } from "./html-utils.ts";
import { extractIngredients, extractInstructions, getMetaContent } from "./recipe-extractor.ts";
import { cleanInstructions } from "./instruction-cleaner.ts";
import { extractMetadata } from "./metadata-extractor.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

export async function scrapeRecipe(url: string) {
  const domain = new URL(url).hostname;
  console.log(`🌐 Processing domain: ${domain}`);
  
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Safari/605.1.15',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36'
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
    
    const timeoutMs = domain.includes('hellofresh') ? 20000 : 30000;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    const response = await fetchWithRetry(
      url, 
      3, 
      controller.signal, 
      fetchHeaders,
      domain.includes('hellofresh')
    );
    
    clearTimeout(timeoutId);
    
    let html = await response.text();
    console.log('✅ Successfully fetched webpage content, length:', html.length);

    if (html.length > 1000000) {
      console.log('⚠️ HTML content is very large, trimming to avoid memory issues');
      html = html.substring(0, 1000000);
    }
    
    if (!html.includes('<html') && !html.includes('<body')) {
      console.error('❌ Response does not appear to be HTML:', html.substring(0, 200));
      throw new Error(`Failed to get HTML content from ${domain}. The site may be blocking scrapers.`);
    }

    console.log('🧩 Extracting recipe data...');
    const rawInstructions = extractInstructions(html);
    console.log('📝 Extracted raw instructions, length:', rawInstructions?.length || 0);
    
    let processedInstructions = rawInstructions;
    if (GROQ_API_KEY && rawInstructions) {
      console.log('🤖 Cleaning instructions with Groq API...');
      try {
        processedInstructions = await cleanInstructions(rawInstructions, GROQ_API_KEY);
        console.log('✨ Successfully cleaned instructions');
      } catch (error) {
        console.warn('⚠️ Error cleaning instructions with Groq:', error);
      }
    } else {
      console.warn('⚠️ GROQ_API_KEY not available or no instructions found. Using raw instructions.');
    }

    const ingredients = extractIngredients(html);
    console.log('🧪 Extracted ingredients count:', ingredients.length);
    
    const metadata = extractMetadata(html, url, domain);
    
    // Process image URL to ensure it's a string
    let imageUrl = metadata.image_url;
    if (typeof imageUrl === 'object' && imageUrl !== null) {
      // Extract the URL from the object
      if (imageUrl.url) {
        imageUrl = imageUrl.url;
      } else if (Array.isArray(imageUrl) && imageUrl.length > 0) {
        if (typeof imageUrl[0] === 'string') {
          imageUrl = imageUrl[0];
        } else if (imageUrl[0]?.url) {
          imageUrl = imageUrl[0].url;
        }
      }
      console.log('📸 Processed image URL from complex object:', imageUrl?.substring(0, 100));
    }
    
    const recipe = {
      ...metadata,
      image_url: imageUrl,
      ingredients: ingredients,
      instructions: processedInstructions
    };

    if (!recipe.title) {
      console.warn('⚠️ No title extracted from recipe');
      recipe.title = domain + " Recipe";
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
      hasImage: !!recipe.image_url,
      imageUrl: typeof recipe.image_url === 'string' ? recipe.image_url?.substring(0, 100) : 'Not a string'
    });

    return recipe;
  } catch (fetchError) {
    let statusCode = 502;
    let errorMessage = 'Failed to fetch or process webpage';
    
    if (fetchError.name === 'AbortError') {
      errorMessage = `Timeout fetching recipe from ${domain} after ${domain.includes('hellofresh') ? 20 : 30} seconds`;
      console.error(`⏱️ ${errorMessage}`);
    } else {
      console.error('❌ Error fetching or processing webpage:', fetchError);
    }
    
    if (domain.includes('hellofresh')) {
      errorMessage = `HelloFresh recipes are currently difficult to import due to their website structure. Please try copying the ingredients and instructions manually.`;
      statusCode = 503;
    }
    
    throw {
      message: errorMessage,
      details: fetchError.message || 'Unknown fetch error',
      url,
      domain,
      status: statusCode
    };
  }
}
