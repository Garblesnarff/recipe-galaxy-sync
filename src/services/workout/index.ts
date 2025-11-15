// Workout CRUD operations
export {
  fetchWorkouts,
  fetchWorkoutById,
  createWorkout,
  updateWorkout,
  deleteWorkout,
  toggleWorkoutFavorite,
} from "./workoutCrud";

// Exercise Library operations
export {
  fetchExercises,
  fetchExerciseByName,
  createCustomExercise,
  updateCustomExercise,
  deleteCustomExercise,
} from "./exerciseLibrary";

// Workout Template operations
export {
  fetchTemplates,
  cloneTemplate,
} from "./workoutTemplates";

// Workout Logger operations
export {
  logWorkout,
  fetchWorkoutLogs,
  updateWorkoutLog,
  deleteWorkoutLog,
} from "./workoutLogger";

// Workout Statistics operations
export {
  fetchWorkoutStats,
  fetchExerciseProgress,
  fetchWeeklyActivity,
  fetchPersonalRecords,
} from "./workoutStats";
