import { z } from 'zod';

/**
 * Allowed image file extensions
 * These are the only image formats accepted for upload
 */
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp'] as const;

/**
 * Maximum file size for image uploads (5MB)
 */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed recipe domains for URL imports
 * Whitelist of trusted recipe websites
 */
const ALLOWED_RECIPE_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'allrecipes.com',
  'foodnetwork.com',
  'bonappetit.com',
  'seriouseats.com',
  'epicurious.com',
  'cooking.nytimes.com',
  'simplyrecipes.com',
  'tasteofhome.com',
  'delish.com',
  'food.com',
  'myrecipes.com',
  'thekitchn.com',
  'budgetbytes.com',
  'kingarthurbaking.com',
  'jamieoliver.com',
  'bbcgoodfood.com',
  'recipetineats.com',
] as const;

/**
 * Cook/Prep time validation regex
 * Matches formats like: "30 minutes", "1 hour", "1h 30m", "45min", "2 hours 15 minutes"
 */
const TIME_FORMAT_REGEX = /^(\d+\s*(hours?|hrs?|h|minutes?|mins?|m)(\s+\d+\s*(minutes?|mins?|m))?|\d+:\d+)$/i;

/**
 * Grocery item validation schema
 * Ensures grocery items are safe and within reasonable limits
 *
 * Validation rules:
 * - item_name: Required, 1-200 characters, trimmed, no empty strings
 * - quantity: Optional, max 50 characters
 * - unit: Optional, max 50 characters
 * - category: Optional, max 100 characters
 */
export const groceryItemSchema = z.object({
  item_name: z.string()
    .min(1, "Item name is required")
    .max(200, "Item name must be less than 200 characters")
    .trim()
    .refine(val => val.length > 0, "Item name cannot be empty"),
  quantity: z.string()
    .max(50, "Quantity must be less than 50 characters")
    .optional()
    .nullable(),
  unit: z.string()
    .max(50, "Unit must be less than 50 characters")
    .optional()
    .nullable(),
  category: z.string()
    .max(100, "Category must be less than 100 characters")
    .optional()
    .nullable(),
});

/**
 * Collection validation schema
 * Validates collection name, description, and cover image URL
 *
 * Validation rules:
 * - name: Required, 1-100 characters, trimmed
 * - description: Optional, max 500 characters
 * - cover_image_url: Optional URL with image extension, prevents XSS attacks, allows empty/null
 */
export const collectionSchema = z.object({
  name: z.string()
    .min(1, "Collection name is required")
    .max(100, "Collection name must be less than 100 characters")
    .trim()
    .refine(val => val.length > 0, "Collection name cannot be empty"),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  cover_image_url: z.union([
    z.string()
      .url("Must be a valid URL")
      .refine(
        url => {
          try {
            const parsedUrl = new URL(url);
            // Prevent javascript: and data: URLs (XSS protection)
            if (parsedUrl.protocol === 'javascript:' || parsedUrl.protocol === 'data:') {
              return false;
            }
            // Check if URL ends with image extension
            const pathname = parsedUrl.pathname.toLowerCase();
            return ALLOWED_IMAGE_EXTENSIONS.some(ext =>
              pathname.endsWith(`.${ext}`) || pathname.includes(`.${ext}?`)
            );
          } catch {
            return false;
          }
        },
        "Must be a valid image URL with extension: jpg, jpeg, png, gif, or webp"
      )
      .optional()
      .nullable(),
    z.literal(''),
    z.literal(null),
  ]),
});

/**
 * Recipe URL validation schema
 * Validates URLs are from supported recipe sites
 *
 * Validation rules:
 * - Must be a valid URL format
 * - Must be from a whitelisted recipe domain (with or without www.)
 * - Protects against malicious URLs
 */
export const recipeUrlSchema = z.string()
  .url("Must be a valid URL")
  .refine(
    url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        // Check if hostname matches any allowed domain
        return ALLOWED_RECIPE_DOMAINS.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
      } catch {
        return false;
      }
    },
    `Must be from a supported recipe site (e.g., ${ALLOWED_RECIPE_DOMAINS.slice(0, 3).join(', ')})`
  );

/**
 * Relaxed recipe URL validation (for backward compatibility)
 * Accepts any valid URL without domain restrictions
 */
export const recipeUrlSchemaRelaxed = z.string()
  .url("Must be a valid URL")
  .refine(
    url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        return hostname.length > 0;
      } catch {
        return false;
      }
    },
    "Must be a valid URL"
  );

/**
 * Image file validation schema
 * Ensures uploaded files are valid images within size limits
 *
 * Validation rules:
 * - Must be a File instance
 * - Size limit: 5MB
 * - Allowed types: JPEG, PNG, WebP, GIF
 * - File name must have valid image extension
 */
export const imageFileSchema = z.instanceof(File)
  .refine(file => file.size > 0, "File cannot be empty")
  .refine(file => file.size <= MAX_IMAGE_SIZE, `File must be less than ${MAX_IMAGE_SIZE / (1024 * 1024)}MB`)
  .refine(
    file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    "File must be an image (JPEG, PNG, WebP, or GIF)"
  )
  .refine(
    file => {
      const fileName = file.name.toLowerCase();
      return ALLOWED_IMAGE_EXTENSIONS.some(ext => fileName.endsWith(`.${ext}`));
    },
    `File must have a valid image extension: ${ALLOWED_IMAGE_EXTENSIONS.join(', ')}`
  );

/**
 * Recipe rating validation schema
 * Validates 1-5 star ratings (integers only)
 *
 * Validation rules:
 * - Must be an integer (no half stars)
 * - Range: 1-5 stars
 */
export const ratingSchema = z.number()
  .int("Rating must be a whole number")
  .min(1, "Rating must be at least 1 star")
  .max(5, "Rating cannot exceed 5 stars");

/**
 * Time format validation schema
 * Validates cook/prep time formats
 *
 * Accepted formats:
 * - "30 minutes", "1 hour", "2 hours 15 minutes"
 * - "30min", "1hr", "2h 15m"
 * - "1:30" (hour:minute format)
 */
export const timeFormatSchema = z.string()
  .trim()
  .regex(TIME_FORMAT_REGEX, "Invalid time format. Use: '30 minutes', '1 hour', '1h 30m', or '1:30'");

/**
 * Serving size validation schema
 * Validates number of servings
 *
 * Validation rules:
 * - Must be a positive integer
 * - Range: 1-100 servings
 */
export const servingSizeSchema = z.number()
  .int("Servings must be a whole number")
  .positive("Servings must be positive")
  .min(1, "Must serve at least 1 person")
  .max(100, "Servings cannot exceed 100");

/**
 * Recipe form validation schema
 * Validates all recipe form fields
 *
 * Validation rules:
 * - title: Required, 1-200 characters
 * - description: Optional, max 1000 characters
 * - cookTime: Required, valid time format
 * - prep_time: Optional, valid time format
 * - servings: Required, 1-100 servings
 * - ingredients: Required, 1-100 items, each 1-500 characters
 * - instructions: Required, 10-10000 characters
 * - rating: Optional, 1-5 stars (integers)
 * - difficulty, cuisine_type, cooking_method: Optional strings
 * - categories, diet_tags, season_occasion: Optional string arrays
 */
export const recipeFormSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters")
    .trim(),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  cookTime: timeFormatSchema,
  prep_time: timeFormatSchema.optional(),
  servings: servingSizeSchema,
  ingredients: z.array(
    z.string()
      .min(1, "Ingredient cannot be empty")
      .max(500, "Ingredient must be less than 500 characters")
      .trim()
  )
    .min(1, "At least one ingredient is required")
    .max(100, "Too many ingredients (max 100)"),
  instructions: z.string()
    .min(10, "Instructions must be at least 10 characters")
    .max(10000, "Instructions are too long (max 10,000 characters)")
    .trim(),
  rating: ratingSchema.optional(),
  difficulty: z.string()
    .max(50, "Difficulty must be less than 50 characters")
    .optional(),
  cuisine_type: z.string()
    .max(100, "Cuisine type must be less than 100 characters")
    .optional(),
  cooking_method: z.string()
    .max(100, "Cooking method must be less than 100 characters")
    .optional(),
  categories: z.array(z.string().max(100))
    .max(20, "Too many categories (max 20)")
    .optional(),
  diet_tags: z.array(z.string().max(100))
    .max(20, "Too many diet tags (max 20)")
    .optional(),
  season_occasion: z.array(z.string().max(100))
    .max(20, "Too many season/occasion tags (max 20)")
    .optional(),
});

/**
 * Simple string validation for text inputs
 */
export const textInputSchema = z.string()
  .max(1000, "Text is too long")
  .trim();
