-- Create training programs tables

-- Training Programs Table
CREATE TABLE training_programs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  duration_weeks INTEGER NOT NULL,
  difficulty TEXT,
  goal TEXT, -- 'strength', 'endurance', 'weight_loss', 'muscle_gain'
  is_system_program BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Program Weeks Table
CREATE TABLE program_weeks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  focus TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(program_id, week_number)
);

-- Program Workouts Table
CREATE TABLE program_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  program_week_id UUID REFERENCES program_weeks(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL, -- 0-6 (Sunday-Saturday)
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User Program Enrollments Table
CREATE TABLE user_program_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id UUID REFERENCES training_programs(id) ON DELETE CASCADE NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  current_week INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, program_id, started_at)
);

-- Program Workout Completions Table
CREATE TABLE program_workout_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  enrollment_id UUID REFERENCES user_program_enrollments(id) ON DELETE CASCADE NOT NULL,
  program_workout_id UUID REFERENCES program_workouts(id) ON DELETE CASCADE NOT NULL,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(enrollment_id, program_workout_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_training_programs_difficulty ON training_programs(difficulty);
CREATE INDEX idx_training_programs_goal ON training_programs(goal);
CREATE INDEX idx_training_programs_is_system ON training_programs(is_system_program);
CREATE INDEX idx_training_programs_created_by ON training_programs(created_by);

CREATE INDEX idx_program_weeks_program_id ON program_weeks(program_id);
CREATE INDEX idx_program_weeks_week_number ON program_weeks(week_number);

CREATE INDEX idx_program_workouts_week_id ON program_workouts(program_week_id);
CREATE INDEX idx_program_workouts_workout_id ON program_workouts(workout_id);
CREATE INDEX idx_program_workouts_day_of_week ON program_workouts(day_of_week);

CREATE INDEX idx_user_enrollments_user_id ON user_program_enrollments(user_id);
CREATE INDEX idx_user_enrollments_program_id ON user_program_enrollments(program_id);
CREATE INDEX idx_user_enrollments_completed ON user_program_enrollments(completed);

CREATE INDEX idx_program_completions_enrollment_id ON program_workout_completions(enrollment_id);
CREATE INDEX idx_program_completions_program_workout_id ON program_workout_completions(program_workout_id);
CREATE INDEX idx_program_completions_completed_at ON program_workout_completions(completed_at);

-- Enable Row Level Security
ALTER TABLE training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_weeks ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_program_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE program_workout_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for training_programs
CREATE POLICY "Users can view all system programs and their own programs"
  ON training_programs FOR SELECT
  USING (is_system_program = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own programs"
  ON training_programs FOR INSERT
  WITH CHECK (created_by = auth.uid() AND is_system_program = false);

CREATE POLICY "Users can update their own programs"
  ON training_programs FOR UPDATE
  USING (created_by = auth.uid() AND is_system_program = false);

CREATE POLICY "Users can delete their own programs"
  ON training_programs FOR DELETE
  USING (created_by = auth.uid() AND is_system_program = false);

-- RLS Policies for program_weeks
CREATE POLICY "Users can view weeks for accessible programs"
  ON program_weeks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_programs
      WHERE training_programs.id = program_weeks.program_id
      AND (training_programs.is_system_program = true OR training_programs.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create weeks for their own programs"
  ON program_weeks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_programs
      WHERE training_programs.id = program_weeks.program_id
      AND training_programs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update weeks in their own programs"
  ON program_weeks FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM training_programs
      WHERE training_programs.id = program_weeks.program_id
      AND training_programs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete weeks in their own programs"
  ON program_weeks FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM training_programs
      WHERE training_programs.id = program_weeks.program_id
      AND training_programs.created_by = auth.uid()
    )
  );

-- RLS Policies for program_workouts
CREATE POLICY "Users can view workouts in accessible programs"
  ON program_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM program_weeks
      JOIN training_programs ON training_programs.id = program_weeks.program_id
      WHERE program_weeks.id = program_workouts.program_week_id
      AND (training_programs.is_system_program = true OR training_programs.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can create workouts in their own programs"
  ON program_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM program_weeks
      JOIN training_programs ON training_programs.id = program_weeks.program_id
      WHERE program_weeks.id = program_workouts.program_week_id
      AND training_programs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update workouts in their own programs"
  ON program_workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM program_weeks
      JOIN training_programs ON training_programs.id = program_weeks.program_id
      WHERE program_weeks.id = program_workouts.program_week_id
      AND training_programs.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can delete workouts in their own programs"
  ON program_workouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM program_weeks
      JOIN training_programs ON training_programs.id = program_weeks.program_id
      WHERE program_weeks.id = program_workouts.program_week_id
      AND training_programs.created_by = auth.uid()
    )
  );

-- RLS Policies for user_program_enrollments
CREATE POLICY "Users can view their own enrollments"
  ON user_program_enrollments FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own enrollments"
  ON user_program_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own enrollments"
  ON user_program_enrollments FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own enrollments"
  ON user_program_enrollments FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for program_workout_completions
CREATE POLICY "Users can view their own completions"
  ON program_workout_completions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_program_enrollments
      WHERE user_program_enrollments.id = program_workout_completions.enrollment_id
      AND user_program_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own completions"
  ON program_workout_completions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_program_enrollments
      WHERE user_program_enrollments.id = program_workout_completions.enrollment_id
      AND user_program_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own completions"
  ON program_workout_completions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_program_enrollments
      WHERE user_program_enrollments.id = program_workout_completions.enrollment_id
      AND user_program_enrollments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own completions"
  ON program_workout_completions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_program_enrollments
      WHERE user_program_enrollments.id = program_workout_completions.enrollment_id
      AND user_program_enrollments.user_id = auth.uid()
    )
  );

-- Insert sample system training programs
-- 1. Couch to 5K Program
INSERT INTO training_programs (title, description, duration_weeks, difficulty, goal, is_system_program, image_url) VALUES
  ('Couch to 5K', 'A beginner-friendly running program that gradually builds your endurance from zero to running a 5K continuously in just 8 weeks.', 8, 'Beginner', 'endurance', true, 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800'),
  ('12-Week Strength Builder', 'Progressive strength training program designed to build muscle and increase overall strength through compound movements.', 12, 'Intermediate', 'strength', true, 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800'),
  ('6-Week Core Challenge', 'Intensive core-focused program to develop abdominal strength, stability, and definition in just 6 weeks.', 6, 'Intermediate', 'muscle_gain', true, 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800');

-- Couch to 5K Program Weeks
INSERT INTO program_weeks (program_id, week_number, focus, description)
SELECT id, 1, 'Foundation Building', 'Start with walk/run intervals to build your base endurance' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 2, 'Increasing Run Time', 'Gradually increase running intervals while reducing walk breaks' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 3, 'Building Stamina', 'Continue building endurance with longer run segments' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 4, 'Halfway Milestone', 'You are halfway there! Runs are getting longer and easier' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 5, 'Pushing Further', 'Push past comfort zones with extended running periods' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 6, 'Almost There', 'Nearly continuous running with minimal walking breaks' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 7, 'Final Push', 'Build confidence with longer continuous runs' FROM training_programs WHERE title = 'Couch to 5K'
UNION ALL
SELECT id, 8, '5K Ready', 'Complete your first continuous 5K run!' FROM training_programs WHERE title = 'Couch to 5K';

-- 12-Week Strength Builder Program Weeks
INSERT INTO program_weeks (program_id, week_number, focus, description)
SELECT id, 1, 'Foundation & Form', 'Master proper form and establish baseline strength' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 2, 'Foundation & Form', 'Continue form work and progressive overload' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 3, 'Hypertrophy Phase 1', 'Higher volume training for muscle growth' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 4, 'Hypertrophy Phase 1', 'Continue muscle building with progressive overload' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 5, 'Hypertrophy Phase 2', 'Increase intensity and volume' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 6, 'Hypertrophy Phase 2', 'Peak hypertrophy training volume' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 7, 'Strength Phase 1', 'Transition to heavier weights, lower reps' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 8, 'Strength Phase 1', 'Build maximal strength' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 9, 'Strength Phase 2', 'Peak strength training' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 10, 'Strength Phase 2', 'Continue heavy lifting protocols' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 11, 'Peaking', 'Prepare for personal records' FROM training_programs WHERE title = '12-Week Strength Builder'
UNION ALL
SELECT id, 12, 'Testing & Deload', 'Test your new strength and recover' FROM training_programs WHERE title = '12-Week Strength Builder';

-- 6-Week Core Challenge Program Weeks
INSERT INTO program_weeks (program_id, week_number, focus, description)
SELECT id, 1, 'Core Activation', 'Learn proper core engagement and basic movements' FROM training_programs WHERE title = '6-Week Core Challenge'
UNION ALL
SELECT id, 2, 'Building Endurance', 'Increase time under tension and exercise complexity' FROM training_programs WHERE title = '6-Week Core Challenge'
UNION ALL
SELECT id, 3, 'Dynamic Movement', 'Add dynamic and rotational core exercises' FROM training_programs WHERE title = '6-Week Core Challenge'
UNION ALL
SELECT id, 4, 'Intensity Boost', 'Increase difficulty with advanced variations' FROM training_programs WHERE title = '6-Week Core Challenge'
UNION ALL
SELECT id, 5, 'Peak Challenge', 'Most challenging week with maximum intensity' FROM training_programs WHERE title = '6-Week Core Challenge'
UNION ALL
SELECT id, 6, 'Final Test', 'Test your improved core strength and endurance' FROM training_programs WHERE title = '6-Week Core Challenge';

-- Note: We're not inserting program_workouts here as they would require existing workout IDs
-- In a real implementation, these would be created by associating with actual workout templates
-- or the application would create workouts when enrolling in a program
