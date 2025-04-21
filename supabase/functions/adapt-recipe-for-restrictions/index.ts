
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const groqApiKey = Deno.env.get('GROQ_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

serve(async (req) => {
  console.log('Edge function called: adapt-recipe-for-restrictions');
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204 
    });
  }

  try {
    // Check for API key
    if (!groqApiKey) {
      console.error('GROQ_API_KEY environment variable is not set');
      return new Response(
        JSON.stringify({ error: 'GROQ API key not configured' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    // Parse the request body
    let requestData;
    try {
      requestData = await req.json();
      console.log('Request data received:', JSON.stringify({
        recipeId: requestData.recipe?.id,
        restrictions: requestData.restrictions
      }));
    } catch (e) {
      console.error('Failed to parse request JSON:', e);
      return new Response(
        JSON.stringify({ error: 'Invalid request format', details: e.message }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    const { recipe, restrictions } = requestData;
    
    // Validate required parameters
    if (!recipe) {
      console.error('Missing recipe data');
      return new Response(
        JSON.stringify({ error: 'Recipe data is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    if (!restrictions || !Array.isArray(restrictions) || restrictions.length === 0) {
      console.error('Missing or invalid restrictions:', restrictions);
      return new Response(
        JSON.stringify({ error: 'Valid dietary restrictions array is required' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Extract relevant information
    const { id, title, ingredients, instructions } = recipe;
    
    // Validate recipe content
    if (!id || !title) {
      console.error('Invalid recipe data - missing id or title');
      return new Response(
        JSON.stringify({ error: 'Recipe must contain id and title' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }
    
    // Ensure ingredients is an array
    const ingredientsArray = Array.isArray(ingredients) ? ingredients : [];
    if (ingredientsArray.length === 0) {
      console.error('No ingredients found in recipe');
      return new Response(
        JSON.stringify({ error: 'No ingredients found in recipe' }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      );
    }

    // Build prompt for Groq LLM
    const prompt = `
You are a specialized chef AI that adapts recipes to meet specific dietary restrictions.

RECIPE TITLE: ${title}
INGREDIENTS:
${ingredientsArray.join('\n')}

INSTRUCTIONS:
${instructions}

DIETARY RESTRICTIONS: ${restrictions.join(', ')}

Please modify this recipe to meet the dietary restrictions. For each substitution, explain why the original ingredient doesn't meet the restrictions and why your proposed substitute is appropriate.

Provide your response in the following JSON format:
{
  "title": "Modified recipe title",
  "ingredients": ["list", "of", "modified", "ingredients"],
  "instructions": "Modified cooking instructions",
  "substitutions": [
    {
      "original": "Original ingredient",
      "substitute": "Substitute ingredient",
      "reason": "Explanation for the substitution"
    }
  ]
}
`

    const modelToUse = 'mixtral-8x7b-32768';
    console.log(`Using Groq model: ${modelToUse}`);
    
    // Call Groq API using OpenAI compatibility with more detailed error handling
    let groqResponse;
    try {
      console.log('Sending request to Groq API');
      groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${groqApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [
            { role: 'system', content: 'You are a helpful assistant specialized in adapting recipes for dietary restrictions.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
        }),
      });
      
      console.log(`Groq API response status: ${groqResponse.status}`);
      
      if (!groqResponse.ok) {
        const errorText = await groqResponse.text();
        console.error(`Groq API error (${groqResponse.status}):`, errorText);
        
        // Try to parse error as JSON
        try {
          const errorJson = JSON.parse(errorText);
          const errorMessage = errorJson.error?.message || 'Unknown Groq API error';
          console.error('Parsed error message:', errorMessage);
          
          return new Response(
            JSON.stringify({ error: `Groq API error: ${errorMessage}` }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 502, // Gateway error
            }
          );
        } catch (e) {
          // If can't parse as JSON, return the raw text
          return new Response(
            JSON.stringify({ error: `Groq API error: ${errorText.substring(0, 200)}...` }),
            { 
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              status: 502,
            }
          );
        }
      }
    } catch (fetchError) {
      console.error('Network error calling Groq API:', fetchError);
      return new Response(
        JSON.stringify({ error: `Network error: ${fetchError.message}` }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    const responseData = await groqResponse.json();
    console.log('Groq API response received');
    const responseContent = responseData.choices[0].message.content;

    // Parse the JSON response from Groq
    let adaptedRecipe;
    try {
      // Find the JSON part in the response (in case LLM adds extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        adaptedRecipe = JSON.parse(jsonMatch[0]);
        console.log('Successfully parsed adapted recipe response');
      } else {
        console.error('Could not find valid JSON in the response');
        console.log('Raw response content:', responseContent);
        throw new Error('Could not find valid JSON in the response');
      }
    } catch (e) {
      console.error('Error parsing Groq response:', e);
      console.log('Raw response:', responseContent.substring(0, 200) + '...');
      return new Response(
        JSON.stringify({
          error: 'Failed to parse the adapted recipe',
          rawResponse: responseContent.substring(0, 500) + '...'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({
        id,
        ...adaptedRecipe,
        originalTitle: title,
        originalIngredients: ingredientsArray,
        originalInstructions: instructions,
        adaptedFor: restrictions
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Unexpected error adapting recipe:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
})
