
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const groqApiKey = Deno.env.get('GROQ_API_KEY')
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(supabaseUrl, supabaseAnonKey)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  // Parse the request body
  const { recipe, restrictions } = await req.json()

  try {
    if (!recipe || !restrictions || restrictions.length === 0) {
      throw new Error('Recipe and dietary restrictions are required')
    }

    // Extract relevant information
    const { id, title, ingredients, instructions } = recipe
    
    // Ensure ingredients is an array
    const ingredientsArray = Array.isArray(ingredients) ? ingredients : []
    if (ingredientsArray.length === 0) {
      throw new Error('No ingredients found in recipe')
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

    console.log('Calling Groq API with model: deepseek-r1-distill-qwen-32b');
    
    // Call Groq API using OpenAI compatibility
    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${groqApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-r1-distill-qwen-32b',
        messages: [
          { role: 'system', content: 'You are a helpful assistant specialized in adapting recipes for dietary restrictions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    })

    if (!groqResponse.ok) {
      const error = await groqResponse.json()
      console.error('Groq API error details:', JSON.stringify(error));
      throw new Error(`Groq API error: ${JSON.stringify(error)}`)
    }

    const responseData = await groqResponse.json()
    console.log('Groq API response received');
    const responseContent = responseData.choices[0].message.content

    // Parse the JSON response from Groq
    let adaptedRecipe
    try {
      // Find the JSON part in the response (in case LLM adds extra text)
      const jsonMatch = responseContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        adaptedRecipe = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not find valid JSON in the response')
      }
    } catch (e) {
      console.error('Error parsing Groq response:', e)
      console.log('Raw response:', responseContent)
      throw new Error('Failed to parse the adapted recipe')
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
    )
  } catch (error) {
    console.error('Error adapting recipe:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
