
/**
 * Extracts structured recipe data from HTML
 */
export function extractStructuredRecipeData(html: string) {
  try {
    // Look for JSON-LD structured data
    const jsonLdMatches = html.match(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
    if (jsonLdMatches) {
      for (const match of jsonLdMatches) {
        const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
        if (contentMatch) {
          try {
            const jsonData = JSON.parse(contentMatch[1]);
            
            // Handle single recipe object
            if (jsonData['@type'] === 'Recipe') {
              console.log('Found structured recipe data (JSON-LD single)');
              return jsonData;
            }
            
            // Handle array of types that includes Recipe
            if (Array.isArray(jsonData['@type']) && jsonData['@type'].includes('Recipe')) {
              console.log('Found structured recipe data (JSON-LD with array type)');
              return jsonData;
            }
            
            // Handle @graph with recipe inside
            if (jsonData['@graph'] && Array.isArray(jsonData['@graph'])) {
              const recipeNode = jsonData['@graph'].find((item: any) => 
                item['@type'] === 'Recipe' || 
                (Array.isArray(item['@type']) && item['@type'].includes('Recipe'))
              );
              
              if (recipeNode) {
                console.log('Found structured recipe data (JSON-LD with @graph)');
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
      console.log('Found structured recipe data (microdata)');
    }

    return undefined;
  } catch (error) {
    console.error('Error extracting structured recipe data:', error);
    return undefined;
  }
}
