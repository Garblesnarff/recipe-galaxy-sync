-- AI Workout Generation Tables

-- AI Workout Preferences Table
CREATE TABLE ai_workout_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  fitness_level TEXT NOT NULL CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  available_equipment JSONB NOT NULL DEFAULT '[]'::jsonb,
  workout_duration_preference INTEGER NOT NULL CHECK (workout_duration_preference IN (15, 30, 45, 60, 90)),
  days_per_week INTEGER NOT NULL CHECK (days_per_week BETWEEN 1 AND 7),
  injuries_limitations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- AI Generated Workouts Table
CREATE TABLE ai_generated_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  prompt_used TEXT NOT NULL,
  ai_model_used TEXT NOT NULL CHECK (ai_model_used IN ('openai-gpt-4', 'anthropic-claude-3', 'anthropic-claude-3-5-sonnet')),
  generation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_ai_workout_preferences_user_id ON ai_workout_preferences(user_id);
CREATE INDEX idx_ai_generated_workouts_user_id ON ai_generated_workouts(user_id);
CREATE INDEX idx_ai_generated_workouts_workout_id ON ai_generated_workouts(workout_id);
CREATE INDEX idx_ai_generated_workouts_generation_timestamp ON ai_generated_workouts(generation_timestamp);

-- Enable Row Level Security
ALTER TABLE ai_workout_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_generated_workouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_workout_preferences
CREATE POLICY "Users can view their own AI preferences"
  ON ai_workout_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AI preferences"
  ON ai_workout_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI preferences"
  ON ai_workout_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI preferences"
  ON ai_workout_preferences FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for ai_generated_workouts
CREATE POLICY "Users can view their own AI generated workouts"
  ON ai_generated_workouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own AI generated workouts"
  ON ai_generated_workouts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own AI generated workouts"
  ON ai_generated_workouts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own AI generated workouts"
  ON ai_generated_workouts FOR DELETE
  USING (user_id = auth.uid());

-- Add comments for documentation
COMMENT ON TABLE ai_workout_preferences IS 'Stores user preferences for AI workout generation';
COMMENT ON TABLE ai_generated_workouts IS 'Tracks all AI-generated workouts with prompt and model information';
COMMENT ON COLUMN ai_workout_preferences.fitness_level IS 'User fitness level: beginner, intermediate, or advanced';
COMMENT ON COLUMN ai_workout_preferences.goals IS 'Array of fitness goals: weight_loss, muscle_gain, endurance, strength, flexibility';
COMMENT ON COLUMN ai_workout_preferences.available_equipment IS 'Array of equipment available to the user';
COMMENT ON COLUMN ai_workout_preferences.workout_duration_preference IS 'Preferred workout duration in minutes: 15, 30, 45, 60, or 90';
COMMENT ON COLUMN ai_workout_preferences.days_per_week IS 'Number of workout days per week (1-7)';
COMMENT ON COLUMN ai_workout_preferences.injuries_limitations IS 'Any injuries or physical limitations to consider';
