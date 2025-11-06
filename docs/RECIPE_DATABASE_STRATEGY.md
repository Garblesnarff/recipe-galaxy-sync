# Recipe Database Build-Out Strategy

## Current State
Your application has a solid foundation:
- ✅ Complete database schema with recipe storage
- ✅ Web scraping infrastructure for recipe imports
- ✅ YouTube recipe extraction
- ✅ User authentication and authorization
- ✅ Collections and organization system
- ✅ Demo recipes (6 hardcoded examples)

## Database Growth Strategies

### 1. **User-Generated Content (Primary Strategy)** ⭐
**Best for:** Long-term sustainable growth, authentic content

#### Approach:
- Let users organically build your database by importing their own recipes
- Each user imports from their favorite recipe sites
- Over time, you accumulate a diverse recipe collection

#### Implementation:
**Advantages:**
- ✅ Legal and ethical (users import for personal use)
- ✅ No content licensing issues
- ✅ Diverse recipe sources
- ✅ Natural quality curation (users import what they like)
- ✅ Already implemented via your scraper

**Enhancements to Add:**
```typescript
// Track most popular imported recipes
interface PopularRecipe {
  source_url: string;
  import_count: number;
  unique_users: number;
  avg_rating: number;
}

// Track which sites users import from most
interface SiteStats {
  domain: string;
  total_imports: number;
  success_rate: number;
  avg_quality_score: number;
}
```

**Gamification Ideas:**
- Award badges for importing recipes (first recipe, 10 recipes, 50 recipes)
- "Recipe Curator" leaderboard
- Community collections (public recipe collections)
- Recipe import challenges ("Import 3 Italian recipes this week")

---

### 2. **Community Sharing & Social Features**
**Best for:** Viral growth, community engagement

#### Approach:
Users can optionally share their imported/created recipes publicly

#### Database Changes:
```sql
-- Add to recipes table
ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
ALTER TABLE recipes ADD COLUMN author_name TEXT;
ALTER TABLE recipes ADD COLUMN publish_date TIMESTAMP;
ALTER TABLE recipes ADD COLUMN view_count INTEGER DEFAULT 0;
ALTER TABLE recipes ADD COLUMN fork_count INTEGER DEFAULT 0; -- How many times copied

-- Create community recipe views
CREATE VIEW public_recipes AS
SELECT
  r.*,
  u.email as author_email,
  COUNT(DISTINCT cr.user_id) as saves_count,
  AVG(r.rating) as community_rating
FROM recipes r
LEFT JOIN auth.users u ON r.user_id = u.id
LEFT JOIN collection_recipes cr ON r.id = cr.recipe_id
WHERE r.is_public = TRUE
GROUP BY r.id, u.email;

-- Track recipe forks (user copies a public recipe)
CREATE TABLE recipe_forks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_recipe_id UUID REFERENCES recipes(id) ON DELETE SET NULL,
  forked_recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Features to Build:
1. **Public Recipe Feed** - Browse community-shared recipes
2. **Recipe Forking** - Copy others' recipes to your collection (with attribution)
3. **Social Profiles** - User recipe portfolios
4. **Following System** - Follow favorite recipe creators
5. **Comments & Reviews** - Community engagement

---

### 3. **Curated Seed Collection**
**Best for:** Initial database population, quality guarantee

#### Approach:
Manually curate 50-100 high-quality recipes as starter content

#### Implementation Plan:

**Step 1: Select Recipe Sources**
Focus on public domain or Creative Commons recipes:
- USDA Recipe Database
- Library of Congress cookbook archives
- WikiBooks Cookbook
- Recipes from expired cookbooks (70+ years old)
- Government health sites (MyPlate, NIH recipes)

**Step 2: Create Batch Import Tool**

```typescript
// File: src/scripts/seedRecipes.ts

import { createClient } from '@supabase/supabase-js';

interface SeedRecipe {
  title: string;
  description: string;
  image_url: string;
  ingredients: string[];
  instructions: string;
  prep_time: string;
  cook_time: string;
  servings: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  cuisine_type: string;
  categories: string[];
  diet_tags: string[];
  source_url: string;
  source_type: 'public_domain' | 'curated';
}

const SEED_RECIPES: SeedRecipe[] = [
  {
    title: "Classic Margherita Pizza",
    description: "Authentic Italian pizza with fresh mozzarella, basil, and tomato sauce",
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    ingredients: [
      "1 pizza dough ball (about 1 lb)",
      "1/2 cup tomato sauce",
      "8 oz fresh mozzarella, sliced",
      "Fresh basil leaves",
      "2 tbsp olive oil",
      "Salt and pepper to taste"
    ],
    instructions: `1. Preheat oven to 500°F (260°C) with pizza stone inside.
2. Roll out pizza dough on floured surface to 12-inch circle.
3. Spread tomato sauce evenly, leaving 1-inch border.
4. Arrange mozzarella slices on top.
5. Drizzle with olive oil, season with salt and pepper.
6. Transfer to hot pizza stone, bake 10-12 minutes until crust is golden.
7. Top with fresh basil leaves before serving.`,
    prep_time: "15 minutes",
    cook_time: "12 minutes",
    servings: 4,
    difficulty: 'Medium',
    cuisine_type: 'Italian',
    categories: ['Main Course', 'Pizza'],
    diet_tags: ['Vegetarian'],
    source_url: 'https://example.com/public-domain-recipes',
    source_type: 'curated'
  },
  // Add 49-99 more recipes...
];

async function seedDatabase() {
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service role for admin ops
  );

  console.log(`🌱 Seeding ${SEED_RECIPES.length} recipes...`);

  for (const recipe of SEED_RECIPES) {
    const { data, error } = await supabase
      .from('recipes')
      .insert({
        ...recipe,
        user_id: null, // System recipes have no owner
        recipe_type: 'curated',
        is_public: true,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error(`❌ Failed to seed "${recipe.title}":`, error);
    } else {
      console.log(`✅ Seeded: ${recipe.title}`);
    }
  }

  console.log('🎉 Seeding complete!');
}

// Run: tsx src/scripts/seedRecipes.ts
seedDatabase();
```

**Step 3: Create Recipe Categories**

```typescript
// Pre-populate common recipe categories
const RECIPE_CATEGORIES = [
  // By Meal Type
  'Breakfast', 'Brunch', 'Lunch', 'Dinner', 'Dessert', 'Snacks', 'Appetizers',

  // By Cuisine
  'Italian', 'Mexican', 'Chinese', 'Japanese', 'Indian', 'Thai', 'French',
  'Greek', 'Spanish', 'Middle Eastern', 'American', 'Mediterranean',

  // By Diet
  'Vegetarian', 'Vegan', 'Gluten-Free', 'Keto', 'Paleo', 'Low-Carb',
  'Dairy-Free', 'Nut-Free', 'Pescatarian',

  // By Method
  'Slow Cooker', 'Instant Pot', 'Air Fryer', 'Grilling', 'Baking', 'One-Pot',
  'No-Cook', 'Quick & Easy', '30-Minute Meals',

  // By Season
  'Summer', 'Fall', 'Winter', 'Spring', 'Holiday', 'BBQ',

  // By Type
  'Soup', 'Salad', 'Pasta', 'Pizza', 'Sandwich', 'Casserole', 'Stir-Fry',
  'Smoothie', 'Bread', 'Cake', 'Cookies'
];
```

---

### 4. **Recipe API Integration** 💰
**Best for:** Rapid database growth (requires budget)

#### Commercial APIs:

**Option A: Spoonacular API**
- 150 free API calls/day, then $0.002/call
- 5000+ recipes in free tier per month
- Best for: Comprehensive recipe database

```typescript
// File: src/services/recipe/spoonacularService.ts

interface SpoonacularRecipe {
  id: number;
  title: string;
  image: string;
  imageType: string;
  servings: number;
  readyInMinutes: number;
  // ... more fields
}

async function importFromSpoonacular(query: string, number: number = 10) {
  const API_KEY = process.env.SPOONACULAR_API_KEY;
  const response = await fetch(
    `https://api.spoonacular.com/recipes/complexSearch?query=${query}&number=${number}&apiKey=${API_KEY}`
  );

  const data = await response.json();

  // Transform and save to your database
  for (const recipe of data.results) {
    const detailedRecipe = await fetch(
      `https://api.spoonacular.com/recipes/${recipe.id}/information?apiKey=${API_KEY}`
    ).then(r => r.json());

    await saveRecipeFromAPI(detailedRecipe);
  }
}
```

**Option B: Edamam Recipe API**
- 10,000 free calls/month (developer tier)
- 2.3M+ recipes
- Best for: Nutritional data emphasis

**Option C: TheMealDB**
- Completely free (community-funded)
- 300+ recipes
- Best for: Basic free starter collection

---

### 5. **Batch Web Scraping** (⚠️ Legal Considerations)
**Use with caution - ensure compliance with site ToS**

#### Responsible Scraping Strategy:

```typescript
// File: src/scripts/batchScraper.ts

import { scrapeRecipe } from '../supabase/functions/scrape-recipe/scraper.ts';
import { getSiteConfig } from '../supabase/functions/scrape-recipe/site-config.ts';

interface ScrapingJob {
  name: string;
  urls: string[];
  delayBetweenRequests: number; // milliseconds
  maxConcurrent: number;
}

const SCRAPING_JOBS: ScrapingJob[] = [
  {
    name: "Public Recipe Collection",
    urls: [
      "https://allrecipes.com/recipe/12345/...",
      // Only scrape recipes you have rights to or for personal use
    ],
    delayBetweenRequests: 5000, // 5 seconds between requests
    maxConcurrent: 1 // One at a time to be respectful
  }
];

async function runBatchScraper(job: ScrapingJob) {
  console.log(`🚀 Starting batch scrape: ${job.name}`);
  console.log(`📋 ${job.urls.length} URLs to process`);

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < job.urls.length; i++) {
    const url = job.urls[i];

    try {
      console.log(`[${i + 1}/${job.urls.length}] Scraping: ${url}`);

      const recipe = await scrapeRecipe(url);

      // Save to database
      await supabase.from('recipes').insert({
        ...recipe,
        user_id: null, // System recipe
        is_public: true,
        recipe_type: 'webpage'
      });

      successCount++;
      console.log(`✅ Success: ${recipe.title}`);

    } catch (error) {
      failCount++;
      console.error(`❌ Failed: ${url}`, error);
    }

    // Respectful delay between requests
    if (i < job.urls.length - 1) {
      await new Promise(resolve =>
        setTimeout(resolve, job.delayBetweenRequests)
      );
    }
  }

  console.log(`
  📊 Batch Scrape Complete
  ✅ Success: ${successCount}
  ❌ Failed: ${failCount}
  📈 Success Rate: ${(successCount / job.urls.length * 100).toFixed(1)}%
  `);
}

// ⚠️ IMPORTANT: Only run this for recipes you have permission to scrape
// or for personal non-commercial use
```

**Legal Guidelines:**
1. ✅ Scrape only for personal use or with permission
2. ✅ Respect robots.txt
3. ✅ Add attribution to original sources
4. ✅ Implement rate limiting (use your new rate limiter!)
5. ❌ Don't scrape copyrighted recipe photos
6. ❌ Don't republish scraped content commercially
7. ❌ Don't overwhelm servers with requests

---

### 6. **User Recipe Creation**
**Best for:** Original content, brand building

#### Features to Add:

**Recipe Builder Interface:**
```typescript
// Enhanced recipe creation form with templates

const RECIPE_TEMPLATES = [
  {
    name: "Basic Recipe",
    fields: ['title', 'description', 'ingredients', 'instructions']
  },
  {
    name: "Detailed Recipe",
    fields: ['title', 'description', 'prep_time', 'cook_time', 'servings',
             'difficulty', 'ingredients', 'instructions', 'tips', 'nutrition']
  },
  {
    name: "Quick Meal",
    fields: ['title', 'ingredients', 'instructions', 'cook_time'],
    defaults: { difficulty: 'Easy' }
  }
];
```

**AI-Assisted Recipe Writing:**
```typescript
// Use OpenAI to help users write better recipes

async function enhanceRecipeInstructions(rawInstructions: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [{
      role: "system",
      content: "You are a professional recipe writer. Enhance the following recipe instructions to be clear, detailed, and easy to follow. Maintain the cooking method but improve clarity."
    }, {
      role: "user",
      content: rawInstructions
    }]
  });

  return response.choices[0].message.content;
}
```

---

### 7. **Partnership & Content Licensing**
**Best for:** Professional quality, exclusive content

#### Potential Partners:
- Food bloggers (offer free tools in exchange for recipe syndication)
- Cooking schools (student recipe submissions)
- Meal kit companies (past recipes)
- Restaurant recipe releases
- Cookbook authors (older out-of-print cookbooks)

#### Implementation:
```sql
-- Track content partnerships
CREATE TABLE content_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  website_url TEXT,
  contact_email TEXT,
  license_type TEXT, -- 'exclusive', 'non-exclusive', 'attribution'
  license_terms JSONB,
  recipes_contributed INTEGER DEFAULT 0,
  partnership_start DATE,
  partnership_end DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Link recipes to partners
ALTER TABLE recipes ADD COLUMN partner_id UUID REFERENCES content_partners(id);
ALTER TABLE recipes ADD COLUMN license_attribution TEXT;
```

---

## Recommended Implementation Plan

### Phase 1: Foundation (Week 1-2)
✅ Already Done:
- Database schema ✅
- User recipe imports ✅
- Web scraping infrastructure ✅

🎯 To Do:
- [ ] Add public recipe sharing feature
- [ ] Create recipe templates for user creation
- [ ] Build community recipe feed

### Phase 2: Seed Content (Week 3-4)
- [ ] Curate 50 high-quality starter recipes
- [ ] Implement seeding script
- [ ] Add recipe categories and tags
- [ ] Create demo collections

### Phase 3: Community Features (Month 2)
- [ ] Recipe forking/copying
- [ ] User profiles & portfolios
- [ ] Comments and reviews
- [ ] Following system

### Phase 4: Partnerships (Month 3+)
- [ ] Reach out to food bloggers
- [ ] Set up content partnership program
- [ ] Implement partner attribution
- [ ] API integration (if budget allows)

---

## Growth Metrics to Track

```sql
-- Create analytics views
CREATE VIEW recipe_growth_metrics AS
SELECT
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as new_recipes,
  COUNT(DISTINCT user_id) as unique_contributors,
  COUNT(*) FILTER (WHERE recipe_type = 'manual') as manual_recipes,
  COUNT(*) FILTER (WHERE recipe_type = 'webpage') as imported_recipes,
  COUNT(*) FILTER (WHERE recipe_type = 'youtube') as youtube_recipes,
  COUNT(*) FILTER (WHERE is_public = TRUE) as public_recipes
FROM recipes
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Most popular recipe sources
CREATE VIEW popular_recipe_sources AS
SELECT
  REGEXP_REPLACE(source_url, '^https?://([^/]+).*', '\1') as domain,
  COUNT(*) as import_count,
  COUNT(DISTINCT user_id) as unique_users,
  AVG(rating) as avg_rating
FROM recipes
WHERE source_url IS NOT NULL
GROUP BY domain
ORDER BY import_count DESC
LIMIT 50;
```

---

## Legal & Ethical Considerations

### ✅ Safe Practices:
1. **User-imported recipes**: Legal for personal use
2. **Public domain recipes**: Free to use (70+ years old)
3. **Creative Commons**: Follow license terms
4. **Original user content**: Rightfully owned by users
5. **API-sourced recipes**: Covered by API license

### ⚠️ Caution Required:
1. **Commercial republishing**: Need explicit permission
2. **Copyrighted photos**: Don't scrape images without rights
3. **Brand names**: Be careful with trademarked recipe names
4. **Attribution**: Always credit original sources

### 🛡️ Protection Measures:
```typescript
// Add to all scraped/imported recipes
interface RecipeAttribution {
  original_url: string;
  source_name: string;
  imported_date: string;
  import_method: 'user_import' | 'api' | 'curated';
  license_notes?: string;
}

// Add DMCA takedown process
// File: src/pages/DMCA.tsx
```

---

## Cost Estimates

### Budget Options:

**$0/month - Organic Growth**
- User-generated imports ✅
- Manual curation ✅
- Free APIs (TheMealDB) ✅
- Growth rate: 50-200 recipes/month

**$50/month - API Tier**
- Spoonacular Developer Plan
- 5,000 recipes/month
- Growth rate: 1,000-5,000 recipes/month

**$200+/month - Professional Tier**
- Edamam API access
- Content partnerships
- Professional curation team
- Growth rate: 10,000+ recipes/month

---

## Quick Start: Next Steps

1. **This Week:**
   ```bash
   # Create seeding script
   npm install tsx
   tsx src/scripts/seedRecipes.ts
   ```

2. **Enable Public Sharing:**
   ```sql
   ALTER TABLE recipes ADD COLUMN is_public BOOLEAN DEFAULT FALSE;
   ```

3. **Track Popular Imports:**
   ```typescript
   // Add analytics to your import function
   trackPopularRecipe(recipe.source_url);
   ```

4. **Launch Community Features:**
   - Add "Share Recipe" button
   - Create public recipe feed
   - Build recipe discovery page

---

## Success Metrics

**Target Milestones:**
- Month 1: 100 recipes (seed + early users)
- Month 3: 500 recipes (community growth)
- Month 6: 2,000 recipes (viral growth)
- Month 12: 10,000 recipes (established platform)

**Quality Metrics:**
- Average rating: 4.0+
- Recipes with photos: 80%+
- Complete metadata: 90%+
- User retention: 40%+ monthly

---

## Conclusion

**Recommended Primary Strategy:** User-Generated Content + Curated Seed

This approach is:
- ✅ Legal and sustainable
- ✅ Builds community
- ✅ Low cost
- ✅ Scales naturally
- ✅ Already 80% implemented

**Next Immediate Actions:**
1. Seed 50 curated recipes this week
2. Add public sharing toggle
3. Create community recipe feed
4. Gamify recipe imports

Your robust scraping infrastructure is ready - now let your users fill the database! 🚀
