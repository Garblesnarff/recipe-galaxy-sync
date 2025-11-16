import { getBestVoice, checkWebSpeechSupport } from '@/utils/audioUtils';
import { AnnouncementPriority } from '@/config/audio';

export interface SpeakOptions {
  priority?: AnnouncementPriority;
  interruptible?: boolean;
  pitch?: number;
  rate?: number;
  volume?: number;
}

interface QueuedAnnouncement {
  text: string;
  options: SpeakOptions;
  utterance: SpeechSynthesisUtterance;
  resolve: () => void;
  reject: (error: Error) => void;
}

export class TextToSpeechService {
  private synth: SpeechSynthesis | null = null;
  private currentVoice: SpeechSynthesisVoice | null = null;
  private defaultVolume: number = 0.8;
  private defaultRate: number = 1.0;
  private defaultPitch: number = 1.0;
  private queue: QueuedAnnouncement[] = [];
  private currentAnnouncement: QueuedAnnouncement | null = null;
  private isInitialized: boolean = false;

  constructor() {
    if (checkWebSpeechSupport()) {
      this.synth = window.speechSynthesis;
      this.initialize();
    } else {
      console.warn('Web Speech API is not supported in this browser');
    }
  }

  private initialize(): void {
    if (!this.synth) return;

    // Wait for voices to be loaded
    const loadVoices = () => {
      const voices = this.synth!.getVoices();
      if (voices.length > 0) {
        this.currentVoice = getBestVoice('system');
        this.isInitialized = true;
      }
    };

    // Load voices immediately if available
    loadVoices();

    // Also listen for voiceschanged event (some browsers need this)
    if (this.synth.addEventListener) {
      this.synth.addEventListener('voiceschanged', loadVoices);
    }
  }

  /**
   * Speak text with optional settings
   */
  public async speak(text: string, options: SpeakOptions = {}): Promise<void> {
    if (!this.synth || !this.isInitialized) {
      console.warn('Text-to-Speech is not available');
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // Set voice
      if (this.currentVoice) {
        utterance.voice = this.currentVoice;
      }

      // Apply options
      utterance.volume = options.volume ?? this.defaultVolume;
      utterance.rate = options.rate ?? this.defaultRate;
      utterance.pitch = options.pitch ?? this.defaultPitch;

      // Create queued announcement
      const announcement: QueuedAnnouncement = {
        text,
        options,
        utterance,
        resolve,
        reject,
      };

      // Handle priority
      const priority = options.priority || 'normal';

      if (priority === 'high' && this.currentAnnouncement) {
        // High priority: interrupt current if it's interruptible
        if (this.currentAnnouncement.options.interruptible !== false) {
          this.stop();
          this.speakNow(announcement);
        } else {
          // Queue at front
          this.queue.unshift(announcement);
        }
      } else if (priority === 'low') {
        // Low priority: add to end of queue
        this.queue.push(announcement);
        this.processQueue();
      } else {
        // Normal priority: add to queue
        this.queue.push(announcement);
        this.processQueue();
      }
    });
  }

  private speakNow(announcement: QueuedAnnouncement): void {
    if (!this.synth) return;

    this.currentAnnouncement = announcement;

    announcement.utterance.onend = () => {
      announcement.resolve();
      this.currentAnnouncement = null;
      this.processQueue();
    };

    announcement.utterance.onerror = (event) => {
      announcement.reject(new Error(`Speech synthesis error: ${event.error}`));
      this.currentAnnouncement = null;
      this.processQueue();
    };

    this.synth.speak(announcement.utterance);
  }

  private processQueue(): void {
    if (this.currentAnnouncement || this.queue.length === 0) {
      return;
    }

    const nextAnnouncement = this.queue.shift();
    if (nextAnnouncement) {
      this.speakNow(nextAnnouncement);
    }
  }

  /**
   * Stop current speech and clear queue
   */
  public stop(): void {
    if (!this.synth) return;

    this.synth.cancel();
    this.queue = [];
    this.currentAnnouncement = null;
  }

  /**
   * Pause current speech
   */
  public pause(): void {
    if (!this.synth) return;
    this.synth.pause();
  }

  /**
   * Resume paused speech
   */
  public resume(): void {
    if (!this.synth) return;
    this.synth.resume();
  }

  /**
   * Check if currently speaking
   */
  public isSpeaking(): boolean {
    return this.synth?.speaking || false;
  }

  /**
   * Get available voices
   */
  public getVoices(): SpeechSynthesisVoice[] {
    return this.synth?.getVoices() || [];
  }

  /**
   * Set voice
   */
  public setVoice(voice: SpeechSynthesisVoice): void {
    this.currentVoice = voice;
  }

  /**
   * Set voice by preference
   */
  public setVoiceByPreference(preference: 'male' | 'female' | 'system'): void {
    this.currentVoice = getBestVoice(preference);
  }

  /**
   * Set default volume (0-1)
   */
  public setVolume(volume: number): void {
    this.defaultVolume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Set default speech rate (0.1-10, normal is 1)
   */
  public setRate(rate: number): void {
    this.defaultRate = Math.max(0.1, Math.min(10, rate));
  }

  /**
   * Set default pitch (0-2, normal is 1)
   */
  public setPitch(pitch: number): void {
    this.defaultPitch = Math.max(0, Math.min(2, pitch));
  }

  /**
   * Get queue length
   */
  public getQueueLength(): number {
    return this.queue.length + (this.currentAnnouncement ? 1 : 0);
  }

  /**
   * Clear queue without stopping current speech
   */
  public clearQueue(): void {
    this.queue = [];
  }
}
