
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
    .replace(/^[▢□■◆○◯✓✅⬜⬛☐☑︎☑️]/u, '') // Remove various box/bullet symbols
    .replace(/^\s*[-•*]\s*/, '') // Remove bullet points
    .trim();
}

/**
 * Utility function to fetch a URL with retry logic
 * @param url - The URL to fetch
 * @param retries - Number of retry attempts
 * @param signal - AbortSignal for fetch timeout
 * @returns The fetch response
 */
export async function fetchWithRetry(url: string, retries = 3, signal?: AbortSignal): Promise<Response> {
  let lastError;

  for (let i = 0; i < retries; i++) {
    try {
      // Add user agent to avoid being blocked by some sites
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        signal
      });
      
      if (response.ok) return response;
      
      console.error(`Attempt ${i + 1}: Failed to fetch URL with status ${response.status} ${response.statusText}`);
      lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`Attempt ${i + 1}: Error fetching URL:`, error);
      lastError = error;
      
      // If this is an abort error (timeout), don't retry
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching URL after ${30} seconds`);
      }
      
      if (i === retries - 1) throw error;
    }
    
    // Exponential backoff with a cap
    const delay = Math.min(1000 * Math.pow(2, i), 5000);
    console.log(`Retrying in ${delay}ms...`);
    await new Promise(r => setTimeout(r, delay));
  }
  
  throw lastError || new Error(`Failed to fetch URL after ${retries} attempts`);
}
