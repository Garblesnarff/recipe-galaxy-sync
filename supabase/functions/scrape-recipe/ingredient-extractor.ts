/**
 * Utility functions for ingredient extraction and processing
 */

import { extractStructuredRecipeData } from "./structured-data-extractor.ts";

/**
 * Cleans up ingredient text
 */
function cleanIngredientText(ingredient: string): string {
  return ingredient
    .replace(/<[^>]+>/g, ' ')      // Remove HTML tags
    .replace(/\s+/g, ' ')          // Normalize whitespace
    .replace(/^[-•*·⁕⚫⬤◉◆○◯✓✅⬜⬛☐☑︎☑️]+\s*/u, '') // Remove bullet points
    .trim();
}

/**
 * Filters out non-ingredient items
 */
function filterIngredients(ingredients: string[]): string[] {
  // Common words that indicate non-ingredient text 
  const nonIngredientPatterns = [
    /click|tap|visit|share|print|save|jump|scroll|subscribe|newsletter|follow/i,
    /video|watch|view|read more|continue|check out|related|see more/i,
    /comments?|ratings?|reviews?|stars?/i,
    /facebook|twitter|instagram|pinterest|email|whatsapp/i,
    /advertisement|sponsored|promotion|offer/i,
    /search|find|looking for/i
  ];
  
  // Common patterns that identify actual ingredients
  const ingredientPatterns = [
    /\d+\s*(?:cup|tablespoon|tbsp|tsp|teaspoon|ounce|oz|pound|lb|gram|kg|ml|g)\s+/i,  // Measurements
    /\d+\s*(?:small|medium|large)/i,  // Sizes with numbers
    /\b(?:cup|tablespoon|tbsp|tsp|teaspoon|ounce|oz|pound|lb|gram|kg|ml|g)s?\b/i,     // Measurement terms
    /\b(?:salt|pepper|oil|sugar|flour|butter|egg|water|milk|garlic|onion)\b/i,        // Common ingredients
    /\b(?:chopped|diced|minced|sliced|grated|crushed)\b/i                             // Preparation terms
  ];

  return ingredients.filter(ingredient => {
    const cleaned = cleanIngredientText(ingredient);
    
    // Reject items that are too short or empty
    if (cleaned.length < 3) {
      return false;
    }
    
    // Reject items that match non-ingredient patterns
    for (const pattern of nonIngredientPatterns) {
      if (pattern.test(cleaned)) {
        return false;
      }
    }
    
    // Accept items that look like ingredients
    for (const pattern of ingredientPatterns) {
      if (pattern.test(cleaned)) {
        return true;
      }
    }
    
    // Default behavior - keep it if it's not too long (likely not a paragraph of text)
    return cleaned.length < 100;
  }).map(cleanIngredientText);
}

/**
 * Extracts ingredients from HTML
 */
export function extractIngredients(html: string): string[] {
  // Try to get from structured data first
  const structuredData = extractStructuredRecipeData(html);
  if (structuredData?.recipeIngredient && Array.isArray(structuredData.recipeIngredient)) {
    console.log('Extracting ingredients from structured data');
    return filterIngredients(structuredData.recipeIngredient);
  }

  // Look for common ingredient patterns
  const ingredientPatterns = [
    // Look for a section that starts with ingredients and ends with another section
    /<h[2-4][^>]*>\s*ingredients\s*<\/h[2-4]>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i,
    // Try to find ordered list after "ingredients" heading
    /<h[2-4][^>]*>\s*ingredients\s*<\/h[2-4]>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i,
    // Look for div with "ingredient" in the class or id
    /<div[^>]*(?:class|id)=["'][^"']*ingredient[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    // More general pattern - section with "ingredient" in class/id containing a list
    /<[^>]*(?:class|id)=["'][^"']*ingredient[^"']*["'][^>]*>[\s\S]*?<ul[^>]*>([\s\S]*?)<\/ul>/i,
    // Look for a section that starts with "ingredients:" and ends with another section
    /ingredients:?\s*([\s\S]*?)(?:preparation|instructions|directions|method|steps|$)/i
  ];

  for (const pattern of ingredientPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      console.log('Found ingredients with pattern:', pattern);
      
      // Extract list items if they exist
      const listItems = match[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
      if (listItems) {
        const ingredients = listItems.map(item => {
          return cleanIngredientText(item);
        }).filter(item => item.length > 0);
        
        return filterIngredients(ingredients);
      }
      
      // If no list items, return the cleaned content
      const ingredients = match[1].split(/\n|<br\s*\/?>/).map(line => {
        return cleanIngredientText(line);
      }).filter(line => line.length > 0);
      
      return filterIngredients(ingredients);
    }
  }

  // Fallback - look for any list items after the word "ingredients"
  const fallbackMatch = html.match(/ingredients[^<]*(?:<[^>]+>)*[\s\S]*?(<ul[^>]*>[\s\S]*?<\/ul>|<ol[^>]*>[\s\S]*?<\/ol>)/i);
  if (fallbackMatch) {
    const listItems = fallbackMatch[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
    if (listItems) {
      const ingredients = listItems.map(item => cleanIngredientText(item))
                      .filter(item => item.length > 0);
      
      return filterIngredients(ingredients);
    }
  }

  // Last resort - look for paragraphs after "ingredients"
  const lastResort = html.match(/ingredients[^<]*(?:<[^>]+>)*[\s\S]*?(<p[^>]*>[\s\S]*?<\/p>)/i);
  if (lastResort) {
    const ingredients = lastResort[1].split(/\n|<br\s*\/?>/).map(line => {
      return cleanIngredientText(line);
    }).filter(line => line.length > 0);
    
    return filterIngredients(ingredients);
  }

  return [];
}
