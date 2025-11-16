import { AudioManager } from './audioManager';
import { Workout, WorkoutExercise } from '@/types/workout';

export interface WorkoutAudioCoordinatorOptions {
  audioManager?: AudioManager;
  onHalfway?: () => void;
  onPRDetected?: (exercise: string, record: string) => void;
}

export class WorkoutAudioCoordinator {
  private audioManager: AudioManager;
  private workout: Workout | null = null;
  private currentExerciseIndex: number = 0;
  private totalExercises: number = 0;
  private halfwayAnnounced: boolean = false;
  private exercisesCompleted: number = 0;
  private setsCompleted: number = 0;
  private startTime: number = 0;
  private restTimer: NodeJS.Timeout | null = null;

  constructor(options: WorkoutAudioCoordinatorOptions = {}) {
    this.audioManager = options.audioManager || new AudioManager();
  }

  /**
   * Start a workout with audio announcements
   */
  public startWorkout(workout: Workout): void {
    this.workout = workout;
    this.currentExerciseIndex = 0;
    this.totalExercises = workout.exercises?.length || 0;
    this.halfwayAnnounced = false;
    this.exercisesCompleted = 0;
    this.setsCompleted = 0;
    this.startTime = Date.now();

    // Announce workout start
    this.audioManager.announceWorkoutStart(workout.title);
  }

  /**
   * Complete the workout
   */
  public completeWorkout(): void {
    if (!this.workout) return;

    const duration = Math.floor((Date.now() - this.startTime) / 1000);

    this.audioManager.announceWorkoutComplete({
      duration,
      exercisesCompleted: this.exercisesCompleted,
      setsCompleted: this.setsCompleted,
      caloriesBurned: this.workout.calories_estimate,
    });

    this.cleanup();
  }

  /**
   * Start a new exercise
   */
  public startExercise(exercise: WorkoutExercise, index: number): void {
    this.currentExerciseIndex = index;

    // Announce exercise
    this.audioManager.announceExerciseStart(
      exercise.exercise_name,
      exercise.sets || 0,
      exercise.reps
    );

    // Check if halfway point
    if (!this.halfwayAnnounced && this.totalExercises > 1) {
      const halfwayPoint = Math.floor(this.totalExercises / 2);
      if (index === halfwayPoint) {
        // Delay halfway announcement slightly
        setTimeout(() => {
          this.audioManager.announceHalfwayPoint();
          this.halfwayAnnounced = true;
        }, 2000);
      }
    }
  }

  /**
   * Complete a set
   */
  public completeSet(
    setNumber: number,
    totalSets: number,
    weight?: number,
    reps?: number
  ): void {
    this.setsCompleted++;

    // Announce set completion
    this.audioManager.announceSetComplete(setNumber, totalSets);

    // Check for PR (this would need integration with PR tracking)
    // For now, we'll leave it as a placeholder
  }

  /**
   * Complete an exercise
   */
  public completeExercise(): void {
    this.exercisesCompleted++;
  }

  /**
   * Start rest period with countdown
   */
  public startRest(durationSeconds: number, onComplete?: () => void): void {
    // Announce rest start
    this.audioManager.announceRestStart(durationSeconds);

    // Clear any existing timer
    if (this.restTimer) {
      clearInterval(this.restTimer);
    }

    let remaining = durationSeconds;

    // Set up interval for countdown announcements
    this.restTimer = setInterval(() => {
      remaining--;

      if (remaining <= 0) {
        this.endRest();
        if (onComplete) onComplete();
      } else {
        // Announce countdown at configured intervals
        this.audioManager.announceRestCountdown(remaining);
      }
    }, 1000);
  }

  /**
   * End rest period
   */
  public endRest(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }

    this.audioManager.announceRestEnd();
  }

  /**
   * Skip rest period
   */
  public skipRest(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  }

  /**
   * Announce personal record
   */
  public announcePR(exercise: string, record: string): void {
    this.audioManager.announcePRachieved(exercise, record);
  }

  /**
   * Pause all audio
   */
  public pause(): void {
    this.audioManager.tts.pause();
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }
  }

  /**
   * Resume audio
   */
  public resume(): void {
    this.audioManager.tts.resume();
  }

  /**
   * Stop all audio
   */
  public stop(): void {
    this.audioManager.tts.stop();
    this.audioManager.sfx.stopAll();
    this.cleanup();
  }

  /**
   * Update audio configuration
   */
  public updateConfig(config: Partial<import('@/config/audio').AudioConfig>): void {
    this.audioManager.updateConfig(config);
  }

  /**
   * Get audio manager instance
   */
  public getAudioManager(): AudioManager {
    return this.audioManager;
  }

  /**
   * Clean up resources
   */
  private cleanup(): void {
    if (this.restTimer) {
      clearInterval(this.restTimer);
      this.restTimer = null;
    }

    this.workout = null;
    this.currentExerciseIndex = 0;
    this.totalExercises = 0;
    this.halfwayAnnounced = false;
    this.exercisesCompleted = 0;
    this.setsCompleted = 0;
    this.startTime = 0;
  }

  /**
   * Get workout statistics
   */
  public getStats() {
    return {
      exercisesCompleted: this.exercisesCompleted,
      setsCompleted: this.setsCompleted,
      currentExercise: this.currentExerciseIndex,
      totalExercises: this.totalExercises,
      duration: this.startTime ? Math.floor((Date.now() - this.startTime) / 1000) : 0,
    };
  }
}
