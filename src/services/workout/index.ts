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

// Personal Records operations
export {
  detectNewPR,
  savePersonalRecord,
  getPersonalRecords,
  getExercisePRs,
  deletePersonalRecord,
  autoDetectAndSavePRs,
} from "./personalRecords";

// Analytics operations
export {
  getWeightProgressionChart,
  getVolumeProgression,
  getMuscleGroupBalance,
  getStrengthScore,
  getWorkoutFrequencyStats,
  getConsistencyScore,
  getDailyWorkoutFrequency,
} from "./analytics";

// Gamification operations
export {
  getUserStats,
  updateUserStats,
  awardPoints,
  getAllAchievements,
  getEarnedAchievements,
  getAvailableAchievements,
  checkAchievements,
  getCurrentStreak,
  getWorkoutCalendar,
  calculateLevel,
  getPointsForNextLevel,
  getLevelProgress,
} from "./gamification";

export type {
  Achievement,
  UserAchievement,
  UserStats,
  AchievementProgress,
} from "./gamification";
