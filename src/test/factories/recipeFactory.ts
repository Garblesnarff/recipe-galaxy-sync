/**
 * Test Data Factories
 *
 * Generate realistic test data for unit and integration tests.
 * Helps maintain consistency across test suites.
 */

import { Recipe } from '@/types/recipe';
import { RecipeIngredient } from '@/types/recipeIngredient';

let recipeIdCounter = 1;
let ingredientIdCounter = 1;

/**
 * Create a test recipe with sensible defaults
 */
export const createTestRecipe = (overrides?: Partial<Recipe>): Recipe => {
  const id = `test-recipe-${recipeIdCounter++}`;

  return {
    id,
    title: `Test Recipe ${recipeIdCounter}`,
    description: 'A delicious test recipe for automated testing',
    image_url: 'https://picsum.photos/400/300',
    ingredients: [
      'Test Ingredient 1',
      'Test Ingredient 2',
      'Test Ingredient 3',
    ],
    instructions: 'Step 1: Test\nStep 2: Test more\nStep 3: Finish testing',
    prep_time: '15 minutes',
    cook_time: '30 minutes',
    servings: 4,
    difficulty: 'Easy',
    source_url: 'https://example.com/recipe',
    source_type: 'manual',
    categories: ['Dinner', 'Main Course'],
    cuisine_type: 'American',
    diet_tags: [],
    cooking_method: 'Baking',
    season_occasion: [],
    rating: 4.5,
    ratings: [],
    is_favorite: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Create multiple test recipes
 */
export const createTestRecipes = (count: number, overrides?: Partial<Recipe>): Recipe[] => {
  return Array.from({ length: count }, (_, i) =>
    createTestRecipe({
      ...overrides,
      title: `Test Recipe ${i + 1}`,
    })
  );
};

/**
 * Create a test recipe ingredient
 */
export const createTestIngredient = (overrides?: Partial<RecipeIngredient>): RecipeIngredient => {
  return {
    id: `test-ingredient-${ingredientIdCounter++}`,
    name: `Test Ingredient ${ingredientIdCounter}`,
    quantity: '1',
    unit: 'cup',
    notes: undefined,
    ...overrides,
  };
};

/**
 * Create a recipe with structured ingredients
 */
export const createRecipeWithStructuredIngredients = (
  ingredientCount: number = 5,
  overrides?: Partial<Recipe>
): Recipe => {
  const ingredients = Array.from({ length: ingredientCount }, (_, i) =>
    createTestIngredient({
      name: `Ingredient ${i + 1}`,
      quantity: String((i % 3) + 1),
      unit: ['cup', 'tbsp', 'tsp', 'oz', 'lb'][i % 5],
    })
  );

  return createTestRecipe({
    ...overrides,
    ingredients,
  });
};

/**
 * Reset counters (useful for test isolation)
 */
export const resetTestCounters = () => {
  recipeIdCounter = 1;
  ingredientIdCounter = 1;
};

/**
 * Create recipes with specific characteristics for edge case testing
 */
export const createEdgeCaseRecipes = () => ({
  // Recipe with no ingredients
  noIngredients: createTestRecipe({
    title: 'Recipe with No Ingredients',
    ingredients: [],
  }),

  // Recipe with very long title
  longTitle: createTestRecipe({
    title: 'A'.repeat(200),
  }),

  // Recipe with special characters
  specialChars: createTestRecipe({
    title: 'Recipe with "Quotes" & Special \'Characters\' <test>',
    ingredients: ['½ cup milk', '¼ tsp salt', '1½ cups flour'],
  }),

  // Recipe with unicode
  unicode: createTestRecipe({
    title: 'Recipe with Unicode 🍕🍔🍟',
    ingredients: ['Emoji ingredient 🥛', 'Regular ingredient'],
  }),

  // Recipe with minimal data
  minimal: createTestRecipe({
    description: '',
    prep_time: undefined,
    categories: [],
    diet_tags: [],
  }),

  // Recipe with maximum data
  maximal: createTestRecipe({
    categories: ['Breakfast', 'Lunch', 'Dinner', 'Snack'],
    diet_tags: ['Vegetarian', 'Gluten-Free', 'Dairy-Free'],
    season_occasion: ['Summer', 'BBQ', 'Holiday'],
    rating: 5,
  }),

  // Recipe with exactly 20 ingredients (pagination boundary)
  twentyIngredients: createRecipeWithStructuredIngredients(20),

  // Recipe with 100 ingredients (stress test)
  manyIngredients: createRecipeWithStructuredIngredients(100),
});

/**
 * Invalid data generators for validation testing
 */
export const createInvalidRecipeData = () => ({
  // Title violations
  emptyTitle: {
    title: '',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  titleTooLong: {
    title: 'A'.repeat(201),
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  titleOnlyWhitespace: {
    title: '   ',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  // Cook time violations
  invalidCookTime: {
    title: 'Recipe',
    cookTime: 'invalid time',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  emptyCookTime: {
    title: 'Recipe',
    cookTime: '',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  // Servings violations
  zeroServings: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 0,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  negativeServings: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: -1,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  tooManyServings: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 101,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  decimalServings: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4.5,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  // Ingredients violations
  noIngredients: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: [],
    instructions: 'Cook the ingredient.',
  },

  tooManyIngredients: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: Array.from({ length: 101 }, (_, i) => `Ingredient ${i + 1}`),
    instructions: 'Cook the ingredient.',
  },

  emptyIngredient: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient', ''],
    instructions: 'Cook the ingredient.',
  },

  ingredientTooLong: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['A'.repeat(501)],
    instructions: 'Cook the ingredient.',
  },

  // Instructions violations
  instructionsTooShort: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook',
  },

  instructionsTooLong: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'A'.repeat(10001),
  },

  emptyInstructions: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: '',
  },

  // Rating violations
  ratingTooLow: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
    rating: 0,
  },

  ratingTooHigh: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
    rating: 6,
  },

  ratingDecimal: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
    rating: 3.5,
  },

  // Description violations
  descriptionTooLong: {
    title: 'Recipe',
    description: 'A'.repeat(1001),
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  // Categories violations
  tooManyCategories: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
    categories: Array.from({ length: 21 }, (_, i) => `Category ${i + 1}`),
  },
});

/**
 * Boundary case generators for validation testing
 */
export const createBoundaryRecipeData = () => ({
  // Minimum valid values
  minimalValidRecipe: {
    title: 'A', // 1 character (minimum)
    cookTime: '1m', // Shortest valid time
    servings: 1, // Minimum servings
    ingredients: ['A'], // 1 ingredient with 1 character
    instructions: 'A'.repeat(10), // Exactly 10 characters (minimum)
  },

  // Maximum valid values
  maximalValidRecipe: {
    title: 'A'.repeat(200), // 200 characters (maximum)
    description: 'A'.repeat(1000), // 1000 characters (maximum)
    cookTime: '999 hours 59 minutes', // Very long time
    servings: 100, // Maximum servings
    ingredients: Array.from({ length: 100 }, (_, i) => 'A'.repeat(500)), // 100 ingredients, each 500 chars (max)
    instructions: 'A'.repeat(10000), // 10000 characters (maximum)
    rating: 5, // Maximum rating
    difficulty: 'A'.repeat(50), // 50 characters (maximum)
    cuisine_type: 'A'.repeat(100), // 100 characters (maximum)
    cooking_method: 'A'.repeat(100), // 100 characters (maximum)
    categories: Array.from({ length: 20 }, (_, i) => `Category ${i + 1}`), // 20 categories (max)
    diet_tags: Array.from({ length: 20 }, (_, i) => `Tag ${i + 1}`), // 20 tags (max)
    season_occasion: Array.from({ length: 20 }, (_, i) => `Occasion ${i + 1}`), // 20 occasions (max)
  },

  // Boundary + 1 (should fail)
  titleBoundaryExceeded: {
    title: 'A'.repeat(201), // 201 characters
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  servingsBoundaryExceeded: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 101, // 101 servings
    ingredients: ['ingredient'],
    instructions: 'Cook the ingredient.',
  },

  ingredientsBoundaryExceeded: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: Array.from({ length: 101 }, (_, i) => `Ingredient ${i + 1}`), // 101 ingredients
    instructions: 'Cook the ingredient.',
  },

  instructionsBoundaryExceeded: {
    title: 'Recipe',
    cookTime: '30 minutes',
    servings: 4,
    ingredients: ['ingredient'],
    instructions: 'A'.repeat(10001), // 10001 characters
  },
});

/**
 * Create invalid grocery item data for validation testing
 */
export const createInvalidGroceryData = () => ({
  emptyItemName: {
    item_name: '',
    quantity: '1',
    unit: 'gallon',
    category: 'Dairy',
  },

  itemNameTooLong: {
    item_name: 'A'.repeat(201),
    quantity: '1',
    unit: 'gallon',
    category: 'Dairy',
  },

  quantityTooLong: {
    item_name: 'Milk',
    quantity: 'A'.repeat(51),
    unit: 'gallon',
    category: 'Dairy',
  },

  unitTooLong: {
    item_name: 'Milk',
    quantity: '1',
    unit: 'A'.repeat(51),
    category: 'Dairy',
  },

  categoryTooLong: {
    item_name: 'Milk',
    quantity: '1',
    unit: 'gallon',
    category: 'A'.repeat(101),
  },
});

/**
 * Create invalid collection data for validation testing
 */
export const createInvalidCollectionData = () => ({
  emptyName: {
    name: '',
    description: 'Description',
    cover_image_url: 'https://example.com/image.jpg',
  },

  nameTooLong: {
    name: 'A'.repeat(101),
    description: 'Description',
    cover_image_url: 'https://example.com/image.jpg',
  },

  descriptionTooLong: {
    name: 'Collection',
    description: 'A'.repeat(501),
    cover_image_url: 'https://example.com/image.jpg',
  },

  invalidUrl: {
    name: 'Collection',
    description: 'Description',
    cover_image_url: 'not-a-url',
  },

  nonImageUrl: {
    name: 'Collection',
    description: 'Description',
    cover_image_url: 'https://example.com/document.pdf',
  },

  xssJavascriptUrl: {
    name: 'Collection',
    description: 'Description',
    cover_image_url: "javascript:alert('xss')",
  },

  xssDataUrl: {
    name: 'Collection',
    description: 'Description',
    cover_image_url: 'data:text/html,<script>alert("xss")</script>',
  },
});
