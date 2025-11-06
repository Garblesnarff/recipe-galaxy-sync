import { fetchWithRetry } from "./html-utils.ts";
import { extractIngredients, extractInstructions, getMetaContent } from "./recipe-extractor.ts";
import { cleanInstructions } from "./instruction-cleaner.ts";
import { extractMetadata } from "./metadata-extractor.ts";
import { scrapeWithFirecrawl } from "./firecrawl-fallback.ts";
import { circuitBreakerRegistry } from "./circuit-breaker.ts";
import { rateLimiterRegistry } from "./rate-limiter.ts";
import { validateHttpResponse, validateRecipeData, shouldFallback } from "./response-validator.ts";
import { retryWithBackoff, categorizeError, formatUserErrorMessage } from "./error-handler.ts";
import { recipeDeduplicator, createCacheKey } from "./request-deduplication.ts";
import { getSiteConfig, getUserAgent, getTimeout, getRetryAttempts } from "./site-config.ts";
import { scrapingMonitor, PerformanceTimer } from "./monitoring.ts";

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');

export async function scrapeRecipe(url: string) {
  const timer = new PerformanceTimer(`scrapeRecipe-${url}`);
  const domain = new URL(url).hostname.replace(/^www\./, '');
  const siteConfig = getSiteConfig(url);

  console.log(`🌐 Processing domain: ${domain}`);
  console.log(`⚙️ Site config: timeout=${siteConfig.timeout}ms, difficulty=${siteConfig.difficulty}`);

  // Try deduplication first
  const cacheKey = createCacheKey(url);
  try {
    const result = await recipeDeduplicator.execute(
      cacheKey,
      () => scrapeRecipeInternal(url, domain, siteConfig, timer),
      { forceRefresh: false }
    );
    return result;
  } catch (error) {
    console.error('❌ Scraping failed after all robustness measures:', error);
    throw error;
  }
}

async function scrapeRecipeInternal(
  url: string,
  domain: string,
  siteConfig: any,
  timer: PerformanceTimer
) {
  scrapingMonitor.startAttempt(url, 'standard');

  const userAgent = getUserAgent(url);
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

  // -- Main scraper logic with enhanced robustness --
  try {
    // Get circuit breaker for this domain
    const circuitBreaker = circuitBreakerRegistry.getBreaker(domain);
    const rateLimiter = rateLimiterRegistry.getLimiter(domain);

    timer.checkpoint('setup-complete');

    // Execute with circuit breaker and rate limiter
    const { response, html } = await circuitBreaker.execute(async () => {
      return await rateLimiter.execute(async () => {
        return await retryWithBackoff(
          async () => {
            const timeoutMs = getTimeout(url);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

            console.log('📥 Fetching webpage content from:', url);
            const response = await fetchWithRetry(
              url,
              getRetryAttempts(url),
              controller.signal,
              fetchHeaders,
              siteConfig.difficulty === 'hard'
            );
            clearTimeout(timeoutId);

            let html = await response.text();
            console.log('✅ Successfully fetched webpage content, length:', html.length);

            // Validate HTTP response
            const httpValidation = validateHttpResponse(response, html, domain);
            if (!httpValidation.isValid) {
              const errors = httpValidation.errors.join(', ');
              throw new Error(`HTTP validation failed: ${errors}`);
            }

            if (httpValidation.warnings.length > 0) {
              console.warn('⚠️ HTTP validation warnings:', httpValidation.warnings);
            }

            return { response, html };
          },
          {
            maxAttempts: getRetryAttempts(url),
            context: { url, domain }
          }
        );
      });
    });

    timer.checkpoint('fetch-complete');

    // Trim oversized HTML
    let processedHtml = html;
    if (html.length > 1000000) {
      console.log('⚠️ HTML content is very large, trimming...');
      processedHtml = html.substring(0, 1000000);
    }

    console.log('🧩 Extracting recipe data...');
    const rawInstructions = extractInstructions(processedHtml);
    console.log('📝 Extracted raw instructions, length:', rawInstructions?.length || 0);

    timer.checkpoint('extraction-complete');

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

    const ingredients = extractIngredients(processedHtml);
    console.log('🧪 Extracted ingredients count:', ingredients.length);

    const metadata = extractMetadata(processedHtml, url, domain);

    timer.checkpoint('metadata-extracted');

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

    timer.checkpoint('recipe-assembled');

    // Validate recipe data
    const recipeValidation = validateRecipeData(recipe, domain);
    console.log(`📊 Recipe validation: score=${recipeValidation.score}/100, valid=${recipeValidation.isValid}`);

    if (recipeValidation.errors.length > 0) {
      console.warn('⚠️ Recipe validation errors:', recipeValidation.errors);
    }

    if (recipeValidation.warnings.length > 0) {
      console.warn('⚠️ Recipe validation warnings:', recipeValidation.warnings);
    }

    // Check if we should fallback based on validation
    if (shouldFallback(recipeValidation)) {
      console.warn('⚠️ Validation score too low, will try Firecrawl fallback');
      throw new Error('Recipe validation failed: quality too low');
    }

    // Validation: If title and ingredients look good, return!
    if (recipe.title && Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0) {
      console.log('✅ Main scraper succeeded:', {
        title: recipe.title,
        ingredientsCount: recipe.ingredients.length,
        hasInstructions: !!recipe.instructions,
        hasImage: !!recipe.image_url,
        validationScore: recipeValidation.score
      });

      // Record success
      scrapingMonitor.recordSuccess(url, 'standard', {
        validationScore: recipeValidation.score
      });

      timer.end();
      return recipe;
    }

    console.warn('⚠️ Main scraper incomplete, falling back to Firecrawl...');
    throw new Error('Recipe extraction incomplete');

  } catch (primaryError) {
    console.warn('❌ Main scraper failed, will try Firecrawl fallback:', primaryError);

    // Categorize and record the error
    const categorizedError = categorizeError(primaryError, { url, domain });
    scrapingMonitor.recordFailure(
      url,
      'standard',
      categorizedError.message,
      categorizedError.category
    );

    // Try Firecrawl fallback
    try {
      const firecrawlRecipe = await scrapeWithFirecrawl(url);
      console.log('✅ Firecrawl fallback succeeded:', { title: firecrawlRecipe.title });

      // Validate firecrawl result
      const firecrawlValidation = validateRecipeData(firecrawlRecipe, domain);
      scrapingMonitor.recordSuccess(url, 'firecrawl', {
        validationScore: firecrawlValidation.score
      });

      timer.end();
      return firecrawlRecipe;

    } catch (firecrawlError) {
      console.error('❌ All scraping methods failed:', firecrawlError);

      // Record final failure
      const firecrawlCategorized = categorizeError(firecrawlError, { url, domain });
      scrapingMonitor.recordFailure(
        url,
        'firecrawl',
        firecrawlCategorized.message,
        firecrawlCategorized.category
      );

      // Generate user-friendly error message
      const userMessage = formatUserErrorMessage(categorizedError);

      let statusCode = 502;
      let errorMessage = userMessage;

      if (domain.includes('hellofresh')) {
        errorMessage = `HelloFresh recipes are currently difficult to import due to their website structure. Please try copying the ingredients and instructions manually.`;
        statusCode = 503;
      }

      timer.end();

      throw {
        message: errorMessage,
        details: categorizedError.message,
        category: categorizedError.category,
        url,
        domain,
        status: statusCode
      };
    }
  }
}
