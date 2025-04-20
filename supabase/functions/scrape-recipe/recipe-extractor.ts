
import { extractStructuredRecipeData } from "./structured-data-extractor.ts";
import { extractIngredients } from "./ingredient-extractor.ts";
import { extractInstructions } from "./instruction-extractor.ts";

/**
 * Extracts the meta content from HTML
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

export { extractStructuredRecipeData, extractIngredients, extractInstructions };
