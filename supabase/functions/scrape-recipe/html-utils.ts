
// HTML entity decoding and text cleaning utilities

// Map of HTML entities to their decoded representations
export const htmlEntities: { [key: string]: string } = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#32;': ' ',
  '&#160;': ' ',
  '&#8217;': "'",
  '&#8216;': "'",
  '&#8220;': '"',
  '&#8221;': '"',
  '&#8211;': '-',
  '&#8212;': '--',
  '&#x25a2;': '□', // Checkbox character
  '□': '□', // Ensuring checkbox is preserved if already decoded
};

/**
 * Decodes HTML entities in a text string
 * @param text - The text containing HTML entities
 * @returns The decoded text
 */
export function decodeHtmlEntities(text: string): string {
  if (!text) return '';
  
  // First handle numeric entities
  let decoded = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  
  // Then handle hex entities
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  
  // Finally handle named entities
  return decoded.replace(/&[#\w]+;/g, entity => htmlEntities[entity] || entity);
}

/**
 * Cleans text by removing HTML tags, normalizing whitespace, and decoding HTML entities
 * @param text - The text to clean
 * @returns The cleaned text
 */
export function cleanText(text: string): string {
  if (!text) return '';
  
  return decodeHtmlEntities(text)
    .replace(/<[^>]+>/g, ' ')  // Remove HTML tags
    .replace(/\s+/g, ' ')      // Normalize whitespace
    .replace(/\n\s*/g, '\n')   // Clean up newlines
    .trim();
}

/**
 * Utility function to fetch a URL with retry logic
 * @param url - The URL to fetch
 * @param retries - Number of retry attempts
 * @returns The fetch response
 */
export async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) return response;
      console.error(`Attempt ${i + 1}: Failed to fetch URL with status ${response.status}`);
    } catch (error) {
      console.error(`Attempt ${i + 1}: Error fetching URL:`, error);
      if (i === retries - 1) throw error;
    }
    await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
  }
  throw new Error(`Failed to fetch URL after ${retries} attempts`);
}
