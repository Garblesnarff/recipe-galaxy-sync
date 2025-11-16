/**
 * OAuth Helper Functions
 *
 * Utilities for handling OAuth flows with various health platforms
 */

/**
 * Generate a random state parameter for OAuth
 */
export function generateOAuthState(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

/**
 * Validate OAuth state parameter
 */
export function validateOAuthState(receivedState: string): boolean {
  const storedState = sessionStorage.getItem('oauth_state');
  sessionStorage.removeItem('oauth_state');
  return storedState === receivedState;
}

/**
 * Store OAuth state for validation
 */
export function storeOAuthState(state: string): void {
  sessionStorage.setItem('oauth_state', state);
}

/**
 * Parse OAuth callback URL parameters
 */
export function parseOAuthCallback(url: string): {
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
} {
  const urlObj = new URL(url);
  const params = new URLSearchParams(urlObj.search);

  return {
    code: params.get('code') || undefined,
    state: params.get('state') || undefined,
    error: params.get('error') || undefined,
    error_description: params.get('error_description') || undefined,
  };
}

/**
 * Build OAuth authorization URL
 */
export function buildOAuthUrl(config: {
  authEndpoint: string;
  clientId: string;
  redirectUri: string;
  scopes: string[];
  state: string;
  additionalParams?: Record<string, string>;
}): string {
  const url = new URL(config.authEndpoint);

  url.searchParams.append('client_id', config.clientId);
  url.searchParams.append('redirect_uri', config.redirectUri);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', config.scopes.join(' '));
  url.searchParams.append('state', config.state);

  if (config.additionalParams) {
    Object.entries(config.additionalParams).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  return url.toString();
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return true;

  const expirationTime = new Date(expiresAt).getTime();
  const currentTime = Date.now();
  const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

  return expirationTime - bufferTime < currentTime;
}

/**
 * Simple encryption for storing tokens (not production-grade)
 * In production, use a proper encryption library and server-side storage
 */
export function encryptToken(token: string, key: string = 'default-key'): string {
  // This is a simple XOR "encryption" for demonstration purposes only
  // In production, use a proper encryption library
  const encrypted = btoa(
    token
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('')
  );
  return encrypted;
}

/**
 * Simple decryption for stored tokens (not production-grade)
 */
export function decryptToken(encryptedToken: string, key: string = 'default-key'): string {
  try {
    const decrypted = atob(encryptedToken)
      .split('')
      .map((char, i) => String.fromCharCode(char.charCodeAt(0) ^ key.charCodeAt(i % key.length)))
      .join('');
    return decrypted;
  } catch (error) {
    console.error('Error decrypting token:', error);
    return '';
  }
}

/**
 * Store tokens securely (in production, this should be server-side)
 */
export interface TokenData {
  accessToken: string;
  refreshToken?: string;
  expiresAt: string;
}

export function storeTokens(platform: string, tokens: TokenData): void {
  // In production, tokens should be stored server-side only
  // This is just for demonstration
  const key = `wearable_tokens_${platform}`;
  sessionStorage.setItem(key, JSON.stringify(tokens));
}

/**
 * Retrieve stored tokens
 */
export function getStoredTokens(platform: string): TokenData | null {
  const key = `wearable_tokens_${platform}`;
  const data = sessionStorage.getItem(key);

  if (!data) return null;

  try {
    return JSON.parse(data);
  } catch (error) {
    console.error('Error parsing stored tokens:', error);
    return null;
  }
}

/**
 * Clear stored tokens
 */
export function clearStoredTokens(platform: string): void {
  const key = `wearable_tokens_${platform}`;
  sessionStorage.removeItem(key);
}
