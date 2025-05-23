
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

/**
 * Fallback scraping method via Firecrawl API
 * Returns a normalized recipe object on success, throws on failure
 */
export async function scrapeWithFirecrawl(url: string) {
  if (!FIRECRAWL_API_KEY) {
    throw new Error("Firecrawl API key not configured");
  }

  console.log("🔥 Attempting Firecrawl fallback...");

  try {
    const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        extractorOptions: {
          mode: 'llm-extraction',
          extractionPrompt: `Extract recipe data and return as JSON:
{
  "title": "recipe name",
  "ingredients": ["ingredient 1", "ingredient 2"],
  "instructions": "step by step instructions",
  "prep_time": "preparation time",
  "cook_time": "cooking time", 
  "servings": number,
  "image_url": "main recipe image URL"
}`
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Firecrawl API error response:", errText);
      throw new Error(`Firecrawl API error: ${response.status}`);
    }

    const data = await response.json();
    console.log("Firecrawl API raw response:", data);

    // Firecrawl provides { success, data: { extract } }
    if (data.success && data.data?.extract) {
      // Normalize keys to our recipe structure
      const extract = data.data.extract;
      return {
        title: extract.title || "",
        ingredients: extract.ingredients || [],
        instructions: extract.instructions || "",
        prep_time: extract.prep_time || "",
        cook_time: extract.cook_time || "",
        servings: extract.servings || "",
        image_url: extract.image_url || "",
        source: "firecrawl"
      };
    }

    throw new Error("Firecrawl extraction failed or incomplete");
  } catch (error) {
    console.error("🔥 Firecrawl fallback failed:", error);
    throw error;
  }
}
