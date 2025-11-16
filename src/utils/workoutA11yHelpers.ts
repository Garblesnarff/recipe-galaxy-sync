/**
 * Accessibility helpers for workout pages
 * Use these functions to enhance workout experiences for screen reader users
 */

import { announceToScreenReader } from '@/services/accessibility/accessibilityService';

/**
 * Announce workout timer at specific intervals
 * Call this from your timer effect/callback
 */
export function announceTimerUpdate(seconds: number, isResting: boolean): void {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Announce at specific intervals
  const shouldAnnounce =
    seconds === 0 ||
    (seconds <= 10 && seconds > 0) || // Last 10 seconds
    (seconds === 30) || // 30 seconds mark
    (seconds === 60) || // 1 minute mark
    (seconds % 60 === 0 && minutes > 0); // Every minute

  if (shouldAnnounce) {
    const prefix = isResting ? 'Rest time' : 'Time';
    let message = '';

    if (seconds === 0) {
      message = isResting ? 'Rest complete' : 'Time is up';
    } else if (minutes > 0 && remainingSeconds === 0) {
      message = `${prefix}: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
    } else if (minutes > 0) {
      message = `${prefix}: ${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ${remainingSeconds} seconds`;
    } else {
      message = `${prefix}: ${seconds} ${seconds === 1 ? 'second' : 'seconds'}`;
    }

    announceToScreenReader(message, 'polite');
  }
}

/**
 * Announce set completion
 */
export function announceSetCompletion(
  exerciseName: string,
  setNumber: number,
  totalSets: number,
  reps?: number,
  weight?: number
): void {
  let message = `Completed set ${setNumber} of ${totalSets} for ${exerciseName}`;

  if (reps) {
    message += `, ${reps} reps`;
  }

  if (weight) {
    message += ` at ${weight} kg`;
  }

  announceToScreenReader(message, 'polite');
}

/**
 * Announce exercise change
 */
export function announceExerciseChange(
  exerciseName: string,
  exerciseNumber: number,
  totalExercises: number,
  sets: number,
  reps: number
): void {
  const message = `Exercise ${exerciseNumber} of ${totalExercises}: ${exerciseName}. ${sets} sets of ${reps} reps`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announce rest period start
 */
export function announceRestStart(duration: number): void {
  const message = `Rest for ${duration} seconds`;
  announceToScreenReader(message, 'polite');
}

/**
 * Announce personal record
 */
export function announcePR(exerciseName: string, metric: string, value: number): void {
  const message = `New personal record for ${exerciseName}! ${metric}: ${value}`;
  announceToScreenReader(message, 'assertive');
}

/**
 * Announce workout completion
 */
export function announceWorkoutComplete(
  workoutName: string,
  duration: number,
  exercisesCompleted: number
): void {
  const minutes = Math.floor(duration / 60);
  const message = `Workout complete! ${workoutName} finished in ${minutes} minutes. ${exercisesCompleted} exercises completed`;
  announceToScreenReader(message, 'assertive');
}

/**
 * Announce workout pause/resume
 */
export function announceWorkoutPause(isPaused: boolean): void {
  const message = isPaused ? 'Workout paused' : 'Workout resumed';
  announceToScreenReader(message, 'polite');
}

/**
 * Announce form check recording status
 */
export function announceFormRecording(isRecording: boolean): void {
  const message = isRecording ? 'Recording started' : 'Recording stopped';
  announceToScreenReader(message, 'polite');
}

/**
 * Example usage in ActiveWorkout component:
 *
 * import { announceTimerUpdate, announceSetCompletion } from '@/utils/workoutA11yHelpers';
 * import { useA11y } from '@/hooks/useA11y';
 *
 * // In your component:
 * const { a11yConfig } = useA11y();
 *
 * // In timer effect:
 * useEffect(() => {
 *   if (timerSeconds > 0 && isTimerRunning) {
 *     const interval = setInterval(() => {
 *       setTimerSeconds(prev => {
 *         const newSeconds = prev - 1;
 *         if (a11yConfig.screenReaderAnnouncements) {
 *           announceTimerUpdate(newSeconds, isResting);
 *         }
 *         return newSeconds;
 *       });
 *     }, 1000);
 *     return () => clearInterval(interval);
 *   }
 * }, [timerSeconds, isTimerRunning, isResting]);
 *
 * // When completing a set:
 * const handleSetComplete = (exerciseName, setNum, totalSets, reps, weight) => {
 *   if (a11yConfig.screenReaderAnnouncements) {
 *     announceSetCompletion(exerciseName, setNum, totalSets, reps, weight);
 *   }
 *   // ... rest of your logic
 * };
 */
