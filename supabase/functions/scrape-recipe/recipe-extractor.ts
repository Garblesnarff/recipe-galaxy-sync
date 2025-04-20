/**
 * Recipe extraction utilities
 */

/**
 * Extracts the meta content from HTML
 * @param html - The HTML content to extract from
 * @param property - The meta property to extract
 * @returns The meta content or undefined
 */
export function getMetaContent(html: string, property: string): string | undefined {
  const regex = new RegExp(`<meta\\s+(?:property|name)=["']${property}["']\\s+content=["']([^"']+)["']`, 'i');
  const match = html.match(regex);
  if (match) return match[1];

  // Try the reverse order (content first, then property)
  const reverseRegex = new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+(?:property|name)=["']${property}["']`, 'i');
  const reverseMatch = html.match(reverseRegex);
  return reverseMatch ? reverseMatch[1] : undefined;
}

/**
 * Extracts structured recipe data from HTML
 * @param html - The HTML content to extract from
 * @returns The structured recipe data or undefined
 */
function extractStructuredRecipeData(html: string) {
  try {
    // Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch) {
          try {
            const jsonData = JSON.parse(contentMatch[1]);
            
            // Handle single recipe object
            if (jsonData['@type'] === 'Recipe') {
              console.log('Found structured recipe data (JSON-LD single)');
              return jsonData;
            }
            
            // Handle array of types that includes Recipe
            if (Array.isArray(jsonData['@type']) && jsonData['@type'].includes('Recipe')) {
              console.log('Found structured recipe data (JSON-LD with array type)');
              return jsonData;
            }
            
            // Handle @graph with recipe inside
            if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
              const recipeNode = jsonData['@graph'].find((item: any) => 
                item['@type'] === 'Recipe' || 
                (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
              );
              
              if (recipeNode) {
                console.log('Found structured recipe data (JSON-LD with @graph)');
                return recipeNode;
              }
            }
          } catch (parseError) {
            console.error('Error parsing JSON-LD:', parseError);
          }
        }
      }
    }

    // Look for microdata
    const microdataMatch = html.match(/<[^>]+itemtype=['"]http:\/\/schema.org\/Recipe['"][^>]*>([\s\S]*?)(?:<\/[^>]+>)/i);
    if (microdataMatch) {
      console.log('Found structured recipe data (microdata)');
      // Basic processing of microdata could be added here
    }

    return undefined;
  } catch (error) {
    console.error('Error extracting structured recipe data:', error);
    return undefined;
  }
}

/**
 * Cleans up ingredient text
 * @param ingredient - The ingredient text to clean
 * @returns Cleaned ingredient text
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
 * @param ingredients - The list of potential ingredients
 * @returns Filtered list of actual ingredients
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
 * @param html - The HTML content to extract from
 * @returns Array of ingredients
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

/**
 * Extracts instructions from HTML
 * @param html - The HTML content to extract from
 * @returns Instructions as text or undefined
 */
export function extractInstructions(html: string): string | undefined {
  // Try to get from structured data first
  const structuredData = extractStructuredRecipeData(html);
  if (structuredData?.recipeInstructions) {
    console.log('Extracting instructions from structured data');
    
    if (Array.isArray(structuredData.recipeInstructions)) {
      // If it's an array, join the instructions with line breaks
      return structuredData.recipeInstructions.map((instruction: any) => {
        // Handle HowToStep objects
        if (typeof instruction === 'object' && instruction.text) {
          return instruction.text;
        }
        return instruction;
      }).join('\n\n');
    } else if (typeof structuredData.recipeInstructions === 'string') {
      return structuredData.recipeInstructions;
    }
  }

  // Filter out common ad and navigation phrases 
  const filterNonInstructionContent = (text: string): string => {
    return text
      .replace(/(?:advertisement|sponsored content|ad).*$/gim, '')
      .replace(/(?:click|tap|jump|scroll).*?(?:below|above|here|now)/gi, '')
      .replace(/(?:sign up|subscribe).*?(?:newsletter|updates)/gi, '')
      .replace(/(?:follow|like|share).*?(?:facebook|twitter|instagram|pinterest)/gi, '')
      .replace(/(?:you may also like|related recipes|more recipes|try these next)/gi, '')
      .replace(/©.*?all rights reserved/gi, '')
      .trim();
  };

  // Look for common instruction patterns
  const instructionPatterns = [
    // Look for a section that starts with "instructions", "directions", "method" etc.
    /<h[2-4][^>]*>\s*(?:instructions|directions|method|steps|preparation)\s*<\/h[2-4]>([\s\S]*?)(?:<h[2-4]|<div[^>]*class=["'](?:footer|comments|tags)|$)/i,
    // Look for ordered list after "instructions" heading
    /<h[2-4][^>]*>\s*(?:instructions|directions|method|steps|preparation)\s*<\/h[2-4]>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i,
    // Look for div with "instruction" in the class or id
    /<div[^>]*(?:class|id)=["'][^"']*(?:instruction|direction|method|step|preparation)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    // More general pattern - section with "instruction" in class/id containing a list
    /<[^>]*(?:class|id)=["'][^"']*(?:instruction|direction|method|step|preparation)[^"']*["'][^>]*>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i,
    // Look for a section with numbered paragraphs
    /((?:<p[^>]*>\s*\d+\.[\s\S]*?<\/p>\s*){2,})/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      console.log('Found instructions with pattern:', pattern);
      
      let instructions = match[1];
      
      // Clean up the HTML
      instructions = instructions
        .replace(/<h[2-6][^>]*>[\s\S]*?<\/h[2-6]>/gi, '\n') // Remove sub-headings
        .replace(/<script[\s\S]*?<\/script>/gi, '') // Remove scripts
        .replace(/<style[\s\S]*?<\/style>/gi, '') // Remove styles
        .replace(/<[^>]*(?:ads|comment|widget|sidebar|footer|nav|share)[^>]*>[\s\S]*?<\/[^>]*>/gi, '') // Remove ads, comments, etc.
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n') // Convert list items to bullet points
        .replace(/<\/(?:p|div|section|article|br)>/gi, '\n') // Add line breaks at block ends
        .replace(/<[^>]+>/g, ' ') // Remove remaining HTML tags
        .replace(/\s+/g, ' ') // Normalize whitespace
        .split('\n')
        .map(line => filterNonInstructionContent(line.trim()))
        .filter(line => line.length > 0)
        .join('\n');
      
      return instructions;
    }
  }

  // Fallback - try to find any ordered list
  const fallbackMatch = html.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
  if (fallbackMatch) {
    let instructions = fallbackMatch[1];
    instructions = instructions
      .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .split('\n')
      .map(line => filterNonInstructionContent(line.trim()))
      .filter(line => line.length > 0)
      .join('\n');
    
    return instructions;
  }

  // Last resort - look for paragraphs after a word likely to indicate instructions
  const lastResort = html.match(/(?:instructions|directions|method|steps|preparation)[^<]*(?:<[^>]+>)*[\s\S]*?(<p[^>]*>[\s\S]*?<\/p>(?:\s*<p[^>]*>[\s\S]*?<\/p>)*)/i);
  if (lastResort) {
    let instructions = lastResort[1];
    instructions = instructions
      .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .split('\n')
      .map(line => filterNonInstructionContent(line.trim()))
      .filter(line => line.length > 0)
      .join('\n');
    
    return instructions;
  }

  return undefined;
}
