
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
 * @param headers - Custom headers to send with request
 * @param isProblemSite - Flag for sites known to have anti-scraping measures
 * @returns The fetch response
 */
export async function fetchWithRetry(
  url: string, 
  retries = 3, 
  signal?: AbortSignal,
  customHeaders?: Record<string, string>,
  isProblemSite = false
): Promise<Response> {
  let lastError;
  
  // Default headers with good browser simulation
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    ...customHeaders
  };

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Fetch attempt ${i + 1} for ${url}`);
      
      let fetchOptions: RequestInit = {
        headers,
        signal,
        redirect: 'follow',
      };
      
      // For problematic sites, we might want different strategies
      if (isProblemSite) {
        // Add a random delay before fetching to seem more like a human
        const randomDelay = Math.floor(Math.random() * 1000) + 500;
        await new Promise(r => setTimeout(r, randomDelay));
        
        // Modify fetch options for problematic sites
        fetchOptions = {
          ...fetchOptions,
          cache: 'no-store',
          credentials: 'omit',
        };
      }
      
      const response = await fetch(url, fetchOptions);
      
      // Log response details for debugging
      console.log(`📊 Response status: ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
      
      // Check for redirects that might indicate anti-bot measures
      const finalUrl = response.url;
      if (finalUrl !== url) {
        console.log(`🔀 Redirected to: ${finalUrl}`);
      }
      
      if (response.ok) {
        // Check content type to ensure we got HTML
        const contentType = response.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
          console.warn(`⚠️ Response is not HTML: ${contentType}`);
        }
        return response;
      }
      
      console.error(`❌ Attempt ${i + 1}: Failed to fetch URL with status ${response.status} ${response.statusText}`);
      lastError = new Error(`HTTP error ${response.status}: ${response.statusText}`);
    } catch (error) {
      console.error(`❌ Attempt ${i + 1}: Error fetching URL:`, error);
      lastError = error;
      
      // If this is an abort error (timeout), don't retry
      if (error.name === 'AbortError') {
        throw new Error(`Timeout fetching URL after ${isProblemSite ? 20 : 30} seconds`);
      }
      
      if (i === retries - 1) throw error;
    }
    
    // Exponential backoff with a cap and some randomness
    const baseDelay = Math.min(1000 * Math.pow(2, i), 5000);
    const jitter = Math.random() * 1000;
    const delay = baseDelay + jitter;
    console.log(`⏱️ Retrying in ${Math.round(delay)}ms...`);
    await new Promise(r => setTimeout(r, delay));
  }
  
  throw lastError || new Error(`Failed to fetch URL after ${retries} attempts`);
}
