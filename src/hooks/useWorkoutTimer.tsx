
import { useState, useCallback } from "react";
import { useInterval } from "./useInterval";

interface TimerState {
  currentExerciseIndex: number;
  isExerciseActive: boolean;
  isRestActive: boolean;
  exerciseTimeRemaining: number;
  restTimeRemaining: number;
  totalWorkoutTime: number;
  isPaused: boolean;
  isCompleted: boolean;
}

export const useWorkoutTimer = (
  exercises: Array<{ duration_seconds?: number; rest_seconds?: number }>,
  onWorkoutComplete?: () => void
) => {
  const [timerState, setTimerState] = useState<TimerState>({
    currentExerciseIndex: 0,
    isExerciseActive: false,
    isRestActive: false,
    exerciseTimeRemaining: exercises[0]?.duration_seconds || 0,
    restTimeRemaining: 0,
    totalWorkoutTime: 0,
    isPaused: false,
    isCompleted: false,
  });

  const startWorkout = useCallback(() => {
    setTimerState(prev => ({
      ...prev,
      isExerciseActive: true,
      isPaused: false,
      exerciseTimeRemaining: exercises[0]?.duration_seconds || 0,
    }));
  }, [exercises]);

  const pauseWorkout = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: true }));
  }, []);

  const resumeWorkout = useCallback(() => {
    setTimerState(prev => ({ ...prev, isPaused: false }));
  }, []);

  const skipExercise = useCallback(() => {
    setTimerState(prev => {
      const nextIndex = prev.currentExerciseIndex + 1;

      if (nextIndex >= exercises.length) {
        onWorkoutComplete?.();
        return {
          ...prev,
          isExerciseActive: false,
          isRestActive: false,
          isCompleted: true,
        };
      }

      return {
        ...prev,
        currentExerciseIndex: nextIndex,
        isExerciseActive: true,
        isRestActive: false,
        exerciseTimeRemaining: exercises[nextIndex]?.duration_seconds || 0,
      };
    });
  }, [exercises, onWorkoutComplete]);

  const skipRest = useCallback(() => {
    setTimerState(prev => {
      const nextIndex = prev.currentExerciseIndex + 1;

      if (nextIndex >= exercises.length) {
        onWorkoutComplete?.();
        return {
          ...prev,
          isExerciseActive: false,
          isRestActive: false,
          isCompleted: true,
        };
      }

      return {
        ...prev,
        currentExerciseIndex: nextIndex,
        isExerciseActive: true,
        isRestActive: false,
        exerciseTimeRemaining: exercises[nextIndex]?.duration_seconds || 0,
      };
    });
  }, [exercises, onWorkoutComplete]);

  const resetWorkout = useCallback(() => {
    setTimerState({
      currentExerciseIndex: 0,
      isExerciseActive: false,
      isRestActive: false,
      exerciseTimeRemaining: exercises[0]?.duration_seconds || 0,
      restTimeRemaining: 0,
      totalWorkoutTime: 0,
      isPaused: false,
      isCompleted: false,
    });
  }, [exercises]);

  // Main timer tick
  useInterval(() => {
    if (timerState.isPaused || timerState.isCompleted) return;

    setTimerState(prev => {
      // Increment total workout time
      const newTotalTime = prev.totalWorkoutTime + 1;

      // Handle exercise timer
      if (prev.isExerciseActive && prev.exerciseTimeRemaining > 0) {
        const newExerciseTime = prev.exerciseTimeRemaining - 1;

        if (newExerciseTime === 0) {
          // Exercise complete, start rest period
          const restTime = exercises[prev.currentExerciseIndex]?.rest_seconds || 0;

          if (restTime > 0) {
            return {
              ...prev,
              isExerciseActive: false,
              isRestActive: true,
              exerciseTimeRemaining: 0,
              restTimeRemaining: restTime,
              totalWorkoutTime: newTotalTime,
            };
          } else {
            // No rest, move to next exercise
            const nextIndex = prev.currentExerciseIndex + 1;

            if (nextIndex >= exercises.length) {
              onWorkoutComplete?.();
              return {
                ...prev,
                isExerciseActive: false,
                isRestActive: false,
                isCompleted: true,
                totalWorkoutTime: newTotalTime,
              };
            }

            return {
              ...prev,
              currentExerciseIndex: nextIndex,
              exerciseTimeRemaining: exercises[nextIndex]?.duration_seconds || 0,
              totalWorkoutTime: newTotalTime,
            };
          }
        }

        return {
          ...prev,
          exerciseTimeRemaining: newExerciseTime,
          totalWorkoutTime: newTotalTime,
        };
      }

      // Handle rest timer
      if (prev.isRestActive && prev.restTimeRemaining > 0) {
        const newRestTime = prev.restTimeRemaining - 1;

        if (newRestTime === 0) {
          // Rest complete, move to next exercise
          const nextIndex = prev.currentExerciseIndex + 1;

          if (nextIndex >= exercises.length) {
            onWorkoutComplete?.();
            return {
              ...prev,
              isExerciseActive: false,
              isRestActive: false,
              isCompleted: true,
              totalWorkoutTime: newTotalTime,
            };
          }

          return {
            ...prev,
            currentExerciseIndex: nextIndex,
            isExerciseActive: true,
            isRestActive: false,
            exerciseTimeRemaining: exercises[nextIndex]?.duration_seconds || 0,
            restTimeRemaining: 0,
            totalWorkoutTime: newTotalTime,
          };
        }

        return {
          ...prev,
          restTimeRemaining: newRestTime,
          totalWorkoutTime: newTotalTime,
        };
      }

      // Count up mode (no duration specified)
      if (prev.isExerciseActive) {
        return {
          ...prev,
          totalWorkoutTime: newTotalTime,
        };
      }

      return prev;
    });
  }, timerState.isExerciseActive || timerState.isRestActive ? 1000 : null);

  return {
    ...timerState,
    startWorkout,
    pauseWorkout,
    resumeWorkout,
    skipExercise,
    skipRest,
    resetWorkout,
  };
};
