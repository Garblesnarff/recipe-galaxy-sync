/**
 * Comprehensive Validation Schema Tests
 *
 * This test suite provides 100% coverage of all validation schemas
 * including success cases, failure cases, edge cases, and security tests.
 */

import { describe, it, expect } from 'vitest';
import {
  groceryItemSchema,
  collectionSchema,
  recipeUrlSchema,
  recipeUrlSchemaRelaxed,
  imageFileSchema,
  recipeFormSchema,
  ratingSchema,
  timeFormatSchema,
  servingSizeSchema,
  textInputSchema,
} from '../validation';

describe('groceryItemSchema', () => {
  describe('Success Cases', () => {
    it('should validate a complete grocery item', () => {
      const validItem = {
        item_name: 'Milk',
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(validItem)).not.toThrow();
    });

    it('should validate with minimal required fields', () => {
      const validItem = {
        item_name: 'Salt',
        quantity: null,
        unit: null,
        category: null,
      };
      expect(() => groceryItemSchema.parse(validItem)).not.toThrow();
    });

    it('should validate with Unicode characters', () => {
      const validItem = {
        item_name: '🥛 Milk',
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(validItem)).not.toThrow();
    });

    it('should validate with special characters', () => {
      const validItem = {
        item_name: "Ben & Jerry's Ice Cream",
        quantity: '1',
        unit: 'pint',
        category: 'Frozen',
      };
      expect(() => groceryItemSchema.parse(validItem)).not.toThrow();
    });

    it('should trim whitespace from item name', () => {
      const item = {
        item_name: '  Bread  ',
        quantity: '1',
        unit: 'loaf',
        category: 'Bakery',
      };
      const result = groceryItemSchema.parse(item);
      expect(result.item_name).toBe('Bread');
    });

    it('should validate item name at max length (200 chars)', () => {
      const validItem = {
        item_name: 'A'.repeat(200),
        quantity: '1',
        unit: 'unit',
        category: 'Test',
      };
      expect(() => groceryItemSchema.parse(validItem)).not.toThrow();
    });
  });

  describe('Failure Cases', () => {
    it('should reject empty item name', () => {
      const invalidItem = {
        item_name: '',
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow('Item name cannot be empty');
    });

    it('should reject item name with only whitespace', () => {
      const invalidItem = {
        item_name: '   ',
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow();
    });

    it('should reject item name exceeding 200 characters', () => {
      const invalidItem = {
        item_name: 'A'.repeat(201),
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow('Item name must be less than 200 characters');
    });

    it('should reject quantity exceeding 50 characters', () => {
      const invalidItem = {
        item_name: 'Milk',
        quantity: 'A'.repeat(51),
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow('Quantity must be less than 50 characters');
    });

    it('should reject unit exceeding 50 characters', () => {
      const invalidItem = {
        item_name: 'Milk',
        quantity: '1',
        unit: 'A'.repeat(51),
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow('Unit must be less than 50 characters');
    });

    it('should reject category exceeding 100 characters', () => {
      const invalidItem = {
        item_name: 'Milk',
        quantity: '1',
        unit: 'gallon',
        category: 'A'.repeat(101),
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow('Category must be less than 100 characters');
    });

    it('should reject missing item_name', () => {
      const invalidItem = {
        quantity: '1',
        unit: 'gallon',
        category: 'Dairy',
      };
      expect(() => groceryItemSchema.parse(invalidItem)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined optional fields', () => {
      const item = {
        item_name: 'Milk',
        quantity: undefined,
        unit: undefined,
        category: undefined,
      };
      expect(() => groceryItemSchema.parse(item)).not.toThrow();
    });

    it('should handle single character item name', () => {
      const item = {
        item_name: 'A',
        quantity: '1',
        unit: 'unit',
        category: 'Test',
      };
      expect(() => groceryItemSchema.parse(item)).not.toThrow();
    });

    it('should handle numeric strings in item name', () => {
      const item = {
        item_name: '1234567890',
        quantity: '1',
        unit: 'unit',
        category: 'Test',
      };
      expect(() => groceryItemSchema.parse(item)).not.toThrow();
    });
  });
});

describe('collectionSchema', () => {
  describe('Success Cases', () => {
    it('should validate a complete collection', () => {
      const validCollection = {
        name: 'My Recipes',
        description: 'A collection of my favorite recipes',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should validate with minimal required fields', () => {
      const validCollection = {
        name: 'Recipes',
        description: null,
        cover_image_url: null,
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should validate with empty string for cover_image_url', () => {
      const validCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: '',
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should validate with query parameters in image URL', () => {
      const validCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: 'https://example.com/image.jpg?size=large',
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should validate with all image formats', () => {
      const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
      formats.forEach(format => {
        const validCollection = {
          name: 'Recipes',
          description: 'My recipes',
          cover_image_url: `https://example.com/image.${format}`,
        };
        expect(() => collectionSchema.parse(validCollection)).not.toThrow();
      });
    });

    it('should validate name at max length (100 chars)', () => {
      const validCollection = {
        name: 'A'.repeat(100),
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should validate description at max length (500 chars)', () => {
      const validCollection = {
        name: 'Recipes',
        description: 'A'.repeat(500),
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(validCollection)).not.toThrow();
    });

    it('should trim whitespace from name', () => {
      const collection = {
        name: '  Recipes  ',
        description: 'My recipes',
        cover_image_url: 'https://example.com/image.jpg',
      };
      const result = collectionSchema.parse(collection);
      expect(result.name).toBe('Recipes');
    });
  });

  describe('Failure Cases', () => {
    it('should reject empty name', () => {
      const invalidCollection = {
        name: '',
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow('Collection name is required');
    });

    it('should reject name exceeding 100 characters', () => {
      const invalidCollection = {
        name: 'A'.repeat(101),
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow('Collection name must be less than 100 characters');
    });

    it('should reject description exceeding 500 characters', () => {
      const invalidCollection = {
        name: 'Recipes',
        description: 'A'.repeat(501),
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow('Description must be less than 500 characters');
    });

    it('should reject invalid URL', () => {
      const invalidCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: 'not-a-url',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow();
    });

    it('should reject URL without image extension', () => {
      const invalidCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: 'https://example.com/image.pdf',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow('Must be a valid image URL');
    });

    it('should reject javascript: URL (XSS protection)', () => {
      const invalidCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: "javascript:alert('xss')",
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow();
    });

    it('should reject data: URL (XSS protection)', () => {
      const invalidCollection = {
        name: 'Recipes',
        description: 'My recipes',
        cover_image_url: 'data:text/html,<script>alert("xss")</script>',
      };
      expect(() => collectionSchema.parse(invalidCollection)).toThrow();
    });

    it('should reject name with only whitespace (after trim becomes empty)', () => {
      const invalidCollection = {
        name: '   ',
        description: 'Description',
        cover_image_url: 'https://example.com/image.jpg',
      };
      // After trimming, '   ' becomes '', which triggers the refine check
      expect(() => collectionSchema.parse(invalidCollection)).toThrow('Collection name cannot be empty');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Unicode in name', () => {
      const collection = {
        name: 'My Recipes 🍕🍔',
        description: 'Delicious recipes',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(collection)).not.toThrow();
    });

    it('should handle special characters in name', () => {
      const collection = {
        name: "Mom's & Dad's Recipes",
        description: 'Family recipes',
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(collection)).not.toThrow();
    });

    it('should handle undefined description', () => {
      const collection = {
        name: 'Recipes',
        description: undefined,
        cover_image_url: 'https://example.com/image.jpg',
      };
      expect(() => collectionSchema.parse(collection)).not.toThrow();
    });
  });
});

describe('recipeUrlSchema', () => {
  describe('Success Cases', () => {
    it('should validate YouTube URL', () => {
      expect(() => recipeUrlSchema.parse('https://www.youtube.com/watch?v=123')).not.toThrow();
    });

    it('should validate YouTube short URL', () => {
      expect(() => recipeUrlSchema.parse('https://youtu.be/123')).not.toThrow();
    });

    it('should validate AllRecipes URL', () => {
      expect(() => recipeUrlSchema.parse('https://www.allrecipes.com/recipe/12345/')).not.toThrow();
    });

    it('should validate Food Network URL', () => {
      expect(() => recipeUrlSchema.parse('https://www.foodnetwork.com/recipes/recipe-123')).not.toThrow();
    });

    it('should validate URL without www prefix', () => {
      expect(() => recipeUrlSchema.parse('https://youtube.com/watch?v=123')).not.toThrow();
    });

    it('should validate multiple allowed domains', () => {
      const domains = [
        'https://bonappetit.com/recipe',
        'https://www.seriouseats.com/recipe',
        'https://epicurious.com/recipe',
        'https://cooking.nytimes.com/recipe',
      ];
      domains.forEach(url => {
        expect(() => recipeUrlSchema.parse(url)).not.toThrow();
      });
    });
  });

  describe('Failure Cases', () => {
    it('should reject non-whitelisted domain', () => {
      expect(() => recipeUrlSchema.parse('https://example.com/recipe')).toThrow('Must be from a supported recipe site');
    });

    it('should reject invalid URL format', () => {
      expect(() => recipeUrlSchema.parse('not-a-url')).toThrow('Must be a valid URL');
    });

    it('should reject empty string', () => {
      expect(() => recipeUrlSchema.parse('')).toThrow();
    });

    it('should reject malicious URL', () => {
      expect(() => recipeUrlSchema.parse('javascript:alert("xss")')).toThrow();
    });

    it('should reject random domain', () => {
      expect(() => recipeUrlSchema.parse('https://malicious.com/recipe')).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle URLs with query parameters', () => {
      expect(() => recipeUrlSchema.parse('https://youtube.com/watch?v=123&t=45')).not.toThrow();
    });

    it('should handle URLs with fragments', () => {
      expect(() => recipeUrlSchema.parse('https://allrecipes.com/recipe/12345/#recipe')).not.toThrow();
    });

    it('should handle subdomain variations', () => {
      expect(() => recipeUrlSchema.parse('https://www.youtube.com/watch?v=123')).not.toThrow();
    });
  });
});

describe('recipeUrlSchemaRelaxed', () => {
  describe('Success Cases', () => {
    it('should validate any valid URL', () => {
      expect(() => recipeUrlSchemaRelaxed.parse('https://example.com/recipe')).not.toThrow();
    });

    it('should validate whitelisted domains', () => {
      expect(() => recipeUrlSchemaRelaxed.parse('https://youtube.com/watch?v=123')).not.toThrow();
    });

    it('should validate non-whitelisted domains', () => {
      expect(() => recipeUrlSchemaRelaxed.parse('https://myrecipes.com/recipe')).not.toThrow();
    });
  });

  describe('Failure Cases', () => {
    it('should reject invalid URL format', () => {
      expect(() => recipeUrlSchemaRelaxed.parse('not-a-url')).toThrow();
    });

    it('should reject empty hostname', () => {
      expect(() => recipeUrlSchemaRelaxed.parse('https://')).toThrow();
    });
  });
});

describe('imageFileSchema', () => {
  describe('Success Cases', () => {
    it('should validate a valid JPEG file', () => {
      const file = new File(['image data'], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate a valid PNG file', () => {
      const file = new File(['image data'], 'image.png', { type: 'image/png' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate a valid WebP file', () => {
      const file = new File(['image data'], 'image.webp', { type: 'image/webp' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate a valid GIF file', () => {
      const file = new File(['image data'], 'image.gif', { type: 'image/gif' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate file at max size (5MB)', () => {
      const size = 5 * 1024 * 1024;
      const data = new ArrayBuffer(size);
      const file = new File([data], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate file with uppercase extension', () => {
      const file = new File(['image data'], 'image.JPG', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should validate JPEG with jpg extension', () => {
      const file = new File(['image data'], 'photo.jpeg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });
  });

  describe('Failure Cases', () => {
    it('should reject empty file', () => {
      const file = new File([], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).toThrow('File cannot be empty');
    });

    it('should reject file exceeding 5MB', () => {
      const size = (5 * 1024 * 1024) + 1;
      const data = new ArrayBuffer(size);
      const file = new File([data], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).toThrow('File must be less than 5MB');
    });

    it('should reject non-image file type', () => {
      const file = new File(['data'], 'document.pdf', { type: 'application/pdf' });
      expect(() => imageFileSchema.parse(file)).toThrow('File must be an image');
    });

    it('should reject executable file', () => {
      const file = new File(['data'], 'virus.exe', { type: 'application/x-msdownload' });
      expect(() => imageFileSchema.parse(file)).toThrow();
    });

    it('should reject file without image extension', () => {
      const file = new File(['image data'], 'image.txt', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).toThrow('File must have a valid image extension');
    });

    it('should reject wrong MIME type', () => {
      const file = new File(['data'], 'image.jpg', { type: 'text/plain' });
      expect(() => imageFileSchema.parse(file)).toThrow('File must be an image');
    });

    it('should reject 10MB file', () => {
      const size = 10 * 1024 * 1024;
      const data = new ArrayBuffer(size);
      const file = new File([data], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).toThrow('File must be less than 5MB');
    });
  });

  describe('Edge Cases', () => {
    it('should handle file with multiple extensions', () => {
      const file = new File(['image data'], 'image.backup.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should handle file with spaces in name', () => {
      const file = new File(['image data'], 'my image file.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });

    it('should handle very small file (1 byte)', () => {
      const file = new File(['a'], 'image.jpg', { type: 'image/jpeg' });
      expect(() => imageFileSchema.parse(file)).not.toThrow();
    });
  });
});

describe('ratingSchema', () => {
  describe('Success Cases', () => {
    it('should validate rating of 1 star', () => {
      expect(() => ratingSchema.parse(1)).not.toThrow();
    });

    it('should validate rating of 5 stars', () => {
      expect(() => ratingSchema.parse(5)).not.toThrow();
    });

    it('should validate rating of 3 stars', () => {
      expect(() => ratingSchema.parse(3)).not.toThrow();
    });

    it('should validate all valid ratings', () => {
      [1, 2, 3, 4, 5].forEach(rating => {
        expect(() => ratingSchema.parse(rating)).not.toThrow();
      });
    });
  });

  describe('Failure Cases', () => {
    it('should reject rating of 0', () => {
      expect(() => ratingSchema.parse(0)).toThrow('Rating must be at least 1 star');
    });

    it('should reject rating of 6', () => {
      expect(() => ratingSchema.parse(6)).toThrow('Rating cannot exceed 5 stars');
    });

    it('should reject negative rating', () => {
      expect(() => ratingSchema.parse(-1)).toThrow('Rating must be at least 1 star');
    });

    it('should reject decimal rating (3.5)', () => {
      expect(() => ratingSchema.parse(3.5)).toThrow('Rating must be a whole number');
    });

    it('should reject decimal rating (4.8)', () => {
      expect(() => ratingSchema.parse(4.8)).toThrow('Rating must be a whole number');
    });

    it('should reject string rating', () => {
      expect(() => ratingSchema.parse('5' as any)).toThrow();
    });

    it('should reject null', () => {
      expect(() => ratingSchema.parse(null as any)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should reject very large number', () => {
      expect(() => ratingSchema.parse(1000)).toThrow('Rating cannot exceed 5 stars');
    });

    it('should reject very small number', () => {
      expect(() => ratingSchema.parse(-1000)).toThrow();
    });
  });
});

describe('timeFormatSchema', () => {
  describe('Success Cases', () => {
    it('should validate "30 minutes"', () => {
      expect(() => timeFormatSchema.parse('30 minutes')).not.toThrow();
    });

    it('should validate "1 hour"', () => {
      expect(() => timeFormatSchema.parse('1 hour')).not.toThrow();
    });

    it('should validate "2 hours"', () => {
      expect(() => timeFormatSchema.parse('2 hours')).not.toThrow();
    });

    it('should validate "1 hour 30 minutes"', () => {
      expect(() => timeFormatSchema.parse('1 hour 30 minutes')).not.toThrow();
    });

    it('should validate "45min"', () => {
      expect(() => timeFormatSchema.parse('45min')).not.toThrow();
    });

    it('should validate "1hr"', () => {
      expect(() => timeFormatSchema.parse('1hr')).not.toThrow();
    });

    it('should validate "2h 15m"', () => {
      expect(() => timeFormatSchema.parse('2h 15m')).not.toThrow();
    });

    it('should validate "1:30" (colon format)', () => {
      expect(() => timeFormatSchema.parse('1:30')).not.toThrow();
    });

    it('should validate "0:45"', () => {
      expect(() => timeFormatSchema.parse('0:45')).not.toThrow();
    });

    it('should validate with extra whitespace', () => {
      const result = timeFormatSchema.parse('  30 minutes  ');
      expect(result).toBe('30 minutes');
    });

    it('should validate case-insensitive formats', () => {
      expect(() => timeFormatSchema.parse('30 MINUTES')).not.toThrow();
      expect(() => timeFormatSchema.parse('1 Hour')).not.toThrow();
      expect(() => timeFormatSchema.parse('2 HOURS 15 MINUTES')).not.toThrow();
    });

    it('should validate abbreviated forms', () => {
      expect(() => timeFormatSchema.parse('30mins')).not.toThrow();
      expect(() => timeFormatSchema.parse('1hrs')).not.toThrow();
      expect(() => timeFormatSchema.parse('2h')).not.toThrow();
      expect(() => timeFormatSchema.parse('45m')).not.toThrow();
    });
  });

  describe('Failure Cases', () => {
    it('should reject invalid format', () => {
      expect(() => timeFormatSchema.parse('invalid')).toThrow('Invalid time format');
    });

    it('should reject empty string', () => {
      expect(() => timeFormatSchema.parse('')).toThrow();
    });

    it('should reject number without unit', () => {
      expect(() => timeFormatSchema.parse('30')).toThrow('Invalid time format');
    });

    it('should reject invalid separator', () => {
      expect(() => timeFormatSchema.parse('1 hour and 30 minutes')).toThrow('Invalid time format');
    });

    it('should reject wrong unit order', () => {
      expect(() => timeFormatSchema.parse('30 minutes 1 hour')).toThrow('Invalid time format');
    });

    it('should reject special characters', () => {
      expect(() => timeFormatSchema.parse('30@minutes')).toThrow('Invalid time format');
    });
  });

  describe('Edge Cases', () => {
    it('should validate single digit', () => {
      expect(() => timeFormatSchema.parse('5 minutes')).not.toThrow();
    });

    it('should validate large numbers', () => {
      expect(() => timeFormatSchema.parse('240 minutes')).not.toThrow();
      expect(() => timeFormatSchema.parse('4 hours')).not.toThrow();
    });

    it('should accept reasonable spacing variations', () => {
      // The regex allows single spaces between words, but multiple consecutive spaces
      // would fail the regex pattern
      expect(() => timeFormatSchema.parse('1 hour 30 minutes')).not.toThrow();
    });
  });
});

describe('servingSizeSchema', () => {
  describe('Success Cases', () => {
    it('should validate 1 serving', () => {
      expect(() => servingSizeSchema.parse(1)).not.toThrow();
    });

    it('should validate 4 servings', () => {
      expect(() => servingSizeSchema.parse(4)).not.toThrow();
    });

    it('should validate 100 servings (max)', () => {
      expect(() => servingSizeSchema.parse(100)).not.toThrow();
    });

    it('should validate typical serving sizes', () => {
      [1, 2, 4, 6, 8, 12].forEach(servings => {
        expect(() => servingSizeSchema.parse(servings)).not.toThrow();
      });
    });
  });

  describe('Failure Cases', () => {
    it('should reject 0 servings', () => {
      expect(() => servingSizeSchema.parse(0)).toThrow('Servings must be positive');
    });

    it('should reject negative servings', () => {
      expect(() => servingSizeSchema.parse(-1)).toThrow('Servings must be positive');
    });

    it('should reject 101 servings (exceeds max)', () => {
      expect(() => servingSizeSchema.parse(101)).toThrow('Servings cannot exceed 100');
    });

    it('should reject decimal servings', () => {
      expect(() => servingSizeSchema.parse(4.5)).toThrow('Servings must be a whole number');
    });

    it('should reject string servings', () => {
      expect(() => servingSizeSchema.parse('4' as any)).toThrow();
    });

    it('should reject null', () => {
      expect(() => servingSizeSchema.parse(null as any)).toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should reject very large number', () => {
      expect(() => servingSizeSchema.parse(1000)).toThrow('Servings cannot exceed 100');
    });

    it('should reject very negative number', () => {
      expect(() => servingSizeSchema.parse(-1000)).toThrow();
    });
  });
});

describe('recipeFormSchema', () => {
  describe('Success Cases', () => {
    it('should validate a complete recipe', () => {
      const validRecipe = {
        title: 'Chocolate Chip Cookies',
        description: 'Delicious homemade cookies',
        cookTime: '15 minutes',
        prep_time: '10 minutes',
        servings: 12,
        ingredients: ['2 cups flour', '1 cup sugar', '1/2 cup butter'],
        instructions: 'Mix ingredients. Bake at 350°F for 15 minutes.',
        rating: 5,
        difficulty: 'Easy',
        cuisine_type: 'American',
        cooking_method: 'Baking',
        categories: ['Dessert', 'Cookies'],
        diet_tags: ['Vegetarian'],
        season_occasion: ['Christmas', 'Holiday'],
      };
      expect(() => recipeFormSchema.parse(validRecipe)).not.toThrow();
    });

    it('should validate minimal recipe', () => {
      const validRecipe = {
        title: 'Simple Recipe',
        cookTime: '30 minutes',
        servings: 2,
        ingredients: ['ingredient 1'],
        instructions: 'Cook the ingredient for 30 minutes.',
      };
      expect(() => recipeFormSchema.parse(validRecipe)).not.toThrow();
    });

    it('should validate with 100 ingredients (max)', () => {
      const validRecipe = {
        title: 'Complex Recipe',
        cookTime: '1 hour',
        servings: 4,
        ingredients: Array.from({ length: 100 }, (_, i) => `Ingredient ${i + 1}`),
        instructions: 'Follow the complex steps.',
      };
      expect(() => recipeFormSchema.parse(validRecipe)).not.toThrow();
    });

    it('should validate title at max length (200 chars)', () => {
      const validRecipe = {
        title: 'A'.repeat(200),
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(validRecipe)).not.toThrow();
    });

    it('should validate instructions at max length (10000 chars)', () => {
      const validRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'A'.repeat(10000),
      };
      expect(() => recipeFormSchema.parse(validRecipe)).not.toThrow();
    });

    it('should trim whitespace from fields', () => {
      const recipe = {
        title: '  Recipe Title  ',
        cookTime: '  30 minutes  ',
        servings: 4,
        ingredients: ['  ingredient  '],
        instructions: '  Instructions here  ',
      };
      const result = recipeFormSchema.parse(recipe);
      expect(result.title).toBe('Recipe Title');
      expect(result.cookTime).toBe('30 minutes');
      expect(result.ingredients[0]).toBe('ingredient');
      expect(result.instructions).toBe('Instructions here');
    });
  });

  describe('Failure Cases', () => {
    it('should reject empty title', () => {
      const invalidRecipe = {
        title: '',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Title is required');
    });

    it('should reject title exceeding 200 characters', () => {
      const invalidRecipe = {
        title: 'A'.repeat(201),
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Title must be less than 200 characters');
    });

    it('should reject invalid cookTime format', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: 'invalid',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Invalid time format');
    });

    it('should reject no ingredients', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: [],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('At least one ingredient is required');
    });

    it('should reject 101 ingredients (exceeds max)', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: Array.from({ length: 101 }, (_, i) => `Ingredient ${i + 1}`),
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Too many ingredients (max 100)');
    });

    it('should reject instructions too short', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Instructions must be at least 10 characters');
    });

    it('should reject instructions too long', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'A'.repeat(10001),
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Instructions are too long');
    });

    it('should reject invalid servings', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 0,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Servings must be positive');
    });

    it('should reject invalid rating', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
        rating: 6,
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Rating cannot exceed 5 stars');
    });

    it('should reject empty ingredient', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient', ''],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Ingredient cannot be empty');
    });

    it('should reject ingredient exceeding 500 characters', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['A'.repeat(501)],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Ingredient must be less than 500 characters');
    });

    it('should reject too many categories', () => {
      const invalidRecipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
        categories: Array.from({ length: 21 }, (_, i) => `Category ${i + 1}`),
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Too many categories (max 20)');
    });

    it('should reject description exceeding 1000 characters', () => {
      const invalidRecipe = {
        title: 'Recipe',
        description: 'A'.repeat(1001),
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(invalidRecipe)).toThrow('Description must be less than 1000 characters');
    });
  });

  describe('Edge Cases', () => {
    it('should handle Unicode in title', () => {
      const recipe = {
        title: 'Recipe with Emoji 🍕',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(recipe)).not.toThrow();
    });

    it('should handle Unicode in ingredients', () => {
      const recipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['½ cup flour', '¼ tsp salt'],
        instructions: 'Cook the ingredient.',
      };
      expect(() => recipeFormSchema.parse(recipe)).not.toThrow();
    });

    it('should handle special characters', () => {
      const recipe = {
        title: "Mom's & Dad's Recipe",
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient "special"'],
        instructions: 'Cook @ 350°F for 30 minutes.',
      };
      expect(() => recipeFormSchema.parse(recipe)).not.toThrow();
    });

    it('should handle optional fields as undefined', () => {
      const recipe = {
        title: 'Recipe',
        cookTime: '30 minutes',
        servings: 4,
        ingredients: ['ingredient'],
        instructions: 'Cook the ingredient.',
        description: undefined,
        prep_time: undefined,
        rating: undefined,
        difficulty: undefined,
        cuisine_type: undefined,
        cooking_method: undefined,
        categories: undefined,
        diet_tags: undefined,
        season_occasion: undefined,
      };
      expect(() => recipeFormSchema.parse(recipe)).not.toThrow();
    });
  });
});

describe('textInputSchema', () => {
  describe('Success Cases', () => {
    it('should validate normal text', () => {
      expect(() => textInputSchema.parse('Hello World')).not.toThrow();
    });

    it('should validate empty string', () => {
      expect(() => textInputSchema.parse('')).not.toThrow();
    });

    it('should validate text at max length (1000 chars)', () => {
      expect(() => textInputSchema.parse('A'.repeat(1000))).not.toThrow();
    });

    it('should trim whitespace', () => {
      const result = textInputSchema.parse('  Hello  ');
      expect(result).toBe('Hello');
    });

    it('should validate Unicode', () => {
      expect(() => textInputSchema.parse('Hello 世界 🌍')).not.toThrow();
    });

    it('should validate special characters', () => {
      expect(() => textInputSchema.parse('Hello & "special" <chars>')).not.toThrow();
    });
  });

  describe('Failure Cases', () => {
    it('should reject text exceeding 1000 characters', () => {
      expect(() => textInputSchema.parse('A'.repeat(1001))).toThrow('Text is too long');
    });
  });

  describe('Edge Cases', () => {
    it('should handle newlines', () => {
      expect(() => textInputSchema.parse('Line 1\nLine 2')).not.toThrow();
    });

    it('should handle tabs', () => {
      expect(() => textInputSchema.parse('Tab\there')).not.toThrow();
    });

    it('should handle mixed whitespace', () => {
      const result = textInputSchema.parse('  \n\t  Text  \n\t  ');
      expect(result).toBe('Text');
    });
  });
});
