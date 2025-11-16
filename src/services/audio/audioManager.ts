import { TextToSpeechService } from './textToSpeech';
import { SoundEffectsService } from './soundEffects';
import { AudioConfig, defaultAudioConfig } from '@/config/audio';
import {
  getWorkoutStartAnnouncement,
  getExerciseStartAnnouncement,
  getSetCompleteAnnouncement,
  getRestStartAnnouncement,
  getRestEndAnnouncement,
  getPRAnnouncement,
  getWorkoutCompleteAnnouncement,
  getHalfwayAnnouncement,
} from '@/config/announcements';
import { formatWorkoutStats } from '@/utils/audioUtils';
import { supabase } from '@/integrations/supabase/client';

export interface WorkoutStats {
  duration?: number;
  exercisesCompleted?: number;
  setsCompleted?: number;
  caloriesBurned?: number;
}

export class AudioManager {
  public tts: TextToSpeechService;
  public sfx: SoundEffectsService;
  public config: AudioConfig;
  private musicDuckingActive: boolean = false;
  private originalMusicVolume: number = 1.0;

  constructor(config?: Partial<AudioConfig>) {
    this.config = { ...defaultAudioConfig, ...config };
    this.tts = new TextToSpeechService();
    this.sfx = new SoundEffectsService();

    this.applyConfig();
  }

  /**
   * Apply configuration to services
   */
  private applyConfig(): void {
    // Apply TTS settings
    this.tts.setVolume(this.config.volume / 100);
    this.tts.setRate(this.config.voiceSpeed);
    this.tts.setVoiceByPreference(this.config.voice);

    // Apply SFX settings
    this.sfx.setGlobalVolume(this.config.volume / 100);
    this.sfx.setEnabled(this.config.soundEffects && this.config.enabled);
  }

  /**
   * Announce workout start
   */
  public async announceWorkoutStart(workoutName?: string): Promise<void> {
    if (!this.config.enabled || !this.config.announceWorkoutPhases) return;

    const announcement = getWorkoutStartAnnouncement(workoutName);

    if (this.config.soundEffects) {
      await this.sfx.play('WORKOUT_START');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'high');
    }
  }

  /**
   * Announce workout completion
   */
  public async announceWorkoutComplete(stats?: WorkoutStats): Promise<void> {
    if (!this.config.enabled || !this.config.announceWorkoutPhases) return;

    const announcement = getWorkoutCompleteAnnouncement(stats);
    let fullAnnouncement = announcement;

    if (stats) {
      const statsText = formatWorkoutStats(stats);
      if (statsText) {
        fullAnnouncement += ` ${statsText}`;
      }
    }

    if (this.config.soundEffects) {
      await this.sfx.play('WORKOUT_COMPLETE');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(fullAnnouncement, 'high');
    }
  }

  /**
   * Announce exercise start
   */
  public async announceExerciseStart(
    exerciseName: string,
    sets: number,
    reps?: number
  ): Promise<void> {
    if (!this.config.enabled || !this.config.voiceAnnouncements) return;

    const announcement = getExerciseStartAnnouncement(exerciseName, sets, reps);
    await this.announceWithDucking(announcement, 'normal');
  }

  /**
   * Announce set completion
   */
  public async announceSetComplete(
    setNumber: number,
    totalSets: number
  ): Promise<void> {
    if (!this.config.enabled || !this.config.announceSetCompletions) return;

    const announcement = getSetCompleteAnnouncement(setNumber, totalSets);

    if (this.config.soundEffects) {
      await this.sfx.play('SET_COMPLETE');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'low');
    }
  }

  /**
   * Announce rest period start
   */
  public async announceRestStart(durationSeconds: number): Promise<void> {
    if (!this.config.enabled || !this.config.announceRestPeriods) return;

    const announcement = getRestStartAnnouncement(durationSeconds);

    if (this.config.soundEffects) {
      await this.sfx.play('REST_START');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'normal');
    }
  }

  /**
   * Announce rest countdown
   */
  public async announceRestCountdown(remainingSeconds: number): Promise<void> {
    if (!this.config.enabled || !this.config.announceRestPeriods) return;

    // Check if we should announce this interval
    if (!this.config.announceIntervals.includes(remainingSeconds)) return;

    const announcement = remainingSeconds.toString();

    // Play different sounds for different countdown points
    if (this.config.soundEffects) {
      if (remainingSeconds === 1) {
        await this.sfx.play('COUNTDOWN_FINAL');
      } else if (remainingSeconds <= 5) {
        await this.sfx.play('COUNTDOWN_TICK');
      }
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'high');
    }
  }

  /**
   * Announce rest period end
   */
  public async announceRestEnd(): Promise<void> {
    if (!this.config.enabled || !this.config.announceRestPeriods) return;

    const announcement = getRestEndAnnouncement();

    if (this.config.soundEffects) {
      await this.sfx.play('REST_END');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'high');
    }
  }

  /**
   * Announce personal record achieved
   */
  public async announcePRachieved(
    exercise: string,
    newRecord: string
  ): Promise<void> {
    if (!this.config.enabled) return;

    const announcement = getPRAnnouncement(exercise, newRecord);

    if (this.config.soundEffects) {
      await this.sfx.play('PR_ACHIEVED');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'high');
    }
  }

  /**
   * Announce halfway point
   */
  public async announceHalfwayPoint(): Promise<void> {
    if (!this.config.enabled || !this.config.voiceAnnouncements) return;

    const announcement = getHalfwayAnnouncement();

    if (this.config.soundEffects) {
      await this.sfx.play('HALFWAY');
    }

    if (this.config.voiceAnnouncements) {
      await this.announceWithDucking(announcement, 'normal');
    }
  }

  /**
   * Make an announcement with music ducking if enabled
   */
  private async announceWithDucking(
    text: string,
    priority: 'high' | 'normal' | 'low'
  ): Promise<void> {
    if (this.config.musicDucking) {
      await this.duckMusic();
    }

    await this.tts.speak(text, {
      priority,
      interruptible: priority !== 'high',
    });

    if (this.config.musicDucking) {
      await this.unduckMusic();
    }
  }

  /**
   * Lower music volume for announcements
   */
  public async duckMusic(): Promise<void> {
    if (this.musicDuckingActive) return;

    this.musicDuckingActive = true;

    // Note: This would integrate with the music player service
    // For now, we just set the flag
    // In a real implementation, this would call the music player's setVolume method
    console.log('Music ducking activated');
  }

  /**
   * Restore music volume after announcements
   */
  public async unduckMusic(): Promise<void> {
    if (!this.musicDuckingActive) return;

    // Small delay before undducking
    await new Promise(resolve => setTimeout(resolve, 500));

    this.musicDuckingActive = false;

    // Note: This would integrate with the music player service
    console.log('Music ducking deactivated');
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<AudioConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyConfig();
  }

  /**
   * Save configuration to database
   */
  public async saveConfig(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ audio_config: this.config })
        .eq('id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Failed to save audio config:', error);
      throw error;
    }
  }

  /**
   * Load configuration from database
   */
  public async loadConfig(userId: string): Promise<AudioConfig> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('audio_config')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.audio_config) {
        this.config = { ...defaultAudioConfig, ...data.audio_config };
        this.applyConfig();
        return this.config;
      }

      return this.config;
    } catch (error) {
      console.error('Failed to load audio config:', error);
      return this.config;
    }
  }

  /**
   * Reset configuration to defaults
   */
  public resetConfig(): void {
    this.config = { ...defaultAudioConfig };
    this.applyConfig();
  }

  /**
   * Enable/disable all audio
   */
  public setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    this.applyConfig();

    if (!enabled) {
      this.tts.stop();
      this.sfx.stopAll();
    }
  }

  /**
   * Test current audio settings
   */
  public async testAudio(): Promise<void> {
    const testText = "This is how your workout announcements will sound. You've got this!";

    if (this.config.soundEffects) {
      await this.sfx.play('SET_COMPLETE');
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (this.config.voiceAnnouncements) {
      await this.tts.speak(testText);
    }
  }
}

// Singleton instance
let audioManagerInstance: AudioManager | null = null;

/**
 * Get or create AudioManager singleton
 */
export function getAudioManager(): AudioManager {
  if (!audioManagerInstance) {
    audioManagerInstance = new AudioManager();
  }
  return audioManagerInstance;
}

/**
 * Initialize AudioManager with user config
 */
export async function initializeAudioManager(userId: string): Promise<AudioManager> {
  const manager = getAudioManager();
  await manager.loadConfig(userId);
  return manager;
}
