/**
 * Recipe Utilities - Provides helper functions for recipe-related operations.
 *
 * This file contains functions for formatting cook time, generating URL-friendly slugs,
 * and parsing ingredient strings into a structured format.
 *
 * Dependencies: None
 *
 * @author Claude
 */

// ====================================
// Main functionality
// ====================================

/**
 * Formats cook time in minutes into a human-readable string (e.g., "1 hour 30 minutes").
 *
 * @param {number} minutes - The cook time in minutes.
 * @returns {string} The formatted cook time string.
 */
function formatCookTime(minutes: number): string {
  if (minutes < 0) {
    minutes = 0;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  let result = '';
  if (hours > 0) {
    result += `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  if (remainingMinutes > 0) {
    if (hours > 0) {
      result += ' ';
    }
    result += `${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
  }
  if (hours === 0 && remainingMinutes === 0) {
    result = '0 minutes';
  }
  return result;
}

/**
 * Generates a URL-friendly slug from a given string.
 *
 * @param {string} title - The input string (e.g., recipe title).
 * @returns {string} The generated slug.
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
    .trim()
    .replace(/\s+/g, '-'); // Replace spaces with hyphens
}

/**
 * Parses an array of string ingredients into a structured format.
 *
 * @param {string[]} ingredients - An array of ingredient strings (e.g., "2 cups flour").
 * @returns {Array<{ item: string; quantity: string; unit: string }>} An array of parsed ingredient objects.
 */
function parseIngredients(ingredients: string[]): Array<{ item: string; quantity: string; unit: string }> {
  return ingredients.map(ingredient => {
    const match = ingredient.match(/^(\d+(\.\d+)?)\s*([a-zA-Z]+)?\s*(.*)$/);
    if (match) {
      const quantity = match[1] || '';
      const unit = match[3] || '';
      const item = match[4] ? match[4].trim() : '';
      return { item, quantity, unit };
    }
    return { item: ingredient.trim(), quantity: '', unit: '' };
  });
}

// Export functions
export {
  formatCookTime,
  generateSlug,
  parseIngredients
};
