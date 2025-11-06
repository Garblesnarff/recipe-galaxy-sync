/**
 * Recipe Database Seeding Script
 *
 * This script populates the database with curated starter recipes.
 * Run with: npx tsx src/scripts/seedRecipes.ts
 */

import { createClient } from '@supabase/supabase-js';

// Type definitions
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
  cooking_method?: string;
  season_occasion?: string[];
  source_url?: string;
  source_type: 'public_domain' | 'curated' | 'original';
}

// Curated recipe collection
const SEED_RECIPES: SeedRecipe[] = [
  {
    title: "Classic Margherita Pizza",
    description: "Authentic Italian pizza with fresh mozzarella, basil, and tomato sauce. A timeless favorite that's surprisingly easy to make at home.",
    image_url: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800",
    ingredients: [
      "1 pizza dough ball (about 1 lb)",
      "1/2 cup tomato sauce",
      "8 oz fresh mozzarella, sliced",
      "Fresh basil leaves",
      "2 tbsp extra virgin olive oil",
      "Salt and pepper to taste",
      "Flour for dusting"
    ],
    instructions: `1. Preheat your oven to 500°F (260°C). If you have a pizza stone, place it in the oven while preheating.

2. On a floured surface, roll out the pizza dough into a 12-inch circle, about 1/4 inch thick.

3. Spread the tomato sauce evenly over the dough, leaving a 1-inch border around the edges for the crust.

4. Arrange the mozzarella slices evenly on top of the sauce.

5. Drizzle with olive oil and season with salt and pepper.

6. Carefully transfer the pizza to the hot pizza stone or a baking sheet.

7. Bake for 10-12 minutes, until the crust is golden and the cheese is bubbling.

8. Remove from oven and immediately top with fresh basil leaves.

9. Let cool for 2-3 minutes, slice, and serve hot.`,
    prep_time: "15 minutes",
    cook_time: "12 minutes",
    servings: 4,
    difficulty: 'Medium',
    cuisine_type: 'Italian',
    categories: ['Main Course', 'Pizza'],
    diet_tags: ['Vegetarian'],
    cooking_method: 'Baking',
    source_type: 'curated'
  },
  {
    title: "Perfect Scrambled Eggs",
    description: "Creamy, fluffy scrambled eggs with a restaurant-quality texture. The secret is low heat and patience.",
    image_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=800",
    ingredients: [
      "4 large eggs",
      "2 tbsp butter",
      "2 tbsp milk or cream",
      "Salt and pepper to taste",
      "Fresh chives for garnish (optional)"
    ],
    instructions: `1. Crack eggs into a bowl and whisk together with milk or cream until well combined.

2. Heat a non-stick pan over low heat and add butter.

3. Once butter is melted, pour in the egg mixture.

4. Let the eggs sit for about 30 seconds until they start to set at the edges.

5. Using a spatula, gently push the eggs from the edges to the center, allowing uncooked egg to flow to the edges.

6. Continue this process for 3-4 minutes, stirring slowly and gently.

7. When eggs are mostly set but still slightly runny, remove from heat (they'll continue cooking).

8. Season with salt and pepper, and garnish with fresh chives if desired.

9. Serve immediately.`,
    prep_time: "2 minutes",
    cook_time: "5 minutes",
    servings: 2,
    difficulty: 'Easy',
    cuisine_type: 'American',
    categories: ['Breakfast', 'Quick & Easy'],
    diet_tags: ['Vegetarian', 'Gluten-Free'],
    cooking_method: 'Pan-frying',
    source_type: 'curated'
  },
  {
    title: "Classic Chicken Noodle Soup",
    description: "Comforting homemade chicken soup with tender vegetables and egg noodles. Perfect for cold days or when you're feeling under the weather.",
    image_url: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=800",
    ingredients: [
      "1 lb chicken breast, diced",
      "8 cups chicken broth",
      "2 carrots, sliced",
      "2 celery stalks, sliced",
      "1 onion, diced",
      "3 cloves garlic, minced",
      "8 oz egg noodles",
      "2 bay leaves",
      "1 tsp thyme",
      "Salt and pepper to taste",
      "2 tbsp olive oil",
      "Fresh parsley for garnish"
    ],
    instructions: `1. Heat olive oil in a large pot over medium heat.

2. Add diced chicken and cook until browned, about 5-6 minutes. Remove and set aside.

3. In the same pot, sauté onion, carrots, and celery for 5 minutes until softened.

4. Add garlic and cook for 1 minute until fragrant.

5. Pour in chicken broth, add bay leaves and thyme. Bring to a boil.

6. Return chicken to the pot, reduce heat, and simmer for 15 minutes.

7. Add egg noodles and cook according to package directions (usually 8-10 minutes).

8. Remove bay leaves, season with salt and pepper to taste.

9. Ladle into bowls and garnish with fresh parsley.

10. Serve hot with crusty bread.`,
    prep_time: "15 minutes",
    cook_time: "35 minutes",
    servings: 6,
    difficulty: 'Easy',
    cuisine_type: 'American',
    categories: ['Soup', 'Comfort Food', 'Main Course'],
    diet_tags: [],
    cooking_method: 'Simmering',
    season_occasion: ['Fall', 'Winter'],
    source_type: 'curated'
  },
  {
    title: "Mediterranean Quinoa Salad",
    description: "Fresh and healthy quinoa salad with cucumber, tomatoes, feta, and a zesty lemon dressing. Perfect for meal prep!",
    image_url: "https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=800",
    ingredients: [
      "1 cup quinoa, rinsed",
      "2 cups water",
      "1 cucumber, diced",
      "2 tomatoes, diced",
      "1/2 red onion, finely diced",
      "1/2 cup kalamata olives, sliced",
      "1/2 cup feta cheese, crumbled",
      "1/4 cup fresh parsley, chopped",
      "3 tbsp olive oil",
      "2 tbsp lemon juice",
      "1 clove garlic, minced",
      "1 tsp oregano",
      "Salt and pepper to taste"
    ],
    instructions: `1. In a medium saucepan, bring water to a boil. Add quinoa, reduce heat to low, cover, and simmer for 15 minutes.

2. Remove from heat and let stand covered for 5 minutes, then fluff with a fork. Let cool completely.

3. While quinoa cools, prepare the dressing: whisk together olive oil, lemon juice, garlic, oregano, salt, and pepper.

4. In a large bowl, combine cooled quinoa, cucumber, tomatoes, red onion, olives, and parsley.

5. Pour dressing over the salad and toss to combine.

6. Gently fold in crumbled feta cheese.

7. Refrigerate for at least 30 minutes to let flavors meld.

8. Serve chilled or at room temperature.

9. Can be stored in refrigerator for up to 4 days.`,
    prep_time: "15 minutes",
    cook_time: "20 minutes",
    servings: 6,
    difficulty: 'Easy',
    cuisine_type: 'Mediterranean',
    categories: ['Salad', 'Side Dish', 'Lunch'],
    diet_tags: ['Vegetarian', 'Gluten-Free'],
    cooking_method: 'No-cook',
    season_occasion: ['Summer', 'Spring'],
    source_type: 'curated'
  },
  {
    title: "Chocolate Chip Cookies",
    description: "Chewy, gooey chocolate chip cookies with crispy edges. The perfect classic cookie recipe that everyone loves.",
    image_url: "https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800",
    ingredients: [
      "2 1/4 cups all-purpose flour",
      "1 tsp baking soda",
      "1 tsp salt",
      "1 cup (2 sticks) butter, softened",
      "3/4 cup granulated sugar",
      "3/4 cup packed brown sugar",
      "2 large eggs",
      "2 tsp vanilla extract",
      "2 cups chocolate chips"
    ],
    instructions: `1. Preheat oven to 375°F (190°C).

2. In a medium bowl, whisk together flour, baking soda, and salt. Set aside.

3. In a large bowl, cream together softened butter, granulated sugar, and brown sugar until light and fluffy (about 3 minutes).

4. Beat in eggs one at a time, then add vanilla extract.

5. Gradually mix in the flour mixture until just combined.

6. Fold in chocolate chips.

7. Drop rounded tablespoons of dough onto ungreased baking sheets, spacing them 2 inches apart.

8. Bake for 9-11 minutes, until golden brown around the edges but still soft in the center.

9. Let cool on baking sheet for 2 minutes before transferring to a wire rack.

10. Cookies will firm up as they cool. Store in an airtight container for up to 1 week.`,
    prep_time: "15 minutes",
    cook_time: "11 minutes",
    servings: 48,
    difficulty: 'Easy',
    cuisine_type: 'American',
    categories: ['Dessert', 'Cookies', 'Baking'],
    diet_tags: ['Vegetarian'],
    cooking_method: 'Baking',
    source_type: 'curated'
  },
  {
    title: "Spaghetti Carbonara",
    description: "Authentic Roman pasta with crispy pancetta, eggs, and Parmesan cheese. Creamy without cream!",
    image_url: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=800",
    ingredients: [
      "1 lb spaghetti",
      "6 oz pancetta or guanciale, diced",
      "4 large egg yolks",
      "1 whole egg",
      "1 cup Parmesan cheese, grated",
      "Black pepper, freshly ground",
      "Salt for pasta water",
      "2 cloves garlic (optional)"
    ],
    instructions: `1. Bring a large pot of salted water to boil and cook spaghetti according to package directions until al dente. Reserve 1 cup of pasta water before draining.

2. While pasta cooks, heat a large skillet over medium heat. Add pancetta and cook until crispy, about 8-10 minutes. Remove from heat.

3. In a bowl, whisk together egg yolks, whole egg, Parmesan cheese, and a generous amount of black pepper.

4. When pasta is ready, drain it (remember to save that pasta water!) and add to the skillet with pancetta.

5. Remove skillet from heat and let cool for 1 minute.

6. Pour the egg mixture over the hot pasta and toss quickly, adding pasta water a little at a time until you achieve a creamy consistency.

7. The heat from the pasta will cook the eggs gently - you want it creamy, not scrambled!

8. Serve immediately with extra Parmesan and black pepper.

9. Do not reheat - carbonara is best eaten immediately.`,
    prep_time: "10 minutes",
    cook_time: "15 minutes",
    servings: 4,
    difficulty: 'Medium',
    cuisine_type: 'Italian',
    categories: ['Main Course', 'Pasta'],
    diet_tags: [],
    cooking_method: 'Boiling',
    source_type: 'curated'
  },
  {
    title: "Vegetable Stir-Fry",
    description: "Quick and colorful Asian-inspired stir-fry with crisp vegetables and a savory sauce. Customize with your favorite veggies!",
    image_url: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800",
    ingredients: [
      "2 tbsp vegetable oil",
      "1 bell pepper, sliced",
      "1 broccoli crown, cut into florets",
      "1 cup snap peas",
      "1 carrot, julienned",
      "2 cloves garlic, minced",
      "1 tbsp fresh ginger, grated",
      "3 tbsp soy sauce",
      "1 tbsp sesame oil",
      "1 tbsp rice vinegar",
      "1 tsp honey",
      "1 tsp cornstarch",
      "Sesame seeds for garnish",
      "Green onions, sliced"
    ],
    instructions: `1. In a small bowl, whisk together soy sauce, sesame oil, rice vinegar, honey, and cornstarch. Set aside.

2. Heat vegetable oil in a large wok or skillet over high heat.

3. Add carrots and broccoli first (they take longer to cook) and stir-fry for 2-3 minutes.

4. Add bell pepper and snap peas, stir-fry for another 2-3 minutes until vegetables are tender-crisp.

5. Push vegetables to the side of the wok, add garlic and ginger to the center, and cook for 30 seconds until fragrant.

6. Pour the sauce over the vegetables and toss everything together for 1-2 minutes until sauce thickens and coats the vegetables.

7. Remove from heat immediately to prevent overcooking.

8. Garnish with sesame seeds and sliced green onions.

9. Serve hot over rice or noodles.`,
    prep_time: "15 minutes",
    cook_time: "10 minutes",
    servings: 4,
    difficulty: 'Easy',
    cuisine_type: 'Asian',
    categories: ['Main Course', 'Quick & Easy', 'Stir-Fry'],
    diet_tags: ['Vegan', 'Dairy-Free'],
    cooking_method: 'Stir-frying',
    source_type: 'curated'
  },
  {
    title: "Banana Bread",
    description: "Moist and flavorful banana bread made with overripe bananas. Perfect for breakfast or as a snack with coffee.",
    image_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=800",
    ingredients: [
      "3 ripe bananas, mashed",
      "1/3 cup melted butter",
      "3/4 cup sugar",
      "1 egg, beaten",
      "1 tsp vanilla extract",
      "1 tsp baking soda",
      "Pinch of salt",
      "1 1/2 cups all-purpose flour",
      "1/2 cup chopped walnuts (optional)"
    ],
    instructions: `1. Preheat oven to 350°F (175°C). Grease a 9x5 inch loaf pan.

2. In a large mixing bowl, mash the ripe bananas with a fork until smooth.

3. Mix in the melted butter.

4. Add sugar, beaten egg, and vanilla extract. Mix well.

5. Sprinkle baking soda and salt over the mixture and mix in.

6. Add flour and mix until just combined (don't overmix!).

7. If using, fold in chopped walnuts.

8. Pour batter into prepared loaf pan.

9. Bake for 60-65 minutes, or until a toothpick inserted into the center comes out clean.

10. Remove from oven and let cool in the pan for 10 minutes.

11. Turn out onto a wire rack to cool completely.

12. Slice and serve. Can be stored wrapped in foil for up to 4 days.`,
    prep_time: "10 minutes",
    cook_time: "65 minutes",
    servings: 8,
    difficulty: 'Easy',
    cuisine_type: 'American',
    categories: ['Dessert', 'Bread', 'Breakfast', 'Baking'],
    diet_tags: ['Vegetarian'],
    cooking_method: 'Baking',
    source_type: 'curated'
  },
  {
    title: "Greek Salad",
    description: "Fresh and vibrant Greek salad with crisp vegetables, feta cheese, olives, and a simple olive oil dressing.",
    image_url: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=800",
    ingredients: [
      "4 tomatoes, cut into wedges",
      "1 cucumber, sliced",
      "1 red onion, thinly sliced",
      "1 green bell pepper, chopped",
      "1 cup Kalamata olives",
      "6 oz feta cheese, cubed",
      "1/4 cup extra virgin olive oil",
      "2 tbsp red wine vinegar",
      "1 tsp dried oregano",
      "Salt and pepper to taste"
    ],
    instructions: `1. In a large salad bowl, combine tomatoes, cucumber, red onion, and bell pepper.

2. Add Kalamata olives to the bowl.

3. In a small bowl, whisk together olive oil, red wine vinegar, oregano, salt, and pepper.

4. Pour dressing over the vegetables and toss gently to combine.

5. Top with feta cheese cubes.

6. Let sit for 5-10 minutes to allow flavors to meld.

7. Toss again gently before serving.

8. Serve immediately as a side dish or light lunch.

9. Best eaten fresh, but can be refrigerated for up to 24 hours.`,
    prep_time: "15 minutes",
    cook_time: "0 minutes",
    servings: 6,
    difficulty: 'Easy',
    cuisine_type: 'Greek',
    categories: ['Salad', 'Side Dish'],
    diet_tags: ['Vegetarian', 'Gluten-Free'],
    cooking_method: 'No-cook',
    season_occasion: ['Summer'],
    source_type: 'curated'
  },
  {
    title: "Beef Tacos",
    description: "Flavorful Mexican-style tacos with seasoned ground beef, fresh toppings, and warm tortillas. A family favorite!",
    image_url: "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=800",
    ingredients: [
      "1 lb ground beef",
      "1 onion, diced",
      "2 cloves garlic, minced",
      "2 tbsp taco seasoning",
      "1/2 cup water",
      "8 taco shells or tortillas",
      "1 cup shredded lettuce",
      "1 tomato, diced",
      "1 cup shredded cheese",
      "1/2 cup sour cream",
      "Salsa for serving",
      "Fresh cilantro (optional)"
    ],
    instructions: `1. Heat a large skillet over medium-high heat.

2. Add ground beef and cook, breaking it up with a spoon, until browned (about 5-7 minutes).

3. Drain excess fat, leaving about 1 tablespoon in the pan.

4. Add diced onion and cook for 3-4 minutes until softened.

5. Add garlic and cook for 1 minute until fragrant.

6. Stir in taco seasoning and water. Simmer for 5 minutes until sauce thickens.

7. While meat cooks, warm taco shells according to package directions.

8. Prepare toppings: shred lettuce, dice tomato, shred cheese.

9. Fill each taco shell with seasoned beef.

10. Top with lettuce, tomato, cheese, sour cream, and salsa.

11. Garnish with fresh cilantro if desired.

12. Serve immediately while warm.`,
    prep_time: "10 minutes",
    cook_time: "15 minutes",
    servings: 4,
    difficulty: 'Easy',
    cuisine_type: 'Mexican',
    categories: ['Main Course', 'Quick & Easy'],
    diet_tags: ['Gluten-Free'],
    cooking_method: 'Pan-frying',
    source_type: 'curated'
  }
];

/**
 * Main seeding function
 */
async function seedDatabase() {
  // Get environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or VITE_SUPABASE_ANON_KEY)');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🌱 Starting recipe database seeding...');
  console.log(`📋 ${SEED_RECIPES.length} recipes to seed\n`);

  let successCount = 0;
  let failCount = 0;
  const errors: string[] = [];

  for (let i = 0; i < SEED_RECIPES.length; i++) {
    const recipe = SEED_RECIPES[i];

    try {
      console.log(`[${i + 1}/${SEED_RECIPES.length}] Seeding: ${recipe.title}`);

      const { data, error } = await supabase
        .from('recipes')
        .insert({
          // Basic info
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,

          // Recipe content
          ingredients: recipe.ingredients,
          instructions: recipe.instructions,

          // Timing and servings
          prep_time: recipe.prep_time,
          cook_time: recipe.cook_time,
          servings: recipe.servings,

          // Classification
          difficulty: recipe.difficulty,
          cuisine_type: recipe.cuisine_type,
          categories: recipe.categories,
          diet_tags: recipe.diet_tags,
          cooking_method: recipe.cooking_method,
          season_occasion: recipe.season_occasion,

          // Source tracking
          source_type: recipe.source_type,
          source_url: recipe.source_url,
          recipe_type: 'manual', // Mark as manually created

          // Public and available to all
          user_id: null, // System recipe, no specific owner
          is_public: true,
          is_favorite: false,

          // Timestamps
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      successCount++;
      console.log(`   ✅ Success`);

    } catch (error: any) {
      failCount++;
      const errorMsg = `Failed to seed "${recipe.title}": ${error.message}`;
      console.error(`   ❌ ${errorMsg}`);
      errors.push(errorMsg);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Seeding Complete!');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}/${SEED_RECIPES.length}`);
  console.log(`❌ Failed:  ${failCount}/${SEED_RECIPES.length}`);
  console.log(`📈 Success Rate: ${((successCount / SEED_RECIPES.length) * 100).toFixed(1)}%`);

  if (errors.length > 0) {
    console.log('\n⚠️  Errors encountered:');
    errors.forEach(err => console.log(`   - ${err}`));
  }

  console.log('\n🎉 Database seeding complete!');
}

// Run the seeding
seedDatabase().catch(error => {
  console.error('❌ Fatal error during seeding:', error);
  process.exit(1);
});
