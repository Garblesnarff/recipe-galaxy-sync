
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

/**
 * Fallback scraping method via Firecrawl API v1
 * Returns a normalized recipe object on success, throws on failure
 */
export async function scrapeWithFirecrawl(url: string): Promise<any> {
  if (!FIRECRAWL_API_KEY) {
    throw new Error('Firecrawl API key not configured in environment');
  }

  console.log('🔥 Calling Firecrawl API for:', url);
  console.log('🔑 Using API key (first 10 chars):', FIRECRAWL_API_KEY.substring(0, 10) + '...');
  
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['extract'],
        extract: {
          prompt: `Extract recipe information and return as JSON with these exact fields:
          - title (string): Recipe name
          - ingredients (array of strings): List of ingredients with quantities  
          - instructions (string): Step-by-step cooking instructions
          - prep_time (string): Preparation time
          - cook_time (string): Cooking time  
          - servings (number): Number of servings
          - image_url (string): Main recipe image URL
          - description (string): Recipe description`,
          schema: {
            type: "object",
            properties: {
              title: { type: "string" },
              ingredients: { 
                type: "array", 
                items: { type: "string" } 
              },
              instructions: { type: "string" },
              prep_time: { type: "string" },
              cook_time: { type: "string" },
              servings: { type: "number" },
              image_url: { type: "string" },
              description: { type: "string" }
            }
          }
        }
      })
    });

    console.log('🌐 Firecrawl API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firecrawl API error details:', errorText);
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('✅ Firecrawl response received, data keys:', Object.keys(data));
    
    // Handle different response formats
    let extractedData = data.extract || data.data || data;
    
    if (!extractedData || typeof extractedData !== 'object') {
      console.log('⚠️ Unexpected Firecrawl response format:', data);
      throw new Error('Firecrawl returned unexpected response format');
    }
    
    console.log('🎉 Firecrawl extraction successful');
    return extractedData;
    
  } catch (fetchError) {
    console.error('❌ Firecrawl fetch error:', fetchError);
    throw new Error(`Firecrawl request failed: ${fetchError.message}`);
  }
}
