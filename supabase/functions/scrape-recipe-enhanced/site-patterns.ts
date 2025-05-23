/**
 * Enhanced recipe extraction with site-specific patterns
 * Handles common recipe sites that aren't covered by basic structured data
 */

import { extractStructuredRecipeData } from "../scrape-recipe/structured-data-extractor.ts";

export function extractRecipeWithSitePatterns(html: string, domain: string): any {
  console.log(`🎯 Attempting enhanced extraction for domain: ${domain}`);
  
  // Try structured data first (your current working method)
  const structuredData = extractStructuredRecipeData(html);
  if (structuredData && structuredData.name) {
    console.log('✅ Structured data extraction successful');
    return normalizeRecipeData(structuredData);
  }

  // Site-specific patterns for challenging sites
  if (domain.includes('foodnetwork.com')) {
    return extractFoodNetworkRecipe(html);
  }
  
  if (domain.includes('hellofresh.com')) {
    return extractHelloFreshRecipe(html);
  }

  if (domain.includes('epicurious.com')) {
    return extractEpicuriousRecipe(html);
  }

  if (domain.includes('bonappetit.com')) {
    return extractBonAppetitRecipe(html);
  }

  // Fallback to basic HTML parsing
  return extractBasicRecipe(html);
}

function extractFoodNetworkRecipe(html: string): any {
  console.log('🍳 Extracting Food Network recipe...');
  
  try {
    // Food Network specific selectors
    const titleMatch = html.match(/<h1[^>]*class="[^"]*recipe-summary-item-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/<title>([^<]+(?:Recipe|recipe)[^<]*)<\/title>/i);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Food Network Recipe';

    // Extract ingredients from Food Network structure
    const ingredients = [];
    const ingredientMatches = html.matchAll(/<span[^>]*class="[^"]*o-Ingredients__a-Ingredient[^"]*"[^>]*>([^<]+)<\/span>/g);
    for (const match of ingredientMatches) {
      ingredients.push(match[1].trim());
    }

    // Extract instructions
    const instructionMatches = html.matchAll(/<li[^>]*class="[^"]*o-Method__m-Step[^"]*"[^>]*>([^<]+)<\/li>/g);
    const instructions = [];
    for (const match of instructionMatches) {
      instructions.push(match[1].trim());
    }

    // Extract image
    const imageMatch = html.match(/<img[^>]*class="[^"]*m-MediaBlock__a-Image[^"]*"[^>]*src="([^"]+)"/i) ||
                       html.match(/<meta[^>]*property="og:image"[^>]*content="([^"]+)"/i);
    
    const image_url = imageMatch ? imageMatch[1] : undefined;

    return {
      title,
      ingredients,
      instructions: instructions.join('\n'),
      image_url,
      source: 'foodnetwork_pattern'
    };
  } catch (error) {
    console.error('Error extracting Food Network recipe:', error);
    return null;
  }
}

function extractHelloFreshRecipe(html: string): any {
  console.log('🥗 Extracting HelloFresh recipe...');
  
  try {
    // HelloFresh uses dynamic content, look for data attributes
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) ||
                       html.match(/data-test[^>]*recipe-header[^>]*>([^<]+)/i);
    
    const title = titleMatch ? titleMatch[1].trim() : 'HelloFresh Recipe';

    // Look for ingredients in various formats
    const ingredients = [];
    
    // Pattern 1: data-test attributes
    const ingredientMatches1 = html.matchAll(/data-test="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/[^>]+>/g);
    for (const match of ingredientMatches1) {
      ingredients.push(match[1].trim());
    }

    // Pattern 2: ingredient classes
    const ingredientMatches2 = html.matchAll(/<[^>]*class="[^"]*ingredient[^"]*"[^>]*>([^<]+)<\/[^>]+>/g);
    for (const match of ingredientMatches2) {
      if (!ingredients.includes(match[1].trim())) {
        ingredients.push(match[1].trim());
      }
    }

    // Extract cooking steps
    const stepMatches = html.matchAll(/data-test="[^"]*cooking-step[^"]*"[^>]*>([^<]+)<\/[^>]+>/g);
    const instructions = [];
    for (const match of stepMatches) {
      instructions.push(match[1].trim());
    }

    return {
      title,
      ingredients,
      instructions: instructions.join('\n'),
      source: 'hellofresh_pattern'
    };
  } catch (error) {
    console.error('Error extracting HelloFresh recipe:', error);
    return null;
  }
}

function extractEpicuriousRecipe(html: string): any {
  console.log('🍽️ Extracting Epicurious recipe...');
  
  try {
    const titleMatch = html.match(/<h1[^>]*class="[^"]*headline[^"]*"[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Epicurious Recipe';

    // Epicurious ingredient pattern
    const ingredients = [];
    const ingredientMatches = html.matchAll(/<div[^>]*data-testid="IngredientList"[^>]*>[\s\S]*?<\/div>/g);
    for (const match of ingredientMatches) {
      const innerMatches = match[0].matchAll(/>([^<]+)</g);
      for (const inner of innerMatches) {
        const text = inner[1].trim();
        if (text && text.length > 3 && !text.includes('<')) {
          ingredients.push(text);
        }
      }
    }

    return {
      title,
      ingredients,
      source: 'epicurious_pattern'
    };
  } catch (error) {
    console.error('Error extracting Epicurious recipe:', error);
    return null;
  }
}

function extractBonAppetitRecipe(html: string): any {
  console.log('👨‍🍳 Extracting Bon Appétit recipe...');
  
  try {
    const titleMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const title = titleMatch ? titleMatch[1].trim() : 'Bon Appétit Recipe';

    return {
      title,
      source: 'bonappetit_pattern'
    };
  } catch (error) {
    console.error('Error extracting Bon Appétit recipe:', error);
    return null;
  }
}

function extractBasicRecipe(html: string): any {
  console.log('🔧 Attempting basic HTML recipe extraction...');
  
  try {
    // Look for common recipe indicators
    const titleMatch = html.match(/<title>([^<]*(?:recipe|Recipe)[^<]*)<\/title>/i) ||
                       html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    
    const title = titleMatch ? titleMatch[1].trim() : 'Recipe';

    // Look for ingredient lists
    const ingredients = [];
    const ingredientListMatch = html.match(/<ul[^>]*>[\s\S]*?<\/ul>/i);
    if (ingredientListMatch) {
      const itemMatches = ingredientListMatch[0].matchAll(/<li[^>]*>([^<]+)<\/li>/g);
      for (const match of itemMatches) {
        ingredients.push(match[1].trim());
      }
    }

    return {
      title,
      ingredients,
      source: 'basic_html_pattern'
    };
  } catch (error) {
    console.error('Error with basic extraction:', error);
    return null;
  }
}

function normalizeRecipeData(data: any): any {
  // Normalize structured data to consistent format
  return {
    title: data.name || data.title,
    ingredients: Array.isArray(data.recipeIngredient) ? data.recipeIngredient : 
                 Array.isArray(data.ingredients) ? data.ingredients : [],
    instructions: Array.isArray(data.recipeInstructions) ? 
                  data.recipeInstructions.map((step: any) => 
                    typeof step === 'string' ? step : step.text || step.name || ''
                  ).join('\n') : 
                  data.recipeInstructions || data.instructions,
    prep_time: data.prepTime || data.prep_time,
    cook_time: data.cookTime || data.cook_time, 
    servings: data.recipeYield || data.yields || data.servings,
    image_url: data.image || data.image_url,
    description: data.description,
    source: 'structured_data'
  };
}