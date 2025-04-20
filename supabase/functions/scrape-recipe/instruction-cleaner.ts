
/**
 * Cleans and formats instructions using the Groq LLM API
 * @param instructions - The raw instructions to clean
 * @param apiKey - The Groq API key
 * @returns The cleaned instructions
 */
export async function cleanInstructions(instructions: string, apiKey: string) {
  if (!instructions.trim()) {
    return "No instructions were found for this recipe.";
  }

  try {
    console.log('Cleaning instructions with Groq LLM...');
    
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a specialized recipe instruction parser. Your task is to:
            1. Extract ONLY the actual cooking steps from the given text
            2. Remove all advertisements, navigation elements, user comments, website headers/footers
            3. Remove any related recipe links, social media buttons, or other non-instruction content
            4. Format the instructions as clear, numbered steps
            5. Delete any duplicated instructions
            6. Remove any promotional content or unrelated text
            
            Return ONLY the cleaned cooking instructions formatted in clear, numbered steps.`
          },
          {
            role: "user",
            content: `Clean and format these recipe instructions, keeping only the actual cooking steps:\n\n${instructions}`
          }
        ],
        temperature: 0.1 // Low temperature for more deterministic output
      })
    });

    const data = await response.json();
    console.log('Successfully cleaned instructions with Groq');
    if (data.choices && data.choices.length > 0 && data.choices[0].message) {
      return data.choices[0].message.content;
    } else {
      console.error('Unexpected Groq API response format:', data);
      return instructions; // Return original if response format is unexpected
    }
  } catch (error) {
    console.error('Error cleaning instructions with Groq:', error);
    // Return original instructions if cleaning fails
    return instructions;
  }
}
