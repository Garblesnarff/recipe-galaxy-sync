
/**
 * Extracts structured recipe data from HTML
 */
export function extractStructuredRecipeData(html: string) {
  try {
    // Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    
    if (jsonLdMatches) {
      console.log('Found JSON-LD scripts:', jsonLdMatches.length);
      
      for (const match of jsonLdMatches) {
        const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch) {
          try {
            const jsonData = JSON.parse(contentMatch[1]);
            
            // Handle array of types that includes Recipe
            if (Array.isArray(jsonData) && jsonData.length > 0) {
              console.log('Found array of structured data');
              const recipeData = jsonData.find((item: any) => 
                item['@type'] === 'Recipe' || 
                (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
              );
              if (recipeData) {
                console.log('Found recipe in array of structured data');
                return recipeData;
              }
            }
            
            // Handle single recipe object
            if (jsonData['@type'] === 'Recipe' || 
               (Array.isArray(jsonData['@type']) && jsonData['@type'].includes('Recipe'))) {
              console.log('Found single recipe structured data');
              return jsonData;
            }
            
            // Handle @graph with recipe inside
            if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
              console.log('Found @graph structured data');
              const recipeNode = jsonData['@graph'].find((item: any) => 
                item['@type'] === 'Recipe' || 
                (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
              );
              
              if (recipeNode) {
                console.log('Found recipe in @graph');
                return recipeNode;
              }
            }
          } catch (parseError) {
            console.error('Error parsing JSON-LD:', parseError);
          }
        }
      }
    }

    // Look for microdata
    const microdataMatch = html.match(/<[^>]+itemtype=['"]http:\/\/schema.org\/Recipe['"][^>]*>([\s\S]*?)(?:<\/[^>]+>)/i);
    if (microdataMatch) {
      console.log('Found microdata recipe markup');
      // Extract name from microdata
      const nameMatch = html.match(/<[^>]+itemprop="name"[^>]*>([^<]+)<\/[^>]+>/i);
      if (nameMatch) {
        return { name: nameMatch[1].trim() };
      }
    }

    console.log('No structured recipe data found');
    return undefined;
  } catch (error) {
    console.error('Error extracting structured recipe data:', error);
    return undefined;
  }
}
