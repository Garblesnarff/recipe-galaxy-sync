import { formatTimeForAnnouncement } from '@/utils/audioUtils';

export const ANNOUNCEMENTS = {
  WORKOUT_START: [
    "Let's do this!",
    "Time to get stronger!",
    "Ready to crush this workout!",
    "Let's make it happen!",
    "Time to show what you're made of!",
  ],

  SET_COMPLETE: [
    "Great set!",
    "Nice work!",
    "Keep it up!",
    "Excellent!",
    "Well done!",
    "That's how it's done!",
    "Strong finish!",
  ],

  REST_START: (duration: number) => [
    `Rest for ${formatTimeForAnnouncement(duration)}`,
    `Take ${formatTimeForAnnouncement(duration)} to recover`,
    `${formatTimeForAnnouncement(duration)} rest period begins`,
    `Recover for ${formatTimeForAnnouncement(duration)}`,
  ],

  REST_COUNTDOWN: (remaining: number) => [
    `${remaining} seconds`,
    `${remaining}`,
  ],

  REST_END: [
    "Rest is over, time to go!",
    "Get ready!",
    "Back to work!",
    "Let's go!",
    "Time to continue!",
  ],

  HALFWAY: [
    "You're halfway there!",
    "Halfway done, keep pushing!",
    "Great progress, you're at the halfway point!",
    "50% complete, keep going strong!",
  ],

  WORKOUT_COMPLETE: [
    "Workout complete! Great job!",
    "You did it! Awesome work!",
    "Congratulations! Workout finished!",
    "Fantastic effort! You crushed it!",
    "Well done! You completed your workout!",
  ],

  PR_ACHIEVED: (exercise: string, record: string) => [
    `New personal record on ${exercise}: ${record}!`,
    `Congratulations! You just set a new PR: ${record} on ${exercise}!`,
    `Amazing! New ${exercise} personal best: ${record}!`,
  ],

  EXERCISE_START: (name: string, sets: number, reps?: number) => {
    const repsText = reps ? ` for ${reps} reps` : '';
    return [
      `Starting ${name}. ${sets} sets${repsText}`,
      `Next up: ${name}. ${sets} sets${repsText}`,
      `Time for ${name}. ${sets} sets to complete${repsText}`,
    ];
  },

  SET_NUMBER: (current: number, total: number) => [
    `Set ${current} of ${total}`,
    `Starting set ${current} of ${total}`,
  ],

  FINAL_SET: [
    "Final set! Give it everything you've got!",
    "Last set! Make it count!",
    "One more set to go!",
  ],

  GET_READY: [
    "Get ready",
    "Prepare yourself",
    "Almost time",
  ],

  PHASE_WARMUP: [
    "Starting warm-up",
    "Warm-up phase beginning",
    "Let's warm up those muscles",
  ],

  PHASE_MAIN: [
    "Main workout begins now",
    "Let's get into the main workout",
    "Time for the main event",
  ],

  PHASE_COOLDOWN: [
    "Starting cool-down",
    "Time to cool down",
    "Cool-down phase begins",
  ],

  MOTIVATION_HIGH_INTENSITY: [
    "Push through!",
    "You've got this!",
    "Stay strong!",
    "Keep that intensity up!",
    "Don't stop now!",
  ],

  MOTIVATION_ENDURANCE: [
    "Maintain your pace!",
    "Steady and strong!",
    "You're doing great!",
    "Keep that rhythm!",
    "Consistent effort!",
  ],
} as const;

// Get random announcement from array
export function getRandomAnnouncement<T extends string | string[]>(
  announcements: T[] | (((...args: any[]) => T[]))
): T {
  const arr = typeof announcements === 'function' ? announcements() : announcements;
  return arr[Math.floor(Math.random() * arr.length)];
}

// Get announcement based on context
export function getWorkoutStartAnnouncement(workoutName?: string): string {
  const base = getRandomAnnouncement(ANNOUNCEMENTS.WORKOUT_START);
  return workoutName ? `${base} Starting ${workoutName}` : base;
}

export function getExerciseStartAnnouncement(
  exerciseName: string,
  sets: number,
  reps?: number
): string {
  const options = ANNOUNCEMENTS.EXERCISE_START(exerciseName, sets, reps);
  return getRandomAnnouncement(options);
}

export function getSetCompleteAnnouncement(
  setNumber: number,
  totalSets: number
): string {
  if (setNumber === totalSets) {
    return getRandomAnnouncement(ANNOUNCEMENTS.FINAL_SET);
  }
  return getRandomAnnouncement(ANNOUNCEMENTS.SET_COMPLETE);
}

export function getRestStartAnnouncement(durationSeconds: number): string {
  const options = ANNOUNCEMENTS.REST_START(durationSeconds);
  return getRandomAnnouncement(options);
}

export function getRestEndAnnouncement(): string {
  return getRandomAnnouncement(ANNOUNCEMENTS.REST_END);
}

export function getPRAnnouncement(exercise: string, record: string): string {
  const options = ANNOUNCEMENTS.PR_ACHIEVED(exercise, record);
  return getRandomAnnouncement(options);
}

export function getWorkoutCompleteAnnouncement(stats?: {
  duration?: number;
  setsCompleted?: number;
}): string {
  const base = getRandomAnnouncement(ANNOUNCEMENTS.WORKOUT_COMPLETE);

  if (stats?.duration) {
    const minutes = Math.floor(stats.duration / 60);
    return `${base} Total time: ${minutes} minutes.`;
  }

  return base;
}

export function getHalfwayAnnouncement(): string {
  return getRandomAnnouncement(ANNOUNCEMENTS.HALFWAY);
}
