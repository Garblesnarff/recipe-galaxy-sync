
import { cleanText } from "./html-utils.ts";
import { getMetaContent } from "./recipe-extractor.ts";

export function extractMetadata(html: string, url: string, domain: string) {
  // Extract title with fallback to meta-tags if heading parsing fails
  let title = cleanText(html.match(/<h1[^>]*>([^<]+)<\/h1>/i)?.[1] || '');
  if (!title) {
    title = getMetaContent(html, 'og:title') || 
            getMetaContent(html, 'title') || 
            `${domain} Recipe`;
  }
  
  // Extract image URL
  const imageUrl = getMetaContent(html, 'og:image') || 
                  getMetaContent(html, 'twitter:image') ||
                  html.match(/<meta\s+property=['"]og:image['"] content=['"](https?:\/\/[^'"]+)['"]/i)?.[1];
  
  // Extract description
  const description = getMetaContent(html, 'og:description') || 
                     getMetaContent(html, 'description') ||
                     '';

  // Extract cook time (if available)
  let cookTime;
  const timeMatch = html.match(/cook[^\d]*(\d+)[\s-]*min/i);
  if (timeMatch) {
    cookTime = `${timeMatch[1]} minutes`;
  }
  
  return {
    title,
    description,
    image_url: imageUrl,
    source_url: url,
    ...(cookTime && { cook_time: cookTime })
  };
}

