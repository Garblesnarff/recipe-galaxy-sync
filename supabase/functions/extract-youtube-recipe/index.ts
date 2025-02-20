
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type TranscriptSegment = {
  text: string;
  start: number;
  duration: number;
};

const extractVideoId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu.be\/)([^&\n?#]+)/,
    /youtube.com\/shorts\/([^&\n?#]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return null;
};

const getTranscript = async (videoId: string): Promise<TranscriptSegment[]> => {
  try {
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
    const html = await response.text();
    
    // Extract captions URL from the page
    const captionsMatch = html.match(/"captionTracks":\[(.*?)\]/);
    if (!captionsMatch) throw new Error("No captions found for this video");

    const captions = JSON.parse(`[${captionsMatch[1]}]`);
    const englishCaptions = captions.find((c: any) => 
      c.languageCode === "en" || c.languageCode === "en-US" || c.languageCode === "en-GB"
    );

    if (!englishCaptions?.baseUrl) {
      throw new Error("No English captions available");
    }

    // Fetch the actual transcript
    const transcriptResponse = await fetch(englishCaptions.baseUrl);
    const transcriptXml = await transcriptResponse.text();
    
    // Parse the XML to get transcript segments
    const segments: TranscriptSegment[] = [];
    const textElements = transcriptXml.match(/<text[^>]*>(.*?)<\/text>/g) || [];
    
    textElements.forEach(element => {
      const startMatch = element.match(/start="([\d.]+)"/);
      const durationMatch = element.match(/dur="([\d.]+)"/);
      const textMatch = element.match(/>([^<]*)</);
      
      if (startMatch && durationMatch && textMatch) {
        segments.push({
          text: textMatch[1].trim(),
          start: parseFloat(startMatch[1]),
          duration: parseFloat(durationMatch[1])
        });
      }
    });

    return segments;
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error(`Failed to get transcript: ${error.message}`);
  }
};

const parseRecipeWithGemini = async (transcript: string): Promise<any> => {
  const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
  if (!GEMINI_API_KEY) throw new Error('Gemini API key not configured');

  const prompt = `You are a recipe parser. Given the following YouTube video transcript, extract and structure a recipe. Focus on identifying:
  1. Recipe title
  2. Description (brief overview)
  3. Ingredients (as a list)
  4. Instructions (step by step)
  5. Approximate cooking time
  6. Difficulty level (Easy/Medium/Hard)

  If you can't identify all components, include what you can find. Format the response as JSON.

  Transcript:
  ${transcript}`;

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const recipeText = data.candidates[0].content.parts[0].text;
    
    try {
      // Extract the JSON object from the response
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const recipe = JSON.parse(jsonMatch[0]);
      return {
        title: recipe.title || '',
        description: recipe.description || '',
        cook_time: recipe.cooking_time || '',
        difficulty: recipe.difficulty || 'Medium',
        instructions: recipe.instructions || '',
        ingredients: Array.isArray(recipe.ingredients) ? recipe.ingredients : [],
      };
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError);
      throw new Error('Failed to parse recipe from Gemini response');
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    throw error;
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    console.log('Processing YouTube URL:', url);

    const videoId = extractVideoId(url);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    const transcript = await getTranscript(videoId);
    const fullTranscript = transcript.map(segment => segment.text).join(' ');
    
    console.log('Got transcript, length:', fullTranscript.length);
    
    const recipe = await parseRecipeWithGemini(fullTranscript);
    console.log('Successfully parsed recipe');

    return new Response(JSON.stringify(recipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in extract-youtube-recipe function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
