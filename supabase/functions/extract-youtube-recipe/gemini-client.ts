
/**
 * Generates a recipe using Gemini API based on a YouTube video title and thumbnail
 * @param title - The video title
 * @param thumbnailUrl - The video thumbnail URL
 * @param apiKey - The Gemini API key
 * @returns The generated recipe data
 */
export async function generateRecipeFromVideo(title: string, thumbnailUrl: string, apiKey: string) {
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is required');
  }

  const prompt = `You are a professional chef. Create a detailed recipe based on this YouTube cooking video titled: "${title}".
    
  Format your response as a JSON object with these exact fields:
  {
    "title": "Recipe name",
    "description": "Brief overview",
    "ingredients": ["ingredient 1", "ingredient 2"],
    "instructions": "Step by step instructions",
    "cook_time": "Estimated time",
    "difficulty": "Easy/Medium/Hard",
    "image_url": "${thumbnailUrl}"
  }`;

  console.log('Sending prompt to Gemini');
  // Using gemini-2.0-flash model
  const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  console.log(`Making request to Gemini API at: ${geminiUrl.substring(0, geminiUrl.indexOf('?'))}...`);
  
  const geminiResponse = await fetch(geminiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }]
    })
  });

  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text();
    console.error(`Gemini API error (${geminiResponse.status}):`, errorText);
    throw new Error(`Failed to generate recipe with Gemini: ${geminiResponse.status} - ${errorText}`);
  }

  const geminiData = await geminiResponse.json();
  console.log('Received response from Gemini');
  
  if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
    console.error('Invalid response format from Gemini:', JSON.stringify(geminiData));
    throw new Error('Invalid response format from Gemini');
  }

  return geminiData.candidates[0].content.parts[0].text;
}

/**
 * Extracts JSON data from Gemini's text response
 * @param recipeText - The text response from Gemini
 * @returns The parsed recipe data
 */
export function parseRecipeJson(recipeText: string) {
  console.log('Generated recipe text preview:', recipeText.substring(0, 100) + '...');

  // Extract JSON from Gemini's response
  const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('Failed to parse recipe data - no JSON object found');
    throw new Error('Failed to parse recipe data');
  }

  try {
    const recipeData = JSON.parse(jsonMatch[0]);
    console.log('Successfully extracted recipe data:', JSON.stringify(recipeData));
    return recipeData;
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error('Failed to parse recipe JSON data');
  }
}
