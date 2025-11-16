export interface AudioConfig {
  enabled: boolean;
  voiceAnnouncements: boolean;
  soundEffects: boolean;
  volume: number; // 0-100
  voice: 'male' | 'female' | 'system';
  voiceSpeed: number; // 0.5-2.0
  announceIntervals: number[]; // seconds [30, 10, 5, 3, 2, 1]
  announceSetCompletions: boolean;
  announceRestPeriods: boolean;
  announceWorkoutPhases: boolean; // warm-up, main, cool-down
  musicDucking: boolean; // Lower music volume during announcements
  duckingLevel: number; // 0-100
}

export const defaultAudioConfig: AudioConfig = {
  enabled: true,
  voiceAnnouncements: true,
  soundEffects: true,
  volume: 80,
  voice: 'system',
  voiceSpeed: 1.0,
  announceIntervals: [30, 10, 5, 3, 2, 1],
  announceSetCompletions: true,
  announceRestPeriods: true,
  announceWorkoutPhases: true,
  musicDucking: true,
  duckingLevel: 40,
};

export const SOUND_EFFECTS = {
  SET_COMPLETE: '/sounds/set-complete.mp3',
  WORKOUT_START: '/sounds/workout-start.mp3',
  WORKOUT_COMPLETE: '/sounds/workout-complete.mp3',
  REST_START: '/sounds/rest-start.mp3',
  REST_END: '/sounds/rest-end.mp3',
  COUNTDOWN_TICK: '/sounds/tick.mp3',
  COUNTDOWN_FINAL: '/sounds/beep.mp3',
  PR_ACHIEVED: '/sounds/achievement.mp3',
  HALFWAY: '/sounds/halfway.mp3',
} as const;

export type SoundEffectKey = keyof typeof SOUND_EFFECTS;

// Voice preferences mapping
export const VOICE_PREFERENCES = {
  male: {
    namePattern: /male|man|guy|dude/i,
    langCode: 'en-US',
    preferredNames: ['Google US English Male', 'Microsoft David', 'Alex'],
  },
  female: {
    namePattern: /female|woman|lady/i,
    langCode: 'en-US',
    preferredNames: ['Google US English Female', 'Microsoft Zira', 'Samantha', 'Victoria'],
  },
  system: {
    langCode: 'en-US',
    preferredNames: [],
  },
} as const;

// Audio event types for tracking
export type AudioEventType =
  | 'workout_start'
  | 'workout_complete'
  | 'exercise_start'
  | 'set_complete'
  | 'rest_start'
  | 'rest_countdown'
  | 'rest_end'
  | 'pr_achieved'
  | 'halfway_point';

// Priority levels for audio announcements
export type AnnouncementPriority = 'high' | 'normal' | 'low';

export const EVENT_PRIORITIES: Record<AudioEventType, AnnouncementPriority> = {
  workout_start: 'high',
  workout_complete: 'high',
  exercise_start: 'normal',
  set_complete: 'low',
  rest_start: 'normal',
  rest_countdown: 'high',
  rest_end: 'high',
  pr_achieved: 'high',
  halfway_point: 'normal',
};
