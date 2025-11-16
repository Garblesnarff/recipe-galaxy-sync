/**
 * Spotify OAuth 2.0 PKCE (Proof Key for Code Exchange) Flow
 * More secure for Single Page Applications
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_REDIRECT_URI = import.meta.env.VITE_SPOTIFY_REDIRECT_URI || 'http://localhost:5173/auth/spotify/callback';

// Required scopes for full music integration
const SCOPES = [
  'streaming',
  'user-read-email',
  'user-read-private',
  'user-read-playback-state',
  'user-modify-playback-state',
  'user-read-currently-playing',
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-library-read',
  'user-library-modify',
  'user-top-read',
].join(' ');

/**
 * Generate a random string for PKCE code verifier
 */
function generateRandomString(length: number): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.getRandomValues(new Uint8Array(length));
  return values.reduce((acc, x) => acc + possible[x % possible.length], '');
}

/**
 * Generate code challenge from verifier using SHA-256
 */
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return await crypto.subtle.digest('SHA-256', data);
}

/**
 * Base64 encode the hash
 */
function base64encode(input: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(input)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

/**
 * Initiate Spotify OAuth flow with PKCE
 * Returns the authorization URL to redirect the user to
 */
export async function initiateSpotifyAuth(): Promise<string> {
  const codeVerifier = generateRandomString(64);
  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64encode(hashed);

  // Store code verifier in localStorage for later use
  localStorage.setItem('spotify_code_verifier', codeVerifier);

  const authUrl = new URL('https://accounts.spotify.com/authorize');
  authUrl.searchParams.append('client_id', SPOTIFY_CLIENT_ID);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', SPOTIFY_REDIRECT_URI);
  authUrl.searchParams.append('scope', SCOPES);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  authUrl.searchParams.append('code_challenge', codeChallenge);

  return authUrl.toString();
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
}> {
  const codeVerifier = localStorage.getItem('spotify_code_verifier');

  if (!codeVerifier) {
    throw new Error('Code verifier not found');
  }

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: SPOTIFY_REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to exchange code for token: ${error.error_description || error.error}`);
  }

  const data = await response.json();

  // Clean up code verifier
  localStorage.removeItem('spotify_code_verifier');

  return data;
}

/**
 * Refresh the access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  token_type: string;
}> {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to refresh token: ${error.error_description || error.error}`);
  }

  return await response.json();
}

/**
 * Simple encryption for token storage
 * NOTE: In production, use proper encryption or store tokens server-side
 */
export function encryptToken(token: string): string {
  // This is a simple base64 encoding for demonstration
  // In production, use proper encryption (AES-256, etc.)
  return btoa(token);
}

/**
 * Simple decryption for token retrieval
 */
export function decryptToken(encryptedToken: string): string {
  try {
    return atob(encryptedToken);
  } catch (error) {
    console.error('Failed to decrypt token:', error);
    throw new Error('Invalid encrypted token');
  }
}
