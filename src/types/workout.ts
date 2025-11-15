// Workout Form Data Interface
export interface WorkoutFormData {
  title: string;
  description: string;
  duration_minutes: number;
  difficulty: string;
  workout_type: string;
  target_muscle_groups: string[];
  equipment_needed: string[];
  calories_estimate: number;
  image_url: string;
  is_template: boolean;
}

// Exercise Form Data Interface
export interface ExerciseFormData {
  exercise_name: string;
  sets: number;
  reps: number;
  duration_seconds: number;
  rest_seconds: number;
  weight_kg: number;
  notes: string;
  order_index: number;
}

// Workout Exercise Interface
export interface WorkoutExercise {
  id: string;
  workout_id: string;
  exercise_name: string;
  sets?: number;
  reps?: number;
  duration_seconds?: number;
  rest_seconds?: number;
  weight_kg?: number;
  notes?: string;
  order_index: number;
  created_at?: string;
}

// Exercise Library Interface
export interface Exercise {
  id: string;
  name: string;
  description?: string;
  muscle_groups: string[];
  equipment: string[];
  difficulty?: string;
  category: string;
  video_url?: string;
  instructions?: string;
  is_custom: boolean;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Workout Interface
export interface Workout {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  duration_minutes?: number;
  difficulty?: string;
  workout_type?: string;
  target_muscle_groups: string[];
  equipment_needed: string[];
  calories_estimate?: number;
  image_url?: string;
  is_favorite?: boolean;
  is_template?: boolean;
  created_at?: string;
  updated_at?: string;
  exercises?: WorkoutExercise[];
}

// Workout Template Interface (same as Workout but with is_template always true)
export interface WorkoutTemplate extends Workout {
  is_template: true;
}

// Workout Log Exercise Interface
export interface WorkoutLogExercise {
  id: string;
  workout_log_id: string;
  exercise_name: string;
  sets_completed?: number;
  reps_achieved: number[];
  weight_used: number[];
  duration_seconds?: number;
  notes?: string;
  created_at?: string;
}

// Workout Log Interface
export interface WorkoutLog {
  id: string;
  workout_id?: string;
  user_id: string;
  completed_at: string;
  duration_minutes?: number;
  notes?: string;
  calories_burned?: number;
  created_at?: string;
  exercises?: WorkoutLogExercise[];
  workout?: Workout;
}

// Workout Filters Interface
export interface WorkoutFilters {
  workout_types: string[];
  difficulty: string | null;
  target_muscle_groups: string[];
  equipment_needed: string[];
  favorite_only: boolean;
  template_only: boolean;
  searchQuery: string;
}

// Exercise Filters Interface
export interface ExerciseFilters {
  categories: string[];
  muscle_groups: string[];
  equipment: string[];
  difficulty: string | null;
  custom_only: boolean;
  searchQuery: string;
}

// Sort Option Interface
export interface WorkoutSortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

// Constants - Difficulty Levels
export const DIFFICULTY_LEVELS = [
  "Beginner",
  "Intermediate",
  "Advanced",
  "Expert"
];

// Constants - Workout Types
export const WORKOUT_TYPES = [
  "Strength",
  "Cardio",
  "HIIT",
  "Circuit",
  "Flexibility",
  "Yoga",
  "Pilates",
  "CrossFit",
  "Bodybuilding",
  "Powerlifting",
  "Calisthenics",
  "Sports-Specific",
  "Recovery",
  "Endurance"
];

// Constants - Muscle Groups
export const MUSCLE_GROUPS = [
  "Chest",
  "Back",
  "Shoulders",
  "Biceps",
  "Triceps",
  "Forearms",
  "Core",
  "Obliques",
  "Quadriceps",
  "Hamstrings",
  "Glutes",
  "Calves",
  "Hip Flexors",
  "Traps",
  "Lats",
  "Full Body"
];

// Constants - Equipment Types
export const EQUIPMENT_TYPES = [
  "Bodyweight",
  "Dumbbells",
  "Barbell",
  "Kettlebell",
  "Resistance Bands",
  "Pull-up Bar",
  "Bench",
  "Cable Machine",
  "Smith Machine",
  "Squat Rack",
  "Medicine Ball",
  "Jump Rope",
  "Plyo Box",
  "TRX",
  "Rowing Machine",
  "Treadmill",
  "Stationary Bike",
  "Elliptical",
  "Foam Roller",
  "Yoga Mat"
];

// Constants - Exercise Categories
export const EXERCISE_CATEGORIES = [
  "Strength",
  "Cardio",
  "Core",
  "Plyometric",
  "Flexibility",
  "Balance",
  "Olympic Lift",
  "Compound",
  "Isolation",
  "Functional",
  "Stretching",
  "Warm-up",
  "Cool-down"
];

// Constants - Sort Options
export const WORKOUT_SORT_OPTIONS: WorkoutSortOption[] = [
  { label: "Recently Added", value: "created_at", direction: "desc" },
  { label: "Oldest First", value: "created_at", direction: "asc" },
  { label: "Alphabetical (A-Z)", value: "title", direction: "asc" },
  { label: "Alphabetical (Z-A)", value: "title", direction: "desc" },
  { label: "Duration (Short first)", value: "duration_minutes", direction: "asc" },
  { label: "Duration (Long first)", value: "duration_minutes", direction: "desc" },
  { label: "Calories (Low to High)", value: "calories_estimate", direction: "asc" },
  { label: "Calories (High to Low)", value: "calories_estimate", direction: "desc" },
];
