
import { cleanText } from "./html-utils.ts";
import { getMetaContent } from "./recipe-extractor.ts";
import { extractStructuredRecipeData } from "./structured-data-extractor.ts";

export function extractMetadata(html: string, url: string, domain: string) {
  // First try to get metadata from structured data
  const structuredData = extractStructuredRecipeData(html);
  console.log('Structured data found:', !!structuredData);
  
  let title = '';
  let description = '';
  let imageUrl;
  let cookTime;
  
  // Try to get data from structured data first
  if (structuredData) {
    console.log('Extracting metadata from structured data');
    title = structuredData.name || '';
    description = structuredData.description || '';
    imageUrl = structuredData.image?.[0] || structuredData.image || '';
    cookTime = structuredData.cookTime || structuredData.totalTime;
  }
  
  // If no title from structured data, try other methods
  if (!title) {
    console.log('No title in structured data, trying other methods');
    
    // Look for recipe title in schema markup first
    const schemaTitle = html.match(/<[^>]+itemprop="name"[^>]*>([^<]+)<\/[^>]+>/i)?.[1];
    if (schemaTitle) {
      console.log('Found title in schema markup');
      title = cleanText(schemaTitle);
    }
    
    // Then try h1 tags
    if (!title) {
      const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
      if (h1Match) {
        const potentialTitle = cleanText(h1Match[1]);
        // Avoid using author names or website names as titles
        if (!potentialTitle.toLowerCase().includes('recipe') && 
            !potentialTitle.toLowerCase().includes('home') &&
            !potentialTitle.toLowerCase().includes('welcome') &&
            !domain.toLowerCase().includes(potentialTitle.toLowerCase())) {
          console.log('Found title in h1 tag');
          title = potentialTitle;
        }
      }
    }
    
    // Finally try meta tags
    if (!title) {
      console.log('Trying meta tags for title');
      title = getMetaContent(html, 'og:title') || 
              getMetaContent(html, 'title') ||
              `Recipe from ${domain}`;
    }
  }

  // If no description from structured data, try meta tags
  if (!description) {
    description = getMetaContent(html, 'og:description') || 
                 getMetaContent(html, 'description') ||
                 '';
  }

  // If no image from structured data, try meta tags
  if (!imageUrl) {
    imageUrl = getMetaContent(html, 'og:image') || 
               getMetaContent(html, 'twitter:image') ||
               html.match(/<meta\s+property=['"]og:image['"] content=['"](https?:\/\/[^'"]+)['"]/i)?.[1];
  }

  // Clean up the title
  if (title) {
    // Remove common website names from titles
    title = title
      .replace(/\s*[-|]\s*(?:Food Network|Pioneer Woman|AllRecipes|Epicurious|Bon Appétit|NYT Cooking).*$/i, '')
      .replace(/^(?:Food Network|Pioneer Woman|AllRecipes|Epicurious|Bon Appétit|NYT Cooking)\s*[-|]\s*/i, '')
      .trim();
  }

  console.log('Extracted metadata:', { 
    title, 
    hasDescription: !!description, 
    hasImage: !!imageUrl, 
    hasCookTime: !!cookTime 
  });

  return {
    title,
    description,
    image_url: imageUrl,
    source_url: url,
    ...(cookTime && { cook_time: cookTime })
  };
}
