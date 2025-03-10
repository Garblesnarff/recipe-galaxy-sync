
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
            content: "You are a specialized recipe instruction parser. Extract and clean up cooking instructions from the given text. Remove any navigation elements, advertisements, metadata, social sharing buttons, and website headers/footers. Return only the actual cooking steps in a clear, numbered format."
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
