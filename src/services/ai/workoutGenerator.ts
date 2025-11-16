/**
 * AI Workout Generator Service
 * Generates personalized workouts using Anthropic Claude
 */

import { supabase } from "@/integrations/supabase/client";
import { generateWorkoutWithClaude, parseAIResponse, logAIGeneration, AnthropicError } from "@/lib/ai";
import { createWorkout } from "@/services/workout/workoutCrud";
import { fetchExercises } from "@/services/workout/exerciseLibrary";
import { MUSCLE_GROUPS, EQUIPMENT_TYPES } from "@/types/workout";

export interface WorkoutGenerationParams {
  userId: string;
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  duration: number; // minutes
  equipment: string[];
  targetMuscleGroups?: string[];
  workoutType?: string;
  specialRequests?: string;
  injuriesLimitations?: string;
}

export interface AIWorkoutPlan {
  title: string;
  description: string;
  workoutType: string;
  targetMuscleGroups: string[];
  difficultyLevel: string;
  estimatedDuration: number;
  caloriesEstimate: number;
  exercises: Array<{
    exerciseName: string;
    sets: number;
    reps: number;
    restSeconds: number;
    notes: string;
    equipment: string[];
  }>;
  warmUp?: string;
  coolDown?: string;
  safetyNotes?: string;
}

export interface AIWorkoutPreferences {
  user_id: string;
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  available_equipment: string[];
  workout_duration_preference: 15 | 30 | 45 | 60 | 90;
  days_per_week: number;
  injuries_limitations?: string;
}

/**
 * Builds a comprehensive system prompt for workout generation
 */
function buildSystemPrompt(): string {
  return `You are an expert personal trainer and exercise physiologist with extensive knowledge in:
- Exercise science and biomechanics
- Program design for various fitness levels
- Proper form and injury prevention
- Progressive overload principles
- Workout periodization

Your role is to create safe, effective, and personalized workout plans based on user requirements.

IMPORTANT SAFETY GUIDELINES:
1. Always recommend proper warm-up and cool-down
2. Consider user's fitness level and adjust intensity accordingly
3. Flag any exercises that may be risky for reported injuries
4. Ensure proper exercise progression
5. Include rest periods appropriate for the workout type
6. Never recommend exercises beyond the user's equipment availability

You must respond ONLY with valid JSON in the exact format specified. Do not include any explanatory text before or after the JSON.`;
}

/**
 * Builds the user prompt for workout generation
 */
async function buildUserPrompt(params: WorkoutGenerationParams): Promise<string> {
  // Fetch available exercises to include in prompt
  const exercises = await fetchExercises(params.userId);
  const exerciseNames = exercises.map(e => e.name).slice(0, 50); // Limit to first 50 to keep prompt reasonable

  const prompt = `Generate a personalized workout plan with the following requirements:

USER PROFILE:
- Fitness Level: ${params.fitnessLevel}
- Goals: ${params.goals.join(', ')}
- Available Duration: ${params.duration} minutes
- Available Equipment: ${params.equipment.length > 0 ? params.equipment.join(', ') : 'Bodyweight only'}
${params.targetMuscleGroups ? `- Target Muscle Groups: ${params.targetMuscleGroups.join(', ')}` : ''}
${params.workoutType ? `- Preferred Workout Type: ${params.workoutType}` : ''}
${params.injuriesLimitations ? `- Injuries/Limitations: ${params.injuriesLimitations}` : ''}
${params.specialRequests ? `- Special Requests: ${params.specialRequests}` : ''}

AVAILABLE EXERCISES IN OUR LIBRARY:
${exerciseNames.join(', ')}

IMPORTANT: Please choose exercises ONLY from the available exercises list above. If you need to suggest an exercise not in the list, use the closest match available.

Please generate a complete workout plan in the following JSON format:
{
  "title": "Catchy workout title",
  "description": "Brief description of the workout (2-3 sentences)",
  "workoutType": "Type of workout (Strength, Cardio, HIIT, Circuit, etc.)",
  "targetMuscleGroups": ["Array", "of", "muscle groups"],
  "difficultyLevel": "beginner|intermediate|advanced",
  "estimatedDuration": ${params.duration},
  "caloriesEstimate": estimated_calories_as_number,
  "exercises": [
    {
      "exerciseName": "Name from available exercises list",
      "sets": number_of_sets,
      "reps": number_of_reps,
      "restSeconds": rest_time_in_seconds,
      "notes": "Form cues and tips",
      "equipment": ["required", "equipment"]
    }
  ],
  "warmUp": "Recommended warm-up routine (2-3 sentences)",
  "coolDown": "Recommended cool-down routine (2-3 sentences)",
  "safetyNotes": "Important safety considerations for this workout"
}

GUIDELINES:
1. Match the workout to the user's fitness level
2. Ensure total workout time fits within ${params.duration} minutes (including rest)
3. Only use equipment from: ${params.equipment.length > 0 ? params.equipment.join(', ') : 'Bodyweight'}
4. Include 5-8 exercises for optimal workout length
5. Set appropriate rep ranges: Beginner (12-15), Intermediate (8-12), Advanced (6-10)
6. Include proper rest periods: Strength (60-90s), HIIT (15-30s), Cardio (30-45s)
7. Consider any injuries/limitations mentioned
8. Ensure progressive difficulty in exercise order
9. Always include warm-up and cool-down recommendations
10. Provide helpful form cues in exercise notes

Return ONLY the JSON object, no additional text.`;

  return prompt;
}

/**
 * Generates a fallback workout if AI fails
 */
function generateFallbackWorkout(params: WorkoutGenerationParams): AIWorkoutPlan {
  const isBodyweightOnly = params.equipment.length === 0 ||
    (params.equipment.length === 1 && params.equipment[0] === 'Bodyweight');

  // Simple beginner-friendly workout
  const exercises = isBodyweightOnly ? [
    { exerciseName: 'Push-ups', sets: 3, reps: 10, restSeconds: 60, notes: 'Keep core tight, full range of motion', equipment: ['Bodyweight'] },
    { exerciseName: 'Squats', sets: 3, reps: 15, restSeconds: 60, notes: 'Chest up, knees over toes', equipment: ['Bodyweight'] },
    { exerciseName: 'Plank', sets: 3, reps: 30, restSeconds: 45, notes: 'Hold 30 seconds, maintain straight line', equipment: ['Bodyweight'] },
    { exerciseName: 'Lunges', sets: 3, reps: 10, restSeconds: 60, notes: '10 reps each leg, control the descent', equipment: ['Bodyweight'] },
    { exerciseName: 'Mountain Climbers', sets: 3, reps: 20, restSeconds: 45, notes: 'Maintain plank position throughout', equipment: ['Bodyweight'] },
  ] : [
    { exerciseName: 'Squats', sets: 3, reps: 12, restSeconds: 60, notes: 'Focus on form and depth', equipment: ['Bodyweight'] },
    { exerciseName: 'Push-ups', sets: 3, reps: 10, restSeconds: 60, notes: 'Modify on knees if needed', equipment: ['Bodyweight'] },
    { exerciseName: 'Dumbbell Rows', sets: 3, reps: 12, restSeconds: 60, notes: 'Pull to hip, control the weight', equipment: ['Dumbbells'] },
    { exerciseName: 'Shoulder Press', sets: 3, reps: 10, restSeconds: 60, notes: 'Press overhead, core engaged', equipment: ['Dumbbells'] },
    { exerciseName: 'Plank', sets: 3, reps: 30, restSeconds: 45, notes: 'Hold for 30 seconds', equipment: ['Bodyweight'] },
  ];

  return {
    title: `${params.fitnessLevel.charAt(0).toUpperCase() + params.fitnessLevel.slice(1)} Full Body Workout`,
    description: `A balanced full-body workout designed for ${params.fitnessLevel} level. This workout targets all major muscle groups and can be completed in ${params.duration} minutes.`,
    workoutType: 'Strength',
    targetMuscleGroups: ['Full Body', 'Core'],
    difficultyLevel: params.fitnessLevel,
    estimatedDuration: params.duration,
    caloriesEstimate: Math.round(params.duration * 5), // Rough estimate
    exercises,
    warmUp: '5-10 minutes of light cardio (jumping jacks, jogging in place) followed by dynamic stretching',
    coolDown: '5 minutes of static stretching focusing on all major muscle groups worked',
    safetyNotes: 'Focus on proper form over speed. Stop if you feel pain (not to be confused with muscle fatigue). Stay hydrated throughout.'
  };
}

/**
 * Validates the AI-generated workout plan
 */
function validateWorkoutPlan(plan: AIWorkoutPlan, params: WorkoutGenerationParams): string[] {
  const errors: string[] = [];

  if (!plan.title || plan.title.length < 3) {
    errors.push('Invalid workout title');
  }

  if (!plan.exercises || plan.exercises.length === 0) {
    errors.push('No exercises in workout plan');
  }

  if (plan.exercises && plan.exercises.length > 15) {
    errors.push('Too many exercises (max 15)');
  }

  plan.exercises?.forEach((exercise, index) => {
    if (!exercise.exerciseName) {
      errors.push(`Exercise ${index + 1}: Missing exercise name`);
    }
    if (exercise.sets && (exercise.sets < 1 || exercise.sets > 10)) {
      errors.push(`Exercise ${index + 1}: Invalid sets count (${exercise.sets})`);
    }
    if (exercise.reps && (exercise.reps < 1 || exercise.reps > 100)) {
      errors.push(`Exercise ${index + 1}: Invalid reps count (${exercise.reps})`);
    }
  });

  return errors;
}

/**
 * Generates a personalized workout using AI
 */
export async function generateWorkoutWithAI(
  params: WorkoutGenerationParams
): Promise<AIWorkoutPlan> {
  console.log('[AI Workout Generator] Starting generation with params:', params);

  try {
    const systemPrompt = buildSystemPrompt();
    const userPrompt = await buildUserPrompt(params);

    console.log('[AI Workout Generator] Calling Claude API...');
    const response = await generateWorkoutWithClaude(userPrompt, systemPrompt);

    console.log('[AI Workout Generator] Parsing AI response...');
    const workoutPlan = parseAIResponse<AIWorkoutPlan>(response);

    // Validate the workout plan
    const validationErrors = validateWorkoutPlan(workoutPlan, params);
    if (validationErrors.length > 0) {
      console.warn('[AI Workout Generator] Validation errors:', validationErrors);
      // Use fallback if validation fails
      console.log('[AI Workout Generator] Using fallback workout due to validation errors');
      return generateFallbackWorkout(params);
    }

    logAIGeneration(params.userId, userPrompt, response, true);
    console.log('[AI Workout Generator] Successfully generated workout:', workoutPlan.title);

    return workoutPlan;
  } catch (error) {
    console.error('[AI Workout Generator] Error generating workout:', error);

    if (error instanceof AnthropicError) {
      logAIGeneration(params.userId, '', '', false, error.message);
    }

    // Use fallback workout on any error
    console.log('[AI Workout Generator] Using fallback workout due to error');
    return generateFallbackWorkout(params);
  }
}

/**
 * Saves generated workout to database
 */
export async function saveGeneratedWorkout(
  userId: string,
  workoutPlan: AIWorkoutPlan,
  prompt: string,
  modelUsed: string = 'anthropic-claude-3-5-sonnet'
): Promise<string> {
  try {
    console.log('[AI Workout Generator] Saving workout to database...');

    // Create the workout
    const workout = await createWorkout({
      workout: {
        user_id: userId,
        title: workoutPlan.title,
        description: workoutPlan.description,
        duration_minutes: workoutPlan.estimatedDuration,
        difficulty: workoutPlan.difficultyLevel,
        workout_type: workoutPlan.workoutType,
        target_muscle_groups: workoutPlan.targetMuscleGroups,
        equipment_needed: Array.from(new Set(
          workoutPlan.exercises.flatMap(e => e.equipment || [])
        )),
        calories_estimate: workoutPlan.caloriesEstimate,
        is_favorite: false,
        is_template: false,
      },
      exercises: workoutPlan.exercises.map((exercise, index) => ({
        exercise_name: exercise.exerciseName,
        sets: exercise.sets,
        reps: exercise.reps,
        rest_seconds: exercise.restSeconds,
        notes: `${exercise.notes}\n\nWarm-up: ${workoutPlan.warmUp}\nCool-down: ${workoutPlan.coolDown}\nSafety: ${workoutPlan.safetyNotes}`,
        order_index: index,
      })),
    });

    // Record AI generation metadata
    const { error: aiRecordError } = await supabase
      .from('ai_generated_workouts')
      .insert({
        user_id: userId,
        workout_id: workout.id,
        prompt_used: prompt,
        ai_model_used: modelUsed,
      });

    if (aiRecordError) {
      console.warn('[AI Workout Generator] Failed to record AI metadata:', aiRecordError);
      // Don't fail the whole operation if metadata recording fails
    }

    console.log('[AI Workout Generator] Workout saved successfully, ID:', workout.id);
    return workout.id;
  } catch (error) {
    console.error('[AI Workout Generator] Error saving workout:', error);
    throw error;
  }
}

/**
 * Saves user's AI workout preferences
 */
export async function saveAIPreferences(
  userId: string,
  preferences: Omit<AIWorkoutPreferences, 'user_id'>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('ai_workout_preferences')
      .upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
    console.log('[AI Workout Generator] Preferences saved successfully');
  } catch (error) {
    console.error('[AI Workout Generator] Error saving preferences:', error);
    throw error;
  }
}

/**
 * Fetches user's AI workout preferences
 */
export async function getAIPreferences(userId: string): Promise<AIWorkoutPreferences | null> {
  try {
    const { data, error } = await supabase
      .from('ai_workout_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No preferences found
        return null;
      }
      throw error;
    }

    return data as AIWorkoutPreferences;
  } catch (error) {
    console.error('[AI Workout Generator] Error fetching preferences:', error);
    return null;
  }
}

/**
 * Fetches user's AI-generated workouts
 */
export async function getAIGeneratedWorkouts(userId: string, limit: number = 10) {
  try {
    const { data, error } = await supabase
      .from('ai_generated_workouts')
      .select(`
        *,
        workout:workouts(*)
      `)
      .eq('user_id', userId)
      .order('generation_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('[AI Workout Generator] Error fetching AI workouts:', error);
    throw error;
  }
}
