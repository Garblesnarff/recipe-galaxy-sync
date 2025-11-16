/**
 * AI Client Library for Anthropic Claude API
 * Handles API communication, rate limiting, and error handling
 */

const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY;
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022';
const ANTHROPIC_VERSION = '2023-06-01';

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AnthropicRequest {
  model: string;
  max_tokens: number;
  messages: AnthropicMessage[];
  temperature?: number;
  system?: string;
}

export interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class AnthropicError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'AnthropicError';
  }
}

/**
 * Rate limiter to prevent API abuse
 */
class RateLimiter {
  private requests: number[] = [];
  private maxRequests = 10; // Max 10 requests
  private timeWindow = 60000; // Per minute

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.timeWindow);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getTimeUntilNextRequest(): number {
    if (this.canMakeRequest()) return 0;
    const oldestRequest = Math.min(...this.requests);
    return this.timeWindow - (Date.now() - oldestRequest);
  }
}

const rateLimiter = new RateLimiter();

/**
 * Makes a request to Anthropic Claude API
 */
export async function callAnthropicAPI(
  messages: AnthropicMessage[],
  systemPrompt?: string,
  temperature: number = 0.7,
  maxTokens: number = 4096
): Promise<string> {
  // Check API key
  if (!ANTHROPIC_API_KEY) {
    throw new AnthropicError(
      'Anthropic API key not configured. Please set VITE_ANTHROPIC_API_KEY environment variable.',
      500
    );
  }

  // Check rate limit
  if (!rateLimiter.canMakeRequest()) {
    const waitTime = Math.ceil(rateLimiter.getTimeUntilNextRequest() / 1000);
    throw new AnthropicError(
      `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
      429
    );
  }

  try {
    rateLimiter.recordRequest();

    const requestBody: AnthropicRequest = {
      model: ANTHROPIC_MODEL,
      max_tokens: maxTokens,
      messages,
      temperature,
    };

    if (systemPrompt) {
      requestBody.system = systemPrompt;
    }

    console.log('[AI] Calling Anthropic API with model:', ANTHROPIC_MODEL);

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI] Anthropic API error:', errorText);

      let errorMessage = 'Unknown error from Anthropic API';
      let errorDetails = null;

      try {
        const errorJson = JSON.parse(errorText);
        errorMessage = errorJson.error?.message || errorMessage;
        errorDetails = errorJson.error;
      } catch {
        errorMessage = errorText.substring(0, 200);
      }

      throw new AnthropicError(
        `Anthropic API error: ${errorMessage}`,
        response.status,
        errorDetails
      );
    }

    const data: AnthropicResponse = await response.json();
    console.log('[AI] Anthropic API response received, tokens used:', data.usage);

    // Extract the text content from the response
    const textContent = data.content.find(c => c.type === 'text');
    if (!textContent) {
      throw new AnthropicError('No text content in API response');
    }

    return textContent.text;
  } catch (error) {
    if (error instanceof AnthropicError) {
      throw error;
    }

    console.error('[AI] Unexpected error calling Anthropic API:', error);
    throw new AnthropicError(
      error instanceof Error ? error.message : 'Unexpected error calling AI service',
      500
    );
  }
}

/**
 * Generates a structured workout using Claude
 */
export async function generateWorkoutWithClaude(
  prompt: string,
  systemPrompt: string
): Promise<string> {
  const messages: AnthropicMessage[] = [
    {
      role: 'user',
      content: prompt,
    },
  ];

  return await callAnthropicAPI(messages, systemPrompt, 0.8, 4096);
}

/**
 * Validates that the AI response is valid JSON
 */
export function parseAIResponse<T>(responseText: string): T {
  try {
    // Try to find JSON in the response (in case AI adds extra text)
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return parsed as T;
  } catch (error) {
    console.error('[AI] Failed to parse AI response:', error);
    console.log('[AI] Raw response:', responseText.substring(0, 500));
    throw new AnthropicError(
      'Failed to parse AI response as JSON. The AI may have returned an invalid format.',
      500,
      { rawResponse: responseText.substring(0, 500) }
    );
  }
}

/**
 * Logs AI generation for debugging and analytics
 */
export function logAIGeneration(
  userId: string,
  prompt: string,
  response: string,
  success: boolean,
  error?: string
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    promptLength: prompt.length,
    responseLength: response.length,
    success,
    error,
    model: ANTHROPIC_MODEL,
  };

  console.log('[AI Generation Log]', logEntry);

  // In production, you might want to store this in a database
  // or send to an analytics service
}
