-- Create workout scheduling table
CREATE TABLE workout_schedule (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0-6 (Sunday-Saturday), null for one-time
  time_of_day TIME,
  scheduled_date DATE, -- for one-time schedules
  is_active BOOLEAN DEFAULT true,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_minutes_before INTEGER DEFAULT 60,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_schedule_type CHECK (
    (day_of_week IS NOT NULL AND scheduled_date IS NULL) OR
    (day_of_week IS NULL AND scheduled_date IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_workout_schedule_user_id ON workout_schedule(user_id);
CREATE INDEX idx_workout_schedule_workout_id ON workout_schedule(workout_id);
CREATE INDEX idx_workout_schedule_day ON workout_schedule(day_of_week);
CREATE INDEX idx_workout_schedule_date ON workout_schedule(scheduled_date);
CREATE INDEX idx_workout_schedule_active ON workout_schedule(is_active);

-- Enable Row Level Security
ALTER TABLE workout_schedule ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_schedule
CREATE POLICY "Users can view their own workout schedules"
  ON workout_schedule FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workout schedules"
  ON workout_schedule FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workout schedules"
  ON workout_schedule FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workout schedules"
  ON workout_schedule FOR DELETE
  USING (user_id = auth.uid());
