import { useEffect, useRef, useCallback } from 'react';
import { WorkoutAudioCoordinator } from '@/services/audio/workoutAudioCoordinator';
import { Workout, WorkoutExercise } from '@/types/workout';
import { useAudio } from './useAudio';
import { AudioConfig } from '@/config/audio';

export interface UseWorkoutAudioOptions {
  workout?: Workout | null;
  autoStart?: boolean;
  onHalfway?: () => void;
  onPRDetected?: (exercise: string, record: string) => void;
}

export function useWorkoutAudio(options: UseWorkoutAudioOptions = {}) {
  const { audioManager } = useAudio();
  const coordinatorRef = useRef<WorkoutAudioCoordinator | null>(null);
  const { workout, autoStart = false, onHalfway, onPRDetected } = options;

  // Initialize coordinator
  useEffect(() => {
    if (audioManager) {
      coordinatorRef.current = new WorkoutAudioCoordinator({
        audioManager,
        onHalfway,
        onPRDetected,
      });
    }

    return () => {
      if (coordinatorRef.current) {
        coordinatorRef.current.stop();
      }
    };
  }, [audioManager, onHalfway, onPRDetected]);

  // Auto-start workout if enabled
  useEffect(() => {
    if (autoStart && workout && coordinatorRef.current) {
      coordinatorRef.current.startWorkout(workout);
    }
  }, [autoStart, workout]);

  const startWorkout = useCallback((workoutToStart?: Workout) => {
    const targetWorkout = workoutToStart || workout;
    if (targetWorkout && coordinatorRef.current) {
      coordinatorRef.current.startWorkout(targetWorkout);
    }
  }, [workout]);

  const completeWorkout = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.completeWorkout();
    }
  }, []);

  const startExercise = useCallback((exercise: WorkoutExercise, index: number) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.startExercise(exercise, index);
    }
  }, []);

  const completeSet = useCallback((
    setNumber: number,
    totalSets: number,
    weight?: number,
    reps?: number
  ) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.completeSet(setNumber, totalSets, weight, reps);
    }
  }, []);

  const completeExercise = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.completeExercise();
    }
  }, []);

  const startRest = useCallback((durationSeconds: number, onComplete?: () => void) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.startRest(durationSeconds, onComplete);
    }
  }, []);

  const endRest = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.endRest();
    }
  }, []);

  const skipRest = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.skipRest();
    }
  }, []);

  const announcePR = useCallback((exercise: string, record: string) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.announcePR(exercise, record);
    }
  }, []);

  const pause = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.pause();
    }
  }, []);

  const resume = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.resume();
    }
  }, []);

  const stop = useCallback(() => {
    if (coordinatorRef.current) {
      coordinatorRef.current.stop();
    }
  }, []);

  const updateConfig = useCallback((config: Partial<AudioConfig>) => {
    if (coordinatorRef.current) {
      coordinatorRef.current.updateConfig(config);
    }
  }, []);

  const getStats = useCallback(() => {
    return coordinatorRef.current?.getStats() || {
      exercisesCompleted: 0,
      setsCompleted: 0,
      currentExercise: 0,
      totalExercises: 0,
      duration: 0,
    };
  }, []);

  return {
    coordinator: coordinatorRef.current,
    startWorkout,
    completeWorkout,
    startExercise,
    completeSet,
    completeExercise,
    startRest,
    endRest,
    skipRest,
    announcePR,
    pause,
    resume,
    stop,
    updateConfig,
    getStats,
  };
}
