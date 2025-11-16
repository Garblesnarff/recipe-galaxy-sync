import { SOUND_EFFECTS, SoundEffectKey } from '@/config/audio';
import { preloadAudio, playBeep } from '@/utils/audioUtils';

export class SoundEffectsService {
  private sounds: Map<string, HTMLAudioElement> = new Map();
  private globalVolume: number = 0.7;
  private isEnabled: boolean = true;

  constructor() {
    // Preload all sound effects on initialization
    this.preloadAllSounds();
  }

  /**
   * Preload all configured sound effects
   */
  private async preloadAllSounds(): Promise<void> {
    const soundKeys = Object.keys(SOUND_EFFECTS) as SoundEffectKey[];

    for (const key of soundKeys) {
      try {
        const url = SOUND_EFFECTS[key];
        const audio = await preloadAudio(url);
        this.sounds.set(key, audio);
      } catch (error) {
        console.warn(`Failed to preload sound effect: ${key}`, error);
      }
    }
  }

  /**
   * Preload specific sounds
   * @param soundUrls - Array of sound URLs to preload
   */
  public async preloadSounds(soundUrls: string[]): Promise<void> {
    const promises = soundUrls.map(async (url) => {
      try {
        const audio = await preloadAudio(url);
        // Use URL as key for custom sounds
        this.sounds.set(url, audio);
      } catch (error) {
        console.warn(`Failed to preload sound: ${url}`, error);
      }
    });

    await Promise.all(promises);
  }

  /**
   * Play a sound effect
   * @param soundKey - Sound effect key or URL
   * @param volume - Override volume (0-1)
   */
  public async play(soundKey: string, volume?: number): Promise<void> {
    if (!this.isEnabled) {
      return Promise.resolve();
    }

    try {
      let audio = this.sounds.get(soundKey);

      // If not found, try to load it on-demand
      if (!audio) {
        // Check if it's a known sound effect key
        if (soundKey in SOUND_EFFECTS) {
          const url = SOUND_EFFECTS[soundKey as SoundEffectKey];
          audio = await preloadAudio(url);
          this.sounds.set(soundKey, audio);
        } else {
          // Treat as custom URL
          audio = await preloadAudio(soundKey);
          this.sounds.set(soundKey, audio);
        }
      }

      // Clone the audio element to allow overlapping plays
      const audioClone = audio.cloneNode() as HTMLAudioElement;
      audioClone.volume = (volume ?? this.globalVolume);

      return new Promise((resolve, reject) => {
        audioClone.onended = () => resolve();
        audioClone.onerror = (error) => {
          console.error(`Error playing sound: ${soundKey}`, error);
          // Fallback to beep
          playBeep().then(resolve).catch(reject);
        };

        audioClone.play().catch((error) => {
          console.error(`Failed to play sound: ${soundKey}`, error);
          // Fallback to beep
          playBeep().then(resolve).catch(reject);
        });
      });
    } catch (error) {
      console.error(`Sound effect error for ${soundKey}:`, error);
      // Fallback to beep sound
      return playBeep();
    }
  }

  /**
   * Stop a specific sound
   * @param soundKey - Sound effect key or URL
   */
  public stop(soundKey: string): void {
    const audio = this.sounds.get(soundKey);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stop all currently playing sounds
   */
  public stopAll(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.currentTime = 0;
    });
  }

  /**
   * Set global volume for all sound effects
   * @param volume - Volume level (0-1)
   */
  public setGlobalVolume(volume: number): void {
    this.globalVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Enable or disable sound effects
   * @param enabled - Whether to enable sound effects
   */
  public setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
    if (!enabled) {
      this.stopAll();
    }
  }

  /**
   * Check if a sound is loaded
   * @param soundKey - Sound effect key or URL
   */
  public isLoaded(soundKey: string): boolean {
    return this.sounds.has(soundKey);
  }

  /**
   * Get all loaded sound keys
   */
  public getLoadedSounds(): string[] {
    return Array.from(this.sounds.keys());
  }

  /**
   * Remove a sound from cache
   * @param soundKey - Sound effect key or URL
   */
  public unload(soundKey: string): void {
    const audio = this.sounds.get(soundKey);
    if (audio) {
      audio.pause();
      audio.src = '';
      this.sounds.delete(soundKey);
    }
  }

  /**
   * Clear all cached sounds
   */
  public clearCache(): void {
    this.sounds.forEach((audio) => {
      audio.pause();
      audio.src = '';
    });
    this.sounds.clear();
  }

  /**
   * Play a sequence of sounds with delays
   * @param sequence - Array of {soundKey, delay} objects
   */
  public async playSequence(
    sequence: Array<{ soundKey: string; delay?: number; volume?: number }>
  ): Promise<void> {
    for (const item of sequence) {
      if (item.delay) {
        await new Promise(resolve => setTimeout(resolve, item.delay));
      }
      await this.play(item.soundKey, item.volume);
    }
  }

  /**
   * Fade in a sound effect
   * @param soundKey - Sound effect key
   * @param duration - Fade duration in ms
   */
  public async fadeIn(soundKey: string, duration: number = 1000): Promise<void> {
    const audio = this.sounds.get(soundKey);
    if (!audio || !this.isEnabled) return;

    const audioClone = audio.cloneNode() as HTMLAudioElement;
    audioClone.volume = 0;

    await audioClone.play();

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = this.globalVolume / steps;

    for (let i = 0; i <= steps; i++) {
      audioClone.volume = volumeStep * i;
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }
  }

  /**
   * Fade out a sound effect
   * @param soundKey - Sound effect key
   * @param duration - Fade duration in ms
   */
  public async fadeOut(soundKey: string, duration: number = 1000): Promise<void> {
    const audio = this.sounds.get(soundKey);
    if (!audio) return;

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeStep = audio.volume / steps;

    for (let i = steps; i >= 0; i--) {
      audio.volume = volumeStep * i;
      await new Promise(resolve => setTimeout(resolve, stepDuration));
    }

    audio.pause();
    audio.currentTime = 0;
    audio.volume = this.globalVolume;
  }
}
