# Recipe Database Scripts

This directory contains utility scripts for populating and managing your recipe database.

## Available Scripts

### 1. Recipe Seeding (`seedRecipes.ts`)

Populates your database with a curated collection of starter recipes.

**Features:**
- 10 high-quality, tested recipes
- Diverse categories (breakfast, dinner, dessert, etc.)
- Multiple cuisines (Italian, Mexican, Greek, Asian, American)
- Dietary variety (vegetarian, vegan, gluten-free options)
- Professional recipe formatting

**Usage:**
```bash
# Run the seeding script
npm run db:seed

# Or directly with tsx
npx tsx src/scripts/seedRecipes.ts
```

**Requirements:**
- Environment variables set in `.env`:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY` - Supabase key

**What it does:**
1. Reads curated recipes from the `SEED_RECIPES` array
2. Inserts each recipe into your Supabase database
3. Marks recipes as public and system-owned (no specific user)
4. Provides detailed logging of success/failure for each recipe

**Customization:**
To add your own recipes to the seed data:
1. Open `src/scripts/seedRecipes.ts`
2. Add new recipe objects to the `SEED_RECIPES` array
3. Follow the existing recipe structure
4. Run the script

**Example Recipe Structure:**
```typescript
{
  title: "Your Recipe Name",
  description: "Brief description",
  image_url: "https://images.unsplash.com/...",
  ingredients: [
    "1 cup flour",
    "2 eggs",
    // ...
  ],
  instructions: "Step by step instructions...",
  prep_time: "15 minutes",
  cook_time: "30 minutes",
  servings: 4,
  difficulty: 'Easy' | 'Medium' | 'Hard',
  cuisine_type: "Italian",
  categories: ['Main Course', 'Pasta'],
  diet_tags: ['Vegetarian'],
  cooking_method: "Baking",
  source_type: 'curated'
}
```

---

### 2. Batch Scraper (`batchScraper.ts`)

Responsible batch scraping tool for importing recipes from websites.

**⚠️ LEGAL WARNING:**
- Only use for recipes you have permission to scrape
- Respect robots.txt and site Terms of Service
- Use for personal/non-commercial purposes only
- Always attribute original sources
- Implement respectful rate limiting

**Features:**
- Batch processing of multiple URLs
- Configurable rate limiting (respectful delays)
- Automatic retry logic with your robust scraper
- Progress tracking and detailed reporting
- URL validation
- Success/failure statistics

**Usage:**
```bash
# Run the batch scraper
npm run db:scrape

# Or directly with tsx
npx tsx src/scripts/batchScraper.ts
```

**Configuration:**
Edit the `SCRAPING_JOBS` array in `batchScraper.ts`:

```typescript
const SCRAPING_JOBS: ScrapingJob[] = [
  {
    name: "My Recipe Collection",
    description: "Personal recipes I have permission to scrape",
    urls: [
      "https://example.com/recipe1",
      "https://example.com/recipe2",
      // Add more URLs...
    ],
    delayBetweenRequests: 5000, // 5 seconds (be respectful!)
    maxConcurrent: 1, // Process one at a time
    respectRateLimit: true
  }
];
```

**Best Practices:**
1. **Start small**: Test with 5-10 URLs first
2. **Rate limiting**: Use at least 5 seconds between requests
3. **Monitor errors**: Check the failure report to adjust
4. **Respect servers**: Don't overwhelm target websites
5. **Legal compliance**: Only scrape what you're allowed to

**Output:**
The script provides detailed reporting:
- Total URLs processed
- Success/failure counts
- Success rate percentage
- Average scraping duration
- List of failed URLs with error messages
- List of successfully scraped recipe titles

**Example Output:**
```
🚀 Starting Scraping Job: My Recipe Collection
📋 URLs to process: 10
⏱️  Delay between requests: 5000ms

[1/10] Processing: https://example.com/recipe1
   📥 Scraping...
   💾 Saving to database...
   ✅ Success: "Chocolate Chip Cookies" (2,345ms)
   ⏸️  Waiting 5000ms before next request...

...

📊 Scraping Job Complete
✅ Successful: 8/10
❌ Failed: 2/10
📈 Success Rate: 80.0%
⏱️  Average Duration: 2,456ms
```

---

## Setup Instructions

### First-time Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Create a `.env` file in the project root:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

3. **Verify database schema:**
   Ensure your Supabase database has the recipes table with all required columns.

### Running Scripts

#### Seed the Database (Recommended First Step)
```bash
npm run db:seed
```

This will populate your database with 10 starter recipes that you can use immediately.

#### Batch Scrape Recipes (Optional, Advanced)
```bash
# 1. Edit src/scripts/batchScraper.ts
# 2. Add your URLs to SCRAPING_JOBS
# 3. Run the scraper
npm run db:scrape
```

---

## Common Issues & Troubleshooting

### Issue: "Missing Supabase credentials"
**Solution:** Ensure your `.env` file has the required variables:
- `VITE_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` or `VITE_SUPABASE_ANON_KEY`

### Issue: Seeding fails with database errors
**Solution:**
1. Check that your database schema is up to date
2. Verify you have write permissions
3. Check Supabase logs for detailed error messages

### Issue: Scraper times out or fails frequently
**Solution:**
1. Increase `delayBetweenRequests` to 10000ms (10 seconds)
2. Check that the target website is accessible
3. Review your scraper's robustness settings in `site-config.ts`
4. Some sites block automated access - consider Firecrawl API instead

### Issue: Invalid URLs in scraping job
**Solution:**
The script validates URLs before scraping. Ensure all URLs:
- Start with `http://` or `https://`
- Are properly formatted
- Point to actual recipe pages

---

## Alternative Database Population Methods

### 1. User Imports (Recommended)
Let your users populate the database organically by importing their own recipes.

**Advantages:**
- Legal and ethical
- Diverse content
- Community-driven growth

### 2. Recipe APIs
Use commercial recipe APIs for rapid growth:

**Spoonacular API:**
```bash
# Install Spoonacular SDK (if available)
npm install spoonacular-api

# Create integration script
# See docs/RECIPE_DATABASE_STRATEGY.md for examples
```

**TheMealDB (Free):**
```typescript
// Free API - great for starter recipes
const response = await fetch('https://www.themealdb.com/api/json/v1/1/search.php?s=');
const data = await response.json();
// Transform and import
```

### 3. Community Contributions
Enable public recipe sharing in your app:
- Users can mark recipes as public
- Others can "fork" (copy) public recipes
- Build a community recipe library organically

See `docs/RECIPE_DATABASE_STRATEGY.md` for detailed implementation guides.

---

## Database Schema Reference

### Recipes Table
Key columns populated by these scripts:
- `title` - Recipe name
- `description` - Recipe description
- `ingredients` - JSON array of ingredients
- `instructions` - Step-by-step cooking instructions
- `prep_time`, `cook_time` - Timing information
- `servings` - Number of servings
- `difficulty` - Easy/Medium/Hard
- `cuisine_type` - Type of cuisine
- `categories` - Array of categories
- `diet_tags` - Dietary restrictions/preferences
- `image_url` - Recipe photo URL
- `source_url` - Original recipe URL (for scraped recipes)
- `source_type` - How recipe was added (curated, scraped, etc.)
- `recipe_type` - manual/webpage/youtube
- `is_public` - Whether recipe is publicly visible
- `user_id` - Owner (null for system recipes)

---

## Contributing

### Adding More Seed Recipes
1. Fork the repository
2. Add recipes to `SEED_RECIPES` array in `seedRecipes.ts`
3. Ensure recipes follow the structure
4. Test locally: `npm run db:seed`
5. Submit a pull request

### Improving Scripts
Contributions welcome for:
- Better error handling
- Progress bars
- Resume capability for interrupted scraping
- Recipe validation before insertion
- Duplicate detection
- Image optimization
- Nutrition data enrichment

---

## Script Maintenance

### Regular Tasks
- Update seed recipes quarterly with new seasonal recipes
- Review and update `SCRAPING_JOBS` URLs (sites may change)
- Monitor error rates and adjust scraper settings
- Clean up failed/incomplete recipes in database

### Performance Tips
- Run seeding once for initial setup, not repeatedly
- Batch scrape during off-peak hours
- Use Supabase's row-level security for safety
- Monitor your Supabase usage/quotas

---

## Resources

- **Full Strategy Guide**: `docs/RECIPE_DATABASE_STRATEGY.md`
- **Scraper Documentation**: `supabase/functions/scrape-recipe/`
- **Site Configuration**: `supabase/functions/scrape-recipe/site-config.ts`
- **Circuit Breaker**: `supabase/functions/scrape-recipe/circuit-breaker.ts`
- **Rate Limiter**: `supabase/functions/scrape-recipe/rate-limiter.ts`

---

## Legal Disclaimer

These scripts are provided for educational and personal use. When using the batch scraper:

1. ✅ **DO**: Get permission before scraping
2. ✅ **DO**: Respect robots.txt
3. ✅ **DO**: Use appropriate rate limiting
4. ✅ **DO**: Attribute original sources
5. ✅ **DO**: Use for personal, non-commercial purposes

6. ❌ **DON'T**: Scrape copyrighted content without permission
7. ❌ **DON'T**: Overwhelm servers with requests
8. ❌ **DON'T**: Violate site Terms of Service
9. ❌ **DON'T**: Republish scraped content commercially

**You are responsible for ensuring your use complies with all applicable laws and terms of service.**

---

## Questions?

For issues or questions:
1. Check `docs/RECIPE_DATABASE_STRATEGY.md` for detailed guides
2. Review scraper logs for specific errors
3. Open an issue on GitHub
4. Check Supabase logs for database errors

Happy recipe collecting! 🍳👨‍🍳👩‍🍳
