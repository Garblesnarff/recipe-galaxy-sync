-- Create Rest Days Table
CREATE TABLE rest_days (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  recovery_type TEXT, -- 'active', 'passive', 'complete'
  notes TEXT,
  sleep_hours NUMERIC(3, 1),
  soreness_level INTEGER, -- 1-10
  energy_level INTEGER, -- 1-10
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- Create Recovery Scores Table
CREATE TABLE recovery_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  score INTEGER NOT NULL, -- 0-100
  factors JSONB, -- {sleep: 8, soreness: 3, workouts_this_week: 5, days_since_rest: 2}
  recommendation TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, date)
);

-- Create indexes for better query performance
CREATE INDEX idx_rest_days_user_id ON rest_days(user_id);
CREATE INDEX idx_rest_days_date ON rest_days(date);
CREATE INDEX idx_rest_days_user_date ON rest_days(user_id, date);

CREATE INDEX idx_recovery_scores_user_id ON recovery_scores(user_id);
CREATE INDEX idx_recovery_scores_date ON recovery_scores(date);
CREATE INDEX idx_recovery_scores_user_date ON recovery_scores(user_id, date);

-- Enable Row Level Security
ALTER TABLE rest_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rest_days
CREATE POLICY "Users can view their own rest days"
  ON rest_days FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own rest days"
  ON rest_days FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own rest days"
  ON rest_days FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own rest days"
  ON rest_days FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for recovery_scores
CREATE POLICY "Users can view their own recovery scores"
  ON recovery_scores FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own recovery scores"
  ON recovery_scores FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own recovery scores"
  ON recovery_scores FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own recovery scores"
  ON recovery_scores FOR DELETE
  USING (user_id = auth.uid());
