import { AudioEventType, EVENT_PRIORITIES, AnnouncementPriority } from '@/config/audio';

/**
 * Format seconds into a human-readable announcement
 * @param seconds - Number of seconds to format
 * @returns Formatted time string for announcements
 */
export function formatTimeForAnnouncement(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  if (remainingSeconds === 0) {
    return `${minutes} minute${minutes === 1 ? '' : 's'}`;
  }

  return `${minutes} minute${minutes === 1 ? '' : 's'} ${remainingSeconds} second${remainingSeconds === 1 ? '' : 's'}`;
}

/**
 * Generate motivational message based on workout phase
 * @param phase - Workout phase
 * @returns Random motivational message
 */
export function generateMotivationalMessage(
  phase: 'start' | 'middle' | 'end'
): string {
  const messages = {
    start: [
      "Let's get started!",
      "Time to work!",
      "Here we go!",
      "Ready to crush this!",
    ],
    middle: [
      "Keep pushing!",
      "You're doing great!",
      "Stay focused!",
      "Don't give up now!",
      "Halfway there!",
    ],
    end: [
      "Almost done!",
      "Final push!",
      "Finish strong!",
      "You've got this!",
      "One more to go!",
    ],
  };

  const options = messages[phase];
  return options[Math.floor(Math.random() * options.length)];
}

/**
 * Get announcement priority based on workout event type
 * @param event - Workout event type
 * @returns Priority level
 */
export function getAnnouncementPriority(event: AudioEventType): AnnouncementPriority {
  return EVENT_PRIORITIES[event] || 'normal';
}

/**
 * Check if Web Speech API is supported
 * @returns True if supported
 */
export function checkWebSpeechSupport(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Check if Web Audio API is supported
 * @returns True if supported
 */
export function checkWebAudioSupport(): boolean {
  return 'AudioContext' in window || 'webkitAudioContext' in window;
}

/**
 * Get available voices filtered by preferences
 * @param preferredVoice - Voice preference ('male' | 'female' | 'system')
 * @returns Best matching voice or default
 */
export function getBestVoice(
  preferredVoice: 'male' | 'female' | 'system' = 'system'
): SpeechSynthesisVoice | null {
  if (!checkWebSpeechSupport()) return null;

  const voices = window.speechSynthesis.getVoices();
  if (voices.length === 0) return null;

  // Filter English voices
  const englishVoices = voices.filter(
    (voice) => voice.lang.startsWith('en')
  );

  if (englishVoices.length === 0) {
    return voices[0]; // Return first available voice
  }

  if (preferredVoice === 'system') {
    // Return default or first English voice
    return englishVoices.find((v) => v.default) || englishVoices[0];
  }

  // Try to match voice by name pattern
  const pattern = preferredVoice === 'male'
    ? /male|man|david|alex|james/i
    : /female|woman|zira|samantha|victoria|karen/i;

  const matchedVoice = englishVoices.find((voice) =>
    pattern.test(voice.name)
  );

  return matchedVoice || englishVoices[0];
}

/**
 * Calculate volume with ducking applied
 * @param baseVolume - Base volume (0-100)
 * @param isDucking - Whether ducking is active
 * @param duckingLevel - Ducking level (0-100)
 * @returns Adjusted volume (0-1)
 */
export function calculateDuckedVolume(
  baseVolume: number,
  isDucking: boolean,
  duckingLevel: number
): number {
  if (!isDucking) {
    return baseVolume / 100;
  }

  const duckingFactor = duckingLevel / 100;
  return (baseVolume * (1 - duckingFactor)) / 100;
}

/**
 * Preload an audio file
 * @param url - URL of the audio file
 * @returns Promise that resolves when audio is loaded
 */
export function preloadAudio(url: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.addEventListener('canplaythrough', () => resolve(audio), { once: true });
    audio.addEventListener('error', reject, { once: true });

    audio.preload = 'auto';
    audio.src = url;
  });
}

/**
 * Create a simple beep sound using Web Audio API
 * @param frequency - Frequency in Hz (default: 800)
 * @param duration - Duration in milliseconds (default: 200)
 * @param volume - Volume (0-1, default: 0.3)
 * @returns Promise that resolves when beep completes
 */
export function playBeep(
  frequency: number = 800,
  duration: number = 200,
  volume: number = 0.3
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!checkWebAudioSupport()) {
      reject(new Error('Web Audio API not supported'));
      return;
    }

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + duration / 1000
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration / 1000);

      setTimeout(() => {
        audioContext.close();
        resolve();
      }, duration);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Format workout statistics for announcement
 * @param stats - Workout statistics
 * @returns Formatted announcement string
 */
export function formatWorkoutStats(stats: {
  duration?: number;
  exercisesCompleted?: number;
  setsCompleted?: number;
  caloriesBurned?: number;
}): string {
  const parts: string[] = [];

  if (stats.duration) {
    const minutes = Math.floor(stats.duration / 60);
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`);
  }

  if (stats.setsCompleted) {
    parts.push(`${stats.setsCompleted} set${stats.setsCompleted === 1 ? '' : 's'} completed`);
  }

  if (stats.caloriesBurned) {
    parts.push(`${stats.caloriesBurned} calories burned`);
  }

  return parts.join(', ');
}

/**
 * Check if should announce interval based on configuration
 * @param remainingSeconds - Remaining seconds
 * @param intervals - Configured intervals to announce
 * @returns True if should announce
 */
export function shouldAnnounceInterval(
  remainingSeconds: number,
  intervals: number[]
): boolean {
  return intervals.includes(remainingSeconds);
}

/**
 * Debounce function for audio events
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function for audio events
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
