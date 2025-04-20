
import { extractStructuredRecipeData } from "./structured-data-extractor.ts";

/**
 * Filters out common ad and navigation content
 */
function filterNonInstructionContent(text: string): string {
  return text
    .replace(/(?:advertisement|sponsored content|ad).*$/gim, '')
    .replace(/(?:click|tap|jump|scroll).*?(?:below|above|here|now)/gi, '')
    .replace(/(?:sign up|subscribe).*?(?:newsletter|updates)/gi, '')
    .replace(/(?:follow|like|share).*?(?:facebook|twitter|instagram|pinterest)/gi, '')
    .replace(/(?:you may also like|related recipes|more recipes|try these next)/gi, '')
    .replace(/©.*?all rights reserved/gi, '')
    .trim();
}

/**
 * Extracts cooking instructions from HTML
 */
export function extractInstructions(html: string): string | undefined {
  // Try to get from structured data first
  const structuredData = extractStructuredRecipeData(html);
  if (structuredData?.recipeInstructions) {
    console.log('Extracting instructions from structured data');
    
    if (Array.isArray(structuredData.recipeInstructions)) {
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

  // Look for common instruction patterns
  const instructionPatterns = [
    /<h[2-4][^>]*>\s*(?:instructions|directions|method|steps|preparation)\s*<\/h[2-4]>([\s\S]*?)(?:<h[2-4]|<div[^>]*class=["'](?:footer|comments|tags)|$)/i,
    /<h[2-4][^>]*>\s*(?:instructions|directions|method|steps|preparation)\s*<\/h[2-4]>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i,
    /<div[^>]*(?:class|id)=["'][^"']*(?:instruction|direction|method|step|preparation)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i,
    /<[^>]*(?:class|id)=["'][^"']*(?:instruction|direction|method|step|preparation)[^"']*["'][^>]*>[\s\S]*?<ol[^>]*>([\s\S]*?)<\/ol>/i,
    /((?:<p[^>]*>\s*\d+\.[\s\S]*?<\/p>\s*){2,})/i
  ];

  for (const pattern of instructionPatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      console.log('Found instructions with pattern:', pattern);
      
      let instructions = match[1];
      instructions = instructions
        .replace(/<h[2-6][^>]*>[\s\S]*?<\/h[2-6]>/gi, '\n')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]*(?:ads|comment|widget|sidebar|footer|nav|share)[^>]*>[\s\S]*?<\/[^>]*>/gi, '')
        .replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, '• $1\n')
        .replace(/<\/(?:p|div|section|article|br)>/gi, '\n')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .split('\n')
        .map(line => filterNonInstructionContent(line.trim()))
        .filter(line => line.length > 0)
        .join('\n');
      
      return instructions;
    }
  }

  // Fallback to any ordered list
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

  // Last resort - paragraphs after instruction keywords
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
