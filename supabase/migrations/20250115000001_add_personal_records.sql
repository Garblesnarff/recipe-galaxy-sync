-- Create Personal Records Table
CREATE TABLE personal_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exercise_name TEXT NOT NULL,
  record_type TEXT NOT NULL, -- 'max_weight', 'max_reps', 'max_duration'
  value NUMERIC(10, 2) NOT NULL,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, exercise_name, record_type)
);

-- Create indexes for better query performance
CREATE INDEX idx_personal_records_user_id ON personal_records(user_id);
CREATE INDEX idx_personal_records_exercise ON personal_records(exercise_name);
CREATE INDEX idx_personal_records_achieved_at ON personal_records(achieved_at);

-- Enable Row Level Security
ALTER TABLE personal_records ENABLE ROW LEVEL SECURITY;

-- RLS Policies for personal_records
CREATE POLICY "Users can view their own PRs"
  ON personal_records FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own PRs"
  ON personal_records FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own PRs"
  ON personal_records FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own PRs"
  ON personal_records FOR DELETE
  USING (user_id = auth.uid());
