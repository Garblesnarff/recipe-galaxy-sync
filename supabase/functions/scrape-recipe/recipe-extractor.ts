
import { cleanText } from "./html-utils.ts";

/**
 * Extracts ingredients from HTML content
 * @param html - The HTML content
 * @returns Array of ingredients
 */
export function extractIngredients(html: string): string[] {
  const ingredients: Set<string> = new Set();
  console.log('🌿 Extracting ingredients from HTML...');

  // Try Schema.org Recipe markup first (JSON-LD)
  try {
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonContent);
          
          // Handle different schema formats
          let recipeData = null;
          
          // Direct recipe
          if (schema['@type'] === 'Recipe') {
            recipeData = schema;
          } 
          // Recipe in graph
          else if (Array.isArray(schema['@graph'])) {
            recipeData = schema['@graph'].find((item: any) => item['@type'] === 'Recipe');
          }
          // Recipe in context
          else if (schema.hasOwnProperty('@context') && schema.hasOwnProperty('recipeIngredient')) {
            recipeData = schema;
          }
          
          if (recipeData?.recipeIngredient) {
            console.log('📊 Found ingredients in Schema.org data');
            recipeData.recipeIngredient.forEach((ingredient: string) => 
              ingredients.add(cleanText(ingredient)));
            
            // If we found ingredients, we can break the loop
            if (ingredients.size > 0) break;
          }
        } catch (e) {
          console.log('⚠️ Error parsing Schema.org data in match:', e);
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Error extracting Schema.org data:', e);
  }

  // Try common ingredient list patterns if Schema.org didn't work
  if (ingredients.size === 0) {
    const ingredientPatterns = [
      /<(?:li|div)[^>]*class="[^"]*(?:ingredient|ingredients)[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*class="[^"]*recipe-ingred[^"]*"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*itemprop="recipeIngredient"[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*data-ingredient[^>]*>(.*?)<\/(?:li|div)>/gi,
      /<(?:li|div)[^>]*ingredient-name[^>]*>(.*?)<\/(?:li|div)>/gi
    ];

    for (const pattern of ingredientPatterns) {
      const matches = [...html.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`🔍 Found ${matches.length} ingredients using pattern: ${pattern.toString().substring(0, 40)}...`);
      }
      matches.forEach(match => {
        const ingredient = cleanText(match[1]);
        if (ingredient) {
          ingredients.add(ingredient);
        }
      });
      
      // If we found a good number of ingredients, we can break the loop
      if (ingredients.size > 5) break;
    }

    // If still no ingredients found, try looking for any list items within ingredient sections
    if (ingredients.size === 0) {
      console.log('🔍 Looking for ingredients in sections...');
      // Look for sections that might contain ingredients
      const sectionPatterns = [
        /<(?:div|section)[^>]*>(?:.*?ingredients?.*?)<\/(?:div|section)>/gi,
        /<(?:div|section|ul)[^>]*class="[^"]*(?:ingredient|ingredients)[^"]*"[^>]*>[\s\S]*?<\/(?:div|section|ul)>/gi
      ];
      
      for (const sectionPattern of sectionPatterns) {
        const sections = html.match(sectionPattern);
        if (sections) {
          console.log(`📑 Found ${sections.length} potential ingredient sections`);
          sections.forEach(section => {
            // Look for list items within the section
            const items = section.match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
            if (items) {
              console.log(`📋 Found ${items.length} list items in section`);
              items.forEach(item => {
                const ingredient = cleanText(item);
                if (ingredient) {
                  ingredients.add(ingredient);
                }
              });
            }
            
            // If there are no list items, try looking for other patterns within the section
            if (ingredients.size === 0) {
              const innerItems = section.match(/<(?:div|span|p)[^>]*>([\s\S]*?)<\/(?:div|span|p)>/gi);
              if (innerItems) {
                console.log(`📄 Found ${innerItems.length} text elements in section`);
                innerItems.forEach(item => {
                  const text = cleanText(item);
                  // Only add it if it looks like an ingredient (not too long, not too short)
                  if (text && text.length > 3 && text.length < 100) {
                    ingredients.add(text);
                  }
                });
              }
            }
          });
        }
        
        // If we found ingredients, we can break the loop
        if (ingredients.size > 0) break;
      }
    }
  }

  // If we still couldn't find ingredients, try a last-ditch effort with common patterns
  if (ingredients.size === 0) {
    console.log('⚠️ Using fallback ingredient extraction methods');
    // Look for any text content that might be an ingredient list
    const plainTextIngredients = html.match(/ingredients:?\s*([\s\S]*?)(?:preparation|instructions|directions|method|steps|$/i);
    if (plainTextIngredients && plainTextIngredients[1]) {
      const lines = plainTextIngredients[1].split(/\n|\r|\<br\>|\<\/p\>/).map(line => cleanText(line)).filter(Boolean);
      lines.forEach(line => {
        // Only add lines that look like ingredients (not headers, not too short)
        if (line && line.length > 5 && line.length < 100 && !line.match(/^(ingredients|preparation|instructions|directions|method|steps)$/i)) {
          ingredients.add(line);
        }
      });
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
  console.log('📝 Extracting instructions from HTML...');
  
  // Try Schema.org Recipe markup first
  try {
    const jsonLdMatches = html.match(/<script type="application\/ld\+json">(.*?)<\/script>/gs);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        try {
          const jsonContent = match.replace(/<script type="application\/ld\+json">/, '').replace(/<\/script>/, '');
          const schema = JSON.parse(jsonContent);
          
          // Handle different schema formats
          let recipeData = null;
          
          // Direct recipe
          if (schema['@type'] === 'Recipe') {
            recipeData = schema;
          } 
          // Recipe in graph
          else if (Array.isArray(schema['@graph'])) {
            recipeData = schema['@graph'].find((item: any) => item['@type'] === 'Recipe');
          }
          // Recipe in context
          else if (schema.hasOwnProperty('@context') && schema.hasOwnProperty('recipeInstructions')) {
            recipeData = schema;
          }
          
          if (recipeData?.recipeInstructions) {
            console.log('📊 Found instructions in Schema.org data');
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
          console.log('⚠️ Error parsing Schema.org data for instructions:', e);
        }
      }
    }
  } catch (e) {
    console.log('⚠️ Error extracting Schema.org instructions data:', e);
  }

  // Try common instruction patterns
  const instructionBlocks: string[] = [];
  
  // Look for instruction containers
  const instructionPatterns = [
    /<(?:div|section)[^>]*class="[^"]*(?:instruction|instructions|steps|preparation|method)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    /<(?:div|section)[^>]*itemprop="recipeInstructions"[^>]*>([\s\S]*?)<\/(?:div|section)>/i,
    /<(?:ol|ul)[^>]*class="[^"]*(?:instruction|instructions|steps)[^"]*"[^>]*>([\s\S]*?)<\/(?:ol|ul)>/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match) {
      console.log(`🔍 Found instructions using pattern: ${pattern.toString().substring(0, 40)}...`);
      const content = match[1];
      
      // Try to find ordered lists first
      const orderedList = content.match(/<ol[^>]*>([\s\S]*?)<\/ol>/i);
      if (orderedList) {
        const steps = orderedList[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
        if (steps) {
          console.log(`📋 Found ${steps.length} instruction steps in ordered list`);
          steps.forEach((step, index) => {
            const cleanStep = cleanText(step);
            if (cleanStep) {
              instructionBlocks.push(`${index + 1}. ${cleanStep}`);
            }
          });
        }
      } else {
        // Try unordered lists if no ordered list is found
        const unorderedList = content.match(/<ul[^>]*>([\s\S]*?)<\/ul>/i);
        if (unorderedList) {
          const steps = unorderedList[1].match(/<li[^>]*>([\s\S]*?)<\/li>/gi);
          if (steps) {
            console.log(`📋 Found ${steps.length} instruction steps in unordered list`);
            steps.forEach((step, index) => {
              const cleanStep = cleanText(step);
              if (cleanStep) {
                instructionBlocks.push(`${index + 1}. ${cleanStep}`);
              }
            });
          }
        } else {
          // Try paragraphs if no list is found
          const paragraphs = content.match(/<p[^>]*>([\s\S]*?)<\/p>/gi);
          if (paragraphs) {
            console.log(`📝 Found ${paragraphs.length} instruction paragraphs`);
            paragraphs.forEach((para, index) => {
              const cleanPara = cleanText(para);
              if (cleanPara) {
                instructionBlocks.push(`${index + 1}. ${cleanPara}`);
              }
            });
          } else {
            // Try divs as a last resort
            const divs = content.match(/<div[^>]*>([\s\S]*?)<\/div>/gi);
            if (divs) {
              console.log(`📑 Found ${divs.length} instruction divs`);
              divs.forEach((div, index) => {
                const cleanDiv = cleanText(div);
                if (cleanDiv && cleanDiv.length > 10) {  // Only use divs with substantial content
                  instructionBlocks.push(`${index + 1}. ${cleanDiv}`);
                }
              });
            }
          }
        }
      }
      
      if (instructionBlocks.length > 0) break;
    }
  }

  // If no structured content is found, try to find any text content in the instruction section
  if (instructionBlocks.length === 0) {
    console.log('⚠️ Using fallback instruction extraction methods');
    const instructionSection = html.match(/<div[^>]*>[\s\S]*?(?:instructions?|directions|method|steps)[\s\S]*?<\/div>/i);
    if (instructionSection) {
      const cleanInstructions = cleanText(instructionSection[0]);
      if (cleanInstructions) {
        // Split by periods and create numbered steps
        const steps = cleanInstructions.split(/\.(?=\s|$)/).filter(Boolean);
        steps.forEach((step, index) => {
          const cleanStep = cleanText(step);
          if (cleanStep && cleanStep.length > 10) {  // Only use steps with substantial content
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
