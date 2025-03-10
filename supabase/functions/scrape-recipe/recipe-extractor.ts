
import { cleanText } from "./html-utils.ts";

/**
 * Extracts ingredients from HTML content
 * @param html - The HTML content
 * @returns Array of ingredients
 */
export function extractIngredients(html: string): string[] {
  const ingredients: Set<string> = new Set();
  console.log('Extracting ingredients from HTML...');

  // Try Schema.org Recipe markup first (JSON-LD)
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeIngredient) {
        console.log('Found ingredients in Schema.org data');
        recipeData.recipeIngredient.forEach((ingredient: string) => 
          ingredients.add(cleanText(ingredient)));
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common ingredient list patterns if Schema.org didn't work
  if (ingredients.size === 0) {
    const ingredientPatterns = [
      /<(?:li|div)[^>]*class="[^"]*(?:ingredient|ingredients)[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*class="[^"]*recipe-ingred[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*itemprop="recipeIngredient"[^>]*>(.*?)<\/(?:li|div)>/gi
    ];

    for (const pattern of ingredientPatterns) {
      const matches = [...html.matchAll(pattern)];
      matches.forEach(match => {
        const ingredient = cleanText(match[1]);
        if (ingredient) {
          ingredients.add(ingredient);
        }
      });
    }

    // If still no ingredients found, try looking for any list items within ingredient sections
    if (ingredients.size === 0) {
      const sections = html.match(/<(?:div|section)[^>]*>(?:.*?ingredients?.*?)<\/(?:div|section)>/gi);
      if (sections) {
        sections.forEach(section => {
          const items = section.match(/<li[^>]*>(.*?)<\/li>/gi);
          if (items) {
            items.forEach(item => {
              const ingredient = cleanText(item);
              if (ingredient) {
                ingredients.add(ingredient);
              }
            });
          }
        });
      }
    }
  }

  return Array.from(ingredients);
}

/**
 * Extracts instructions from HTML content
 * @param html - The HTML content
 * @returns Formatted instructions as a string
 */
export function extractInstructions(html: string): string {
  console.log('Extracting instructions from HTML...');
  
  // Try Schema.org Recipe markup first
  const schemaMatch = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s);
  if (schemaMatch) {
    try {
      const schema = JSON.parse(schemaMatch[1]);
      const recipeData = schema['@type'] === 'Recipe' ? schema : 
                        Array.isArray(schema['@graph']) ? 
                        schema['@graph'].find((item: any) => item['@type'] === 'Recipe') : null;
      
      if (recipeData?.recipeInstructions) {
        console.log('Found instructions in Schema.org data');
        if (Array.isArray(recipeData.recipeInstructions)) {
          return recipeData.recipeInstructions
            .map((instruction: any, index: number) => {
              if (typeof instruction === 'string') {
                return `${index + 1}. ${cleanText(instruction)}`;
              }
              return `${index + 1}. ${cleanText(instruction.text || instruction.description || '')}`;
            })
            .filter(Boolean)
            .join('\n\n');
        } else if (typeof recipeData.recipeInstructions === 'string') {
          const steps = recipeData.recipeInstructions.split(/\.\s+/).filter(Boolean);
          return steps.map((step: string, index: number) => 
            `${index + 1}. ${cleanText(step)}`
          ).join('\n\n');
        }
      }
    } catch (e) {
      console.log('Error parsing Schema.org data:', e);
    }
  }

  // Try common instruction patterns
  const instructionBlocks: string[] = [];
  
  // Look for instruction containers
  const instructionPatterns = [
    /<(?:div|section)[^>]*class="[^"]*(?:instruction|instructions|steps|preparation|method)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    /<(?:div|section)[^>]*itemprop="recipeInstructions"[^>]*>([\s\S]*?)<\/(?:div|section)>/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match) {
      const content = match[1];
      
      // Try to find ordered lists first
      const orderedList = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
      if (orderedList) {
        const steps = orderedList[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (steps) {
          steps.forEach((step, index) => {
            const cleanStep = cleanText(step);
            if (cleanStep) {
              instructionBlocks.push(`${index + 1}. ${cleanStep}`);
            }
          });
        }
      } else {
        // Try paragraphs if no ordered list is found
        const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
        if (paragraphs) {
          paragraphs.forEach((para, index) => {
            const cleanPara = cleanText(para);
            if (cleanPara) {
              instructionBlocks.push(`${index + 1}. ${cleanPara}`);
            }
          });
        }
      }
      
      if (instructionBlocks.length > 0) break;
    }
  }

  // If no structured content is found, try to find any text content in the instruction section
  if (instructionBlocks.length === 0) {
    const instructionSection = html.match(/<div[^>]*>[\s\S]*?instructions?[\s\S]*?<\/div>/i);
    if (instructionSection) {
      const cleanInstructions = cleanText(instructionSection[0]);
      if (cleanInstructions) {
        // Split by periods and create numbered steps
        const steps = cleanInstructions.split(/\.(?=\s|$)/).filter(Boolean);
        steps.forEach((step, index) => {
          const cleanStep = cleanText(step);
          if (cleanStep) {
            instructionBlocks.push(`${index + 1}. ${cleanStep}`);
          }
        });
      }
    }
  }

  return instructionBlocks.join('\n\n');
}

/**
 * Extract metadata from HTML using meta tags
 * @param html - The HTML content
 * @param name - The meta tag name or property
 * @returns The meta tag content
 */
export function getMetaContent(html: string, name: string): string {
  const match = html.match(new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'))
    || html.match(new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property)=["']${name}["']`, 'i'));
  return match ? cleanText(match[1]) : '';
}
