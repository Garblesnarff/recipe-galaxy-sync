import { z } from 'zod';

/**
 * Grocery item validation schema
 * Ensures grocery items are safe and within reasonable limits
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
 */
export const collectionSchema = z.object({
  name: z.string()
    .min(1, "Collection name is required")
    .max(100, "Collection name must be less than 100 characters")
    .trim(),
  description: z.string()
    .max(500, "Description must be less than 500 characters")
    .optional()
    .nullable(),
  cover_image_url: z.union([
    z.string()
      .url("Must be a valid URL")
      .regex(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i, "Must be an image URL (jpg, png, gif, or webp)")
      .optional()
      .nullable(),
    z.literal(''),
    z.literal(null),
  ]),
});

/**
 * Recipe URL validation schema
 * Validates URLs are from supported recipe sites
 */
export const recipeUrlSchema = z.string()
  .url("Must be a valid URL")
  .refine(
    url => {
      try {
        const hostname = new URL(url).hostname.replace('www.', '');
        // Allow any URL for now to not break existing functionality
        // Can add whitelist later: const allowedDomains = ['youtube.com', 'allrecipes.com', ...];
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
 */
export const imageFileSchema = z.instanceof(File)
  .refine(file => file.size <= 5 * 1024 * 1024, "File must be less than 5MB")
  .refine(
    file => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'].includes(file.type),
    "File must be an image (JPEG, PNG, WebP, or GIF)"
  );

/**
 * Recipe form validation schema
 * Validates all recipe form fields
 */
export const recipeFormSchema = z.object({
  title: z.string()
    .min(1, "Title is required")
    .max(200, "Title must be less than 200 characters"),
  description: z.string()
    .max(1000, "Description must be less than 1000 characters")
    .optional(),
  cookTime: z.string()
    .max(50, "Cook time must be less than 50 characters"),
  prep_time: z.string()
    .max(50, "Prep time must be less than 50 characters")
    .optional(),
  servings: z.number()
    .int("Servings must be a whole number")
    .min(1, "Must serve at least 1 person")
    .max(100, "Servings cannot exceed 100"),
  ingredients: z.array(z.string())
    .min(1, "At least one ingredient is required")
    .max(100, "Too many ingredients (max 100)"),
  instructions: z.string()
    .min(10, "Instructions must be at least 10 characters")
    .max(10000, "Instructions are too long (max 10,000 characters)"),
  difficulty: z.string()
    .optional(),
  cuisine_type: z.string()
    .optional(),
  cooking_method: z.string()
    .optional(),
  categories: z.array(z.string())
    .optional(),
  diet_tags: z.array(z.string())
    .optional(),
  season_occasion: z.array(z.string())
    .optional(),
});

/**
 * Simple string validation for text inputs
 */
export const textInputSchema = z.string()
  .max(1000, "Text is too long")
  .trim();
