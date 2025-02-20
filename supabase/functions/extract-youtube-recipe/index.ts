
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

interface TranscriptSegment {
  text: string;
  start: number;
  duration: number;
}

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

const getTranscript = async (videoId: string): Promise<string> => {
  try {
    // Using innertube API for more reliable transcript access
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

    console.log('Found English captions URL:', englishCaptions.baseUrl);

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

    console.log(`Successfully extracted ${segments.length} transcript segments`);
    return segments.map(segment => segment.text).join(' ');
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw error;
  }
};

const parseRecipeWithGemini = async (transcript: string): Promise<any> => {
  try {
    console.log('Sending transcript to Gemini API, length:', transcript.length);
    
    const prompt = `Extract a detailed recipe from the following YouTube video transcript. 
    Provide the output in this exact structured format:
    {
      "title": "Recipe name",
      "description": "Brief overview of the dish",
      "ingredients": ["Ingredient 1 with quantity", "Ingredient 2 with quantity", ...],
      "instructions": ["Step 1", "Step 2", ...],
      "cook_time": "Estimated cooking time (if mentioned)",
      "difficulty": "Easy/Medium/Hard based on complexity"
    }

    If any field cannot be determined from the transcript, use an empty string or empty array as appropriate.
    Do not include any explanatory text, only output the JSON object.

    Transcript:
    ${transcript}`;

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
      const error = await response.text();
      console.error('Gemini API error:', error);
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const recipeText = data.candidates[0].content.parts[0].text;
    
    try {
      // Extract the JSON object from the response
      const jsonMatch = recipeText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      
      const recipe = JSON.parse(jsonMatch[0]);
      console.log('Successfully parsed recipe:', recipe);
      return recipe;
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
    if (!transcript) {
      throw new Error('Failed to extract transcript from video');
    }
    
    console.log('Successfully extracted transcript, length:', transcript.length);
    
    const recipe = await parseRecipeWithGemini(transcript);
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
