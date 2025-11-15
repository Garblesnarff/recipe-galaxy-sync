-- Create workout-related tables

-- Exercise Library Table
CREATE TABLE exercise_library (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment TEXT[] NOT NULL DEFAULT '{}',
  difficulty TEXT,
  category TEXT NOT NULL,
  video_url TEXT,
  instructions TEXT,
  is_custom BOOLEAN DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_custom_user CHECK (
    (is_custom = true AND user_id IS NOT NULL) OR
    (is_custom = false AND user_id IS NULL)
  )
);

-- Workouts Table
CREATE TABLE workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  difficulty TEXT,
  workout_type TEXT,
  target_muscle_groups TEXT[] NOT NULL DEFAULT '{}',
  equipment_needed TEXT[] NOT NULL DEFAULT '{}',
  calories_estimate INTEGER,
  image_url TEXT,
  is_favorite BOOLEAN DEFAULT false,
  is_template BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Exercises Table
CREATE TABLE workout_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets INTEGER,
  reps INTEGER,
  duration_seconds INTEGER,
  rest_seconds INTEGER,
  weight_kg NUMERIC(6, 2),
  notes TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Logs Table
CREATE TABLE workout_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  duration_minutes INTEGER,
  notes TEXT,
  calories_burned INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Log Exercises Table
CREATE TABLE workout_log_exercises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  sets_completed INTEGER,
  reps_achieved INTEGER[] NOT NULL DEFAULT '{}',
  weight_used NUMERIC(6, 2)[] NOT NULL DEFAULT '{}',
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_exercise_library_user_id ON exercise_library(user_id);
CREATE INDEX idx_exercise_library_category ON exercise_library(category);
CREATE INDEX idx_exercise_library_is_custom ON exercise_library(is_custom);

CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workouts_is_template ON workouts(is_template);
CREATE INDEX idx_workouts_is_favorite ON workouts(is_favorite);
CREATE INDEX idx_workouts_workout_type ON workouts(workout_type);
CREATE INDEX idx_workouts_created_at ON workouts(created_at);

CREATE INDEX idx_workout_exercises_workout_id ON workout_exercises(workout_id);
CREATE INDEX idx_workout_exercises_order_index ON workout_exercises(order_index);

CREATE INDEX idx_workout_logs_user_id ON workout_logs(user_id);
CREATE INDEX idx_workout_logs_workout_id ON workout_logs(workout_id);
CREATE INDEX idx_workout_logs_completed_at ON workout_logs(completed_at);

CREATE INDEX idx_workout_log_exercises_log_id ON workout_log_exercises(workout_log_id);

-- Enable Row Level Security
ALTER TABLE exercise_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_log_exercises ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_library
CREATE POLICY "Users can view all non-custom exercises"
  ON exercise_library FOR SELECT
  USING (is_custom = false OR user_id = auth.uid());

CREATE POLICY "Users can create their own custom exercises"
  ON exercise_library FOR INSERT
  WITH CHECK (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Users can update their own custom exercises"
  ON exercise_library FOR UPDATE
  USING (is_custom = true AND user_id = auth.uid());

CREATE POLICY "Users can delete their own custom exercises"
  ON exercise_library FOR DELETE
  USING (is_custom = true AND user_id = auth.uid());

-- RLS Policies for workouts
CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workouts"
  ON workouts FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for workout_exercises
CREATE POLICY "Users can view exercises in their workouts"
  ON workout_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises in their workouts"
  ON workout_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their workouts"
  ON workout_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises in their workouts"
  ON workout_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_exercises.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- RLS Policies for workout_logs
CREATE POLICY "Users can view their own workout logs"
  ON workout_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workout logs"
  ON workout_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workout logs"
  ON workout_logs FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workout logs"
  ON workout_logs FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for workout_log_exercises
CREATE POLICY "Users can view exercises in their workout logs"
  ON workout_log_exercises FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = workout_log_exercises.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create exercises in their workout logs"
  ON workout_log_exercises FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = workout_log_exercises.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update exercises in their workout logs"
  ON workout_log_exercises FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = workout_log_exercises.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete exercises in their workout logs"
  ON workout_log_exercises FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = workout_log_exercises.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

-- Insert sample exercises into exercise_library
INSERT INTO exercise_library (name, description, muscle_groups, equipment, difficulty, category, instructions, video_url, is_custom) VALUES
  ('Push-ups', 'Classic upper body exercise', ARRAY['Chest', 'Triceps', 'Shoulders'], ARRAY['Bodyweight'], 'Beginner', 'Strength', 'Start in plank position. Lower your body until chest nearly touches floor. Push back up.', 'https://www.youtube.com/watch?v=IODxDxX7oi4', false),
  ('Squats', 'Fundamental lower body exercise', ARRAY['Quadriceps', 'Glutes', 'Hamstrings'], ARRAY['Bodyweight'], 'Beginner', 'Strength', 'Stand with feet shoulder-width apart. Lower body as if sitting back into a chair. Return to standing.', 'https://www.youtube.com/watch?v=aclHkVaku9U', false),
  ('Plank', 'Core stability exercise', ARRAY['Core', 'Shoulders'], ARRAY['Bodyweight'], 'Beginner', 'Core', 'Hold your body in a straight line from head to heels, supported on forearms and toes.', 'https://www.youtube.com/watch?v=pSHjTRCQxIw', false),
  ('Burpees', 'Full body cardio exercise', ARRAY['Full Body'], ARRAY['Bodyweight'], 'Intermediate', 'Cardio', 'From standing, drop to plank, do a push-up, jump feet to hands, then jump up with arms overhead.', 'https://www.youtube.com/watch?v=TU8QYVW0gDU', false),
  ('Lunges', 'Lower body strength and balance', ARRAY['Quadriceps', 'Glutes', 'Hamstrings'], ARRAY['Bodyweight'], 'Beginner', 'Strength', 'Step forward with one leg, lowering hips until both knees bent at 90 degrees. Return to start.', 'https://www.youtube.com/watch?v=QOVaHwm-Q6U', false),
  ('Bench Press', 'Upper body pushing exercise', ARRAY['Chest', 'Triceps', 'Shoulders'], ARRAY['Barbell', 'Bench'], 'Intermediate', 'Strength', 'Lie on bench, lower barbell to chest, then press up to full arm extension.', 'https://www.youtube.com/watch?v=rT7DgCr-3pg', false),
  ('Deadlift', 'Posterior chain compound movement', ARRAY['Back', 'Glutes', 'Hamstrings'], ARRAY['Barbell'], 'Advanced', 'Strength', 'With barbell on ground, hinge at hips to grip bar, then stand up straight by extending hips and knees.', 'https://www.youtube.com/watch?v=op9kVnSso6Q', false),
  ('Pull-ups', 'Upper body pulling exercise', ARRAY['Back', 'Biceps'], ARRAY['Pull-up Bar'], 'Intermediate', 'Strength', 'Hang from bar with palms facing away, pull yourself up until chin over bar, lower with control.', 'https://www.youtube.com/watch?v=eGo4IYlbE5g', false),
  ('Mountain Climbers', 'Dynamic core and cardio exercise', ARRAY['Core', 'Shoulders'], ARRAY['Bodyweight'], 'Beginner', 'Cardio', 'From plank position, alternately drive knees toward chest in a running motion.', 'https://www.youtube.com/watch?v=nmwgirgXLYM', false),
  ('Dumbbell Rows', 'Back strengthening exercise', ARRAY['Back', 'Biceps'], ARRAY['Dumbbells'], 'Beginner', 'Strength', 'Bent over with one hand supported, pull dumbbell to hip while keeping elbow close to body.', 'https://www.youtube.com/watch?v=pYcpY20QaE8', false),
  ('Bicycle Crunches', 'Oblique-focused ab exercise', ARRAY['Core', 'Obliques'], ARRAY['Bodyweight'], 'Beginner', 'Core', 'Lying on back, bring opposite elbow to opposite knee in a cycling motion.', 'https://www.youtube.com/watch?v=Iwyvozckjak', false),
  ('Jump Rope', 'Cardiovascular endurance', ARRAY['Full Body', 'Calves'], ARRAY['Jump Rope'], 'Beginner', 'Cardio', 'Jump over rope as it passes under feet, maintaining steady rhythm.', 'https://www.youtube.com/watch?v=FJmRQ5iTXKE', false),
  ('Shoulder Press', 'Overhead pressing movement', ARRAY['Shoulders', 'Triceps'], ARRAY['Dumbbells'], 'Beginner', 'Strength', 'Press dumbbells overhead from shoulder height to full arm extension.', 'https://www.youtube.com/watch?v=qEwKCR5JCog', false),
  ('Russian Twists', 'Rotational core exercise', ARRAY['Core', 'Obliques'], ARRAY['Bodyweight'], 'Beginner', 'Core', 'Seated with feet elevated, rotate torso side to side, optionally holding weight.', 'https://www.youtube.com/watch?v=wkD8rjkodUI', false),
  ('Box Jumps', 'Explosive lower body exercise', ARRAY['Quadriceps', 'Glutes', 'Calves'], ARRAY['Plyo Box'], 'Intermediate', 'Plyometric', 'Jump onto elevated platform, landing softly with bent knees. Step down and repeat.', 'https://www.youtube.com/watch?v=NBY9-kTuHEk', false);

-- Insert sample workout templates
INSERT INTO workouts (user_id, title, description, duration_minutes, difficulty, workout_type, target_muscle_groups, equipment_needed, calories_estimate, is_template) VALUES
  (NULL, 'Beginner Full Body', 'A comprehensive full-body workout perfect for beginners', 30, 'Beginner', 'Strength', ARRAY['Full Body', 'Core'], ARRAY['Bodyweight'], 250, true),
  (NULL, '20-Minute HIIT Blast', 'High-intensity interval training for maximum calorie burn', 20, 'Intermediate', 'HIIT', ARRAY['Full Body'], ARRAY['Bodyweight'], 300, true),
  (NULL, 'Upper Body Strength', 'Build upper body strength with compound movements', 45, 'Intermediate', 'Strength', ARRAY['Chest', 'Back', 'Shoulders'], ARRAY['Dumbbells', 'Pull-up Bar'], 280, true),
  (NULL, 'Lower Body Power', 'Develop lower body strength and power', 40, 'Intermediate', 'Strength', ARRAY['Quadriceps', 'Glutes', 'Hamstrings'], ARRAY['Barbell', 'Bodyweight'], 320, true),
  (NULL, 'Core & Cardio Circuit', 'Combination of core strengthening and cardiovascular exercises', 25, 'Beginner', 'Circuit', ARRAY['Core', 'Full Body'], ARRAY['Bodyweight'], 200, true);

-- Insert exercises for "Beginner Full Body" workout template
INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, rest_seconds, order_index)
SELECT id, 'Push-ups', 3, 10, 60, 1 FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true
UNION ALL
SELECT id, 'Squats', 3, 15, 60, 2 FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true
UNION ALL
SELECT id, 'Plank', 3, NULL, 60, 3 FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true
UNION ALL
SELECT id, 'Lunges', 3, 10, 60, 4 FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true
UNION ALL
SELECT id, 'Mountain Climbers', 3, 20, 60, 5 FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true;

-- Update duration_seconds for plank in Beginner Full Body
UPDATE workout_exercises
SET duration_seconds = 30
WHERE exercise_name = 'Plank'
  AND workout_id IN (SELECT id FROM workouts WHERE title = 'Beginner Full Body' AND is_template = true);

-- Insert exercises for "20-Minute HIIT Blast" workout template
INSERT INTO workout_exercises (workout_id, exercise_name, duration_seconds, rest_seconds, order_index)
SELECT id, 'Burpees', 45, 15, 1 FROM workouts WHERE title = '20-Minute HIIT Blast' AND is_template = true
UNION ALL
SELECT id, 'Mountain Climbers', 45, 15, 2 FROM workouts WHERE title = '20-Minute HIIT Blast' AND is_template = true
UNION ALL
SELECT id, 'Jump Rope', 60, 30, 3 FROM workouts WHERE title = '20-Minute HIIT Blast' AND is_template = true
UNION ALL
SELECT id, 'Squats', 45, 15, 4 FROM workouts WHERE title = '20-Minute HIIT Blast' AND is_template = true
UNION ALL
SELECT id, 'Push-ups', 45, 15, 5 FROM workouts WHERE title = '20-Minute HIIT Blast' AND is_template = true;

-- Insert exercises for "Upper Body Strength" workout template
INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, rest_seconds, order_index)
SELECT id, 'Bench Press', 4, 8, 90, 1 FROM workouts WHERE title = 'Upper Body Strength' AND is_template = true
UNION ALL
SELECT id, 'Pull-ups', 4, 8, 90, 2 FROM workouts WHERE title = 'Upper Body Strength' AND is_template = true
UNION ALL
SELECT id, 'Shoulder Press', 3, 10, 75, 3 FROM workouts WHERE title = 'Upper Body Strength' AND is_template = true
UNION ALL
SELECT id, 'Dumbbell Rows', 3, 12, 75, 4 FROM workouts WHERE title = 'Upper Body Strength' AND is_template = true
UNION ALL
SELECT id, 'Push-ups', 3, 15, 60, 5 FROM workouts WHERE title = 'Upper Body Strength' AND is_template = true;

-- Insert exercises for "Lower Body Power" workout template
INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, rest_seconds, order_index)
SELECT id, 'Squats', 4, 10, 90, 1 FROM workouts WHERE title = 'Lower Body Power' AND is_template = true
UNION ALL
SELECT id, 'Deadlift', 4, 8, 120, 2 FROM workouts WHERE title = 'Lower Body Power' AND is_template = true
UNION ALL
SELECT id, 'Lunges', 3, 12, 75, 3 FROM workouts WHERE title = 'Lower Body Power' AND is_template = true
UNION ALL
SELECT id, 'Box Jumps', 3, 10, 90, 4 FROM workouts WHERE title = 'Lower Body Power' AND is_template = true;

-- Insert exercises for "Core & Cardio Circuit" workout template
INSERT INTO workout_exercises (workout_id, exercise_name, sets, reps, duration_seconds, rest_seconds, order_index)
SELECT id, 'Plank', 3, NULL, 45, 30, 1 FROM workouts WHERE title = 'Core & Cardio Circuit' AND is_template = true
UNION ALL
SELECT id, 'Bicycle Crunches', 3, 20, NULL, 30, 2 FROM workouts WHERE title = 'Core & Cardio Circuit' AND is_template = true
UNION ALL
SELECT id, 'Mountain Climbers', 3, NULL, 45, 30, 3 FROM workouts WHERE title = 'Core & Cardio Circuit' AND is_template = true
UNION ALL
SELECT id, 'Russian Twists', 3, 30, NULL, 30, 4 FROM workouts WHERE title = 'Core & Cardio Circuit' AND is_template = true
UNION ALL
SELECT id, 'Jump Rope', 3, NULL, 60, 45, 5 FROM workouts WHERE title = 'Core & Cardio Circuit' AND is_template = true;
