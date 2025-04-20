
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
                // Process image if it exists
                processImageData(recipeData);
                return recipeData;
              }
            }
            
            // Handle single recipe object
            if (jsonData['@type'] === 'Recipe' || 
               (Array.isArray(jsonData['@type']) && jsonData['@type'].includes('Recipe'))) {
              console.log('Found single recipe structured data');
              // Process image if it exists
              processImageData(jsonData);
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
                // Process image if it exists
                processImageData(recipeNode);
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
      const name = nameMatch ? nameMatch[1].trim() : undefined;
      
      // Extract image from microdata
      const imageMatch = html.match(/<[^>]+itemprop="image"[^>]*content="([^"]+)"/i) ||
                         html.match(/<[^>]+itemprop="image"[^>]*src="([^"]+)"/i);
      const image = imageMatch ? imageMatch[1] : undefined;
      
      return { name, image };
    }

    console.log('No structured recipe data found');
    return undefined;
  } catch (error) {
    console.error('Error extracting structured recipe data:', error);
    return undefined;
  }
}

/**
 * Helper function to process and normalize image data in structured recipe data
 */
function processImageData(recipeData: any) {
  if (!recipeData.image) return;
  
  try {
    // Log the type of image data we received
    console.log('Processing image data of type:', typeof recipeData.image);
    
    // If image is already a string, nothing needs to be done
    if (typeof recipeData.image === 'string') {
      console.log('Image is already a string');
      return;
    }
    
    // If image is an array, extract the first URL
    if (Array.isArray(recipeData.image)) {
      console.log('Image is an array with length:', recipeData.image.length);
      
      if (recipeData.image.length > 0) {
        if (typeof recipeData.image[0] === 'string') {
          recipeData.image = recipeData.image[0];
          console.log('Extracted string from image array');
        } else if (recipeData.image[0]?.url) {
          recipeData.image = recipeData.image[0].url;
          console.log('Extracted URL from first image object in array');
        }
      }
      return;
    }
    
    // If image is an object with a URL property
    if (typeof recipeData.image === 'object' && recipeData.image?.url) {
      console.log('Image is an object with URL property');
      recipeData.image = recipeData.image.url;
      return;
    }
    
    console.log('Could not process image data format:', 
                JSON.stringify(recipeData.image).substring(0, 100));
  } catch (error) {
    console.error('Error processing image data:', error);
  }
}
