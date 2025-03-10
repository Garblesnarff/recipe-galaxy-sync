
import { extractVideoId, fetchVideoMetadata } from "./youtube-utils.ts";
import { generateRecipeFromVideo, parseRecipeJson } from "./gemini-client.ts";

// CORS headers for cross-origin requests
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Parses and validates the request body
 * @param req - The HTTP request
 * @returns The parsed request body
 */
export async function parseRequestBody(req: Request) {
  console.log("Processing extraction request");
  console.log(`Request method: ${req.method}`);
  console.log(`Content-Type: ${req.headers.get('content-type')}`);
  
  let requestBody;
  
  try {
    // Try to get body as JSON directly
    requestBody = await req.json();
    console.log('Successfully parsed request body directly:', JSON.stringify(requestBody));
  } catch (jsonError) {
    console.log('Could not parse request as JSON directly, trying text method');
    // If direct JSON parsing fails, try the text method
    try {
      const bodyText = await req.text();
      console.log('Raw request body length:', bodyText.length);
      console.log('Raw request body:', bodyText);
      
      // Check for empty request body
      if (!bodyText || bodyText.trim() === '') {
        console.error('Empty request body received');
        throw new Error('Empty request body');
      }
      
      requestBody = JSON.parse(bodyText);
      console.log('Parsed request body from text:', JSON.stringify(requestBody));
    } catch (textError) {
      console.error('Failed to get request body as text:', textError);
      throw new Error(`Failed to parse request body: ${textError.message}`);
    }
  }
  
  // Validate URL
  const { url } = requestBody;
  if (!url) {
    console.error('URL is missing from request body');
    throw new Error('URL is required');
  }
  console.log('Processing URL:', url);
  
  return requestBody;
}

/**
 * Processes a YouTube URL to extract a recipe
 * @param url - The YouTube URL
 * @param apiKey - The Gemini API key
 * @returns The extracted recipe data
 */
export async function processYoutubeUrl(url: string, apiKey: string) {
  // Extract video ID
  const videoId = extractVideoId(url);
  if (!videoId) {
    console.error('Invalid YouTube URL, could not extract video ID');
    throw new Error('Invalid YouTube URL');
  }
  console.log('Extracted video ID:', videoId);

  // Fetch video metadata
  const metadata = await fetchVideoMetadata(videoId);

  // Generate recipe using Gemini
  const recipeText = await generateRecipeFromVideo(metadata.title, metadata.thumbnail_url, apiKey);
  
  // Parse the recipe data
  return parseRecipeJson(recipeText);
}
