/**
 * Batch Recipe Scraper
 *
 * Responsible batch scraping tool for building recipe database.
 *
 * ⚠️  IMPORTANT LEGAL NOTICE:
 * - Only use for recipes you have permission to scrape
 * - Respect robots.txt and site ToS
 * - Use for personal/non-commercial purposes only
 * - Always attribute original sources
 * - Implement respectful rate limiting
 *
 * Run with: npx tsx src/scripts/batchScraper.ts
 */

import { createClient } from '@supabase/supabase-js';

interface ScrapingJob {
  name: string;
  description: string;
  urls: string[];
  delayBetweenRequests: number; // milliseconds
  maxConcurrent: number;
  respectRateLimit: boolean;
}

interface ScrapeResult {
  url: string;
  success: boolean;
  title?: string;
  error?: string;
  duration: number;
}

/**
 * Example scraping jobs
 * Replace with your own URLs - only scrape sites you have permission for!
 */
const SCRAPING_JOBS: ScrapingJob[] = [
  {
    name: "Example Job - Public Domain Recipes",
    description: "Scrape recipes that are confirmed to be in public domain or have explicit permission",
    urls: [
      // Add your URLs here
      // Example: "https://allrecipes.com/recipe/12345/...",
    ],
    delayBetweenRequests: 5000, // 5 seconds between requests (be respectful!)
    maxConcurrent: 1, // One at a time
    respectRateLimit: true
  }
];

/**
 * Call your existing scraper function via Supabase Edge Function
 */
async function scrapeRecipeFromUrl(url: string): Promise<any> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase credentials');
  }

  // Call your scrape-recipe edge function
  const response = await fetch(`${supabaseUrl}/functions/v1/scrape-recipe`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({ url })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Scraping failed: ${error}`);
  }

  return response.json();
}

/**
 * Save scraped recipe to database
 */
async function saveScrapedRecipe(recipe: any, sourceUrl: string, supabase: any): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .insert({
      // Basic info from scraper
      title: recipe.title,
      description: recipe.description || '',
      image_url: recipe.image_url,

      // Recipe content
      ingredients: recipe.ingredients || [],
      instructions: recipe.instructions || '',

      // Timing and servings
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,

      // Classification
      difficulty: recipe.difficulty,
      cuisine_type: recipe.cuisine_type,
      categories: recipe.categories || [],
      diet_tags: recipe.diet_tags || [],

      // Source tracking
      source_url: sourceUrl,
      source_type: 'scraped',
      recipe_type: 'webpage',

      // Attribution
      extraction_method: recipe.extraction_method || recipe._metadata?.extraction_method,

      // Make public if you have permission
      user_id: null, // System recipe
      is_public: false, // Set to false by default for safety

      // Timestamps
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    throw error;
  }
}

/**
 * Sleep utility for rate limiting
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a single scraping job
 */
async function runScrapingJob(job: ScrapingJob): Promise<void> {
  console.log('\n' + '='.repeat(80));
  console.log(`🚀 Starting Scraping Job: ${job.name}`);
  console.log('='.repeat(80));
  console.log(`📄 Description: ${job.description}`);
  console.log(`📋 URLs to process: ${job.urls.length}`);
  console.log(`⏱️  Delay between requests: ${job.delayBetweenRequests}ms`);
  console.log(`🔢 Max concurrent: ${job.maxConcurrent}`);
  console.log('');

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // Track results
  const results: ScrapeResult[] = [];
  let successCount = 0;
  let failCount = 0;

  // Process URLs sequentially (respectful scraping)
  for (let i = 0; i < job.urls.length; i++) {
    const url = job.urls[i];
    const startTime = Date.now();

    console.log(`[${i + 1}/${job.urls.length}] Processing: ${url}`);

    try {
      // Scrape the recipe
      console.log('   📥 Scraping...');
      const recipe = await scrapeRecipeFromUrl(url);

      // Save to database
      console.log('   💾 Saving to database...');
      await saveScrapedRecipe(recipe, url, supabase);

      const duration = Date.now() - startTime;
      successCount++;

      results.push({
        url,
        success: true,
        title: recipe.title,
        duration
      });

      console.log(`   ✅ Success: "${recipe.title}" (${duration}ms)`);

    } catch (error: any) {
      const duration = Date.now() - startTime;
      failCount++;

      results.push({
        url,
        success: false,
        error: error.message,
        duration
      });

      console.error(`   ❌ Failed: ${error.message} (${duration}ms)`);
    }

    // Rate limiting: wait before next request (except for last URL)
    if (i < job.urls.length - 1) {
      console.log(`   ⏸️  Waiting ${job.delayBetweenRequests}ms before next request...`);
      await sleep(job.delayBetweenRequests);
      console.log('');
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 Scraping Job Complete');
  console.log('='.repeat(80));
  console.log(`✅ Successful: ${successCount}/${job.urls.length}`);
  console.log(`❌ Failed: ${failCount}/${job.urls.length}`);
  console.log(`📈 Success Rate: ${((successCount / job.urls.length) * 100).toFixed(1)}%`);

  // Calculate average duration
  const avgDuration = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  console.log(`⏱️  Average Duration: ${Math.round(avgDuration)}ms`);

  // List failures if any
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    console.log('\n⚠️  Failed URLs:');
    failures.forEach(f => {
      console.log(`   - ${f.url}`);
      console.log(`     Error: ${f.error}`);
    });
  }

  // List successes
  const successes = results.filter(r => r.success);
  if (successes.length > 0) {
    console.log('\n✅ Successfully Scraped:');
    successes.forEach(s => {
      console.log(`   - ${s.title}`);
      console.log(`     URL: ${s.url}`);
    });
  }

  console.log('\n');
}

/**
 * Interactive mode - prompt user for URLs
 */
async function interactiveMode() {
  console.log('🤖 Interactive Batch Scraper');
  console.log('Enter URLs one per line. Press Ctrl+D (Unix) or Ctrl+Z (Windows) when done.');
  console.log('');

  // In a real implementation, you'd use readline or inquirer
  // For now, this is a placeholder
  console.log('⚠️  Interactive mode not yet implemented');
  console.log('Please edit the SCRAPING_JOBS array in this file to add your URLs');
}

/**
 * Validate URLs before scraping
 */
function validateUrls(urls: string[]): { valid: string[], invalid: string[] } {
  const valid: string[] = [];
  const invalid: string[] = [];

  for (const url of urls) {
    try {
      new URL(url);
      valid.push(url);
    } catch {
      invalid.push(url);
    }
  }

  return { valid, invalid };
}

/**
 * Main execution
 */
async function main() {
  console.log('🌟 Recipe Batch Scraper');
  console.log('='.repeat(80));
  console.log('');
  console.log('⚠️  LEGAL REMINDER:');
  console.log('   - Only scrape recipes you have permission to use');
  console.log('   - Respect robots.txt and site Terms of Service');
  console.log('   - Use responsibly with appropriate rate limiting');
  console.log('   - Always attribute original sources');
  console.log('');

  // Check if there are any jobs configured
  if (SCRAPING_JOBS.length === 0 || SCRAPING_JOBS[0].urls.length === 0) {
    console.log('📋 No scraping jobs configured.');
    console.log('');
    console.log('To use this tool:');
    console.log('1. Edit src/scripts/batchScraper.ts');
    console.log('2. Add URLs to the SCRAPING_JOBS array');
    console.log('3. Run: npx tsx src/scripts/batchScraper.ts');
    console.log('');
    console.log('⚠️  Remember: Only scrape recipes you have permission to use!');
    return;
  }

  // Validate URLs in all jobs
  for (const job of SCRAPING_JOBS) {
    const { valid, invalid } = validateUrls(job.urls);

    if (invalid.length > 0) {
      console.error(`❌ Invalid URLs found in job "${job.name}":`);
      invalid.forEach(url => console.error(`   - ${url}`));
      console.log('');
      continue;
    }

    // Run the job
    await runScrapingJob(job);
  }

  console.log('🎉 All scraping jobs complete!');
}

// Run the scraper
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
