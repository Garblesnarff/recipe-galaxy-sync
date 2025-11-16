/**
 * Spotify Web Playback SDK
 * Browser-based playback for Spotify Premium users
 */

const SPOTIFY_CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || '';

declare global {
  interface Window {
    Spotify: any;
    onSpotifyWebPlaybackSDKReady: () => void;
  }
}

export interface SpotifyPlayer {
  addListener(event: string, callback: (data: any) => void): void;
  removeListener(event: string, callback?: (data: any) => void): void;
  connect(): Promise<boolean>;
  disconnect(): void;
  getCurrentState(): Promise<any>;
  setName(name: string): Promise<void>;
  getVolume(): Promise<number>;
  setVolume(volume: number): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  togglePlay(): Promise<void>;
  seek(positionMs: number): Promise<void>;
  previousTrack(): Promise<void>;
  nextTrack(): Promise<void>;
  activateElement(): Promise<void>;
}

let playerInstance: SpotifyPlayer | null = null;
let sdkReady = false;

/**
 * Load Spotify Web Playback SDK script
 */
export function loadSpotifySDK(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.Spotify) {
      sdkReady = true;
      resolve();
      return;
    }

    // Check if script is already in DOM
    if (document.querySelector('script[src*="spotify-player"]')) {
      resolve();
      return;
    }

    window.onSpotifyWebPlaybackSDKReady = () => {
      sdkReady = true;
      resolve();
    };

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    script.onerror = () => reject(new Error('Failed to load Spotify Web Playback SDK'));

    document.head.appendChild(script);
  });
}

/**
 * Initialize Spotify Web Playback SDK player
 */
export async function initializePlayer(
  accessToken: string,
  deviceName = 'WorkoutApp Web Player'
): Promise<SpotifyPlayer> {
  if (!sdkReady) {
    await loadSpotifySDK();
  }

  return new Promise((resolve, reject) => {
    const player = new window.Spotify.Player({
      name: deviceName,
      getOAuthToken: (cb: (token: string) => void) => {
        cb(accessToken);
      },
      volume: 0.7,
    });

    // Error handling
    player.addListener('initialization_error', ({ message }: { message: string }) => {
      console.error('Initialization Error:', message);
      reject(new Error(message));
    });

    player.addListener('authentication_error', ({ message }: { message: string }) => {
      console.error('Authentication Error:', message);
      reject(new Error(message));
    });

    player.addListener('account_error', ({ message }: { message: string }) => {
      console.error('Account Error:', message);
      reject(new Error('Spotify Premium required for Web Playback'));
    });

    player.addListener('playback_error', ({ message }: { message: string }) => {
      console.error('Playback Error:', message);
    });

    // Ready
    player.addListener('ready', ({ device_id }: { device_id: string }) => {
      console.log('Spotify Web Player ready with Device ID:', device_id);
      playerInstance = player;
      resolve(player);
    });

    // Not Ready
    player.addListener('not_ready', ({ device_id }: { device_id: string }) => {
      console.log('Device has gone offline:', device_id);
    });

    // Connect to the player
    player.connect().then((success: boolean) => {
      if (!success) {
        reject(new Error('Failed to connect to Spotify Web Player'));
      }
    });
  });
}

/**
 * Get the current player instance
 */
export function getPlayerInstance(): SpotifyPlayer | null {
  return playerInstance;
}

/**
 * Disconnect and cleanup player
 */
export function disconnectPlayer(): void {
  if (playerInstance) {
    playerInstance.disconnect();
    playerInstance = null;
  }
}

/**
 * Get device ID of current player
 */
export async function getDeviceId(): Promise<string | null> {
  if (!playerInstance) {
    return null;
  }

  return new Promise((resolve) => {
    const listener = ({ device_id }: { device_id: string }) => {
      resolve(device_id);
      playerInstance?.removeListener('ready', listener);
    };

    playerInstance.addListener('ready', listener);
  });
}

/**
 * Check if user has Spotify Premium (required for Web Playback)
 */
export async function checkPremiumStatus(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.spotify.com/v1/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.product === 'premium';
  } catch (error) {
    console.error('Failed to check premium status:', error);
    return false;
  }
}

/**
 * Player state manager
 */
export class PlayerStateManager {
  private player: SpotifyPlayer;
  private listeners: Map<string, Set<(state: any) => void>> = new Map();

  constructor(player: SpotifyPlayer) {
    this.player = player;
    this.setupListeners();
  }

  private setupListeners() {
    // Player state changed
    this.player.addListener('player_state_changed', (state: any) => {
      this.emit('state_change', state);
    });
  }

  on(event: string, callback: (state: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)?.add(callback);
  }

  off(event: string, callback: (state: any) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  async getState() {
    return await this.player.getCurrentState();
  }

  destroy() {
    this.listeners.clear();
  }
}
