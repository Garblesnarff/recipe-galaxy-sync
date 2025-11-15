-- Create challenges table
CREATE TABLE challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  challenge_type TEXT NOT NULL CHECK (challenge_type IN ('workout_count', 'total_volume', 'total_calories', 'streak', 'specific_exercise')),
  goal_value INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_global BOOLEAN DEFAULT false,
  exercise_name TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create challenge_participants table
CREATE TABLE challenge_participants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  current_progress INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(challenge_id, user_id)
);

-- Create leaderboards table
CREATE TABLE leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('total_workouts', 'total_volume', 'total_calories', 'current_streak', 'monthly_workouts')),
  time_period TEXT NOT NULL CHECK (time_period IN ('all_time', 'monthly', 'weekly')),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(leaderboard_type, time_period)
);

-- Create leaderboard_entries table
CREATE TABLE leaderboard_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_id UUID REFERENCES leaderboards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rank INTEGER NOT NULL,
  value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(leaderboard_id, user_id)
);

-- Create indexes for performance
CREATE INDEX idx_challenges_start_date ON challenges(start_date);
CREATE INDEX idx_challenges_end_date ON challenges(end_date);
CREATE INDEX idx_challenges_is_global ON challenges(is_global);
CREATE INDEX idx_challenges_type ON challenges(challenge_type);
CREATE INDEX idx_challenge_participants_challenge_id ON challenge_participants(challenge_id);
CREATE INDEX idx_challenge_participants_user_id ON challenge_participants(user_id);
CREATE INDEX idx_challenge_participants_completed ON challenge_participants(completed);
CREATE INDEX idx_leaderboards_type_period ON leaderboards(leaderboard_type, time_period);
CREATE INDEX idx_leaderboard_entries_leaderboard_id ON leaderboard_entries(leaderboard_id);
CREATE INDEX idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_rank ON leaderboard_entries(rank);

-- Enable Row Level Security
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenges
CREATE POLICY "Challenges are viewable by everyone"
  ON challenges FOR SELECT
  USING (true);

CREATE POLICY "Users can create challenges"
  ON challenges FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own challenges"
  ON challenges FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can delete their own challenges"
  ON challenges FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for challenge_participants
CREATE POLICY "Challenge participants are viewable by everyone"
  ON challenge_participants FOR SELECT
  USING (true);

CREATE POLICY "Users can join challenges"
  ON challenge_participants FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own participation"
  ON challenge_participants FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave challenges"
  ON challenge_participants FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for leaderboards
CREATE POLICY "Leaderboards are viewable by everyone"
  ON leaderboards FOR SELECT
  USING (true);

-- RLS Policies for leaderboard_entries
CREATE POLICY "Leaderboard entries are viewable by everyone"
  ON leaderboard_entries FOR SELECT
  USING (true);

-- Insert sample global challenges
INSERT INTO challenges (title, description, challenge_type, goal_value, start_date, end_date, is_global, image_url) VALUES
(
  '30 Workouts in 30 Days',
  'Complete 30 workouts in 30 days to build a consistent fitness habit. Every workout counts towards your goal!',
  'workout_count',
  30,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  true,
  'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=400&fit=crop'
),
(
  'Burn 10,000 Calories This Month',
  'Track your calorie burn and aim to hit 10,000 total calories this month. Push yourself to the limit!',
  'total_calories',
  10000,
  DATE_TRUNC('month', CURRENT_DATE),
  DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' - INTERVAL '1 day',
  true,
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop'
),
(
  '100 Push-ups Challenge',
  'Complete 100 push-ups total during this challenge period. Break it up however you like across your workouts!',
  'specific_exercise',
  100,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '7 days',
  true,
  'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&h=400&fit=crop'
),
(
  '7-Day Streak Challenge',
  'Build momentum by working out 7 days in a row. Consistency is key to achieving your fitness goals!',
  'streak',
  7,
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '14 days',
  true,
  'https://images.unsplash.com/photo-1554284126-aa88f22d8b74?w=800&h=400&fit=crop'
);

-- Update the exercise_name for the specific_exercise challenge
UPDATE challenges
SET exercise_name = 'Push-ups'
WHERE title = '100 Push-ups Challenge';

-- Create default leaderboards
INSERT INTO leaderboards (leaderboard_type, time_period) VALUES
('total_workouts', 'all_time'),
('total_workouts', 'monthly'),
('total_workouts', 'weekly'),
('total_volume', 'all_time'),
('total_volume', 'monthly'),
('total_volume', 'weekly'),
('total_calories', 'all_time'),
('total_calories', 'monthly'),
('total_calories', 'weekly'),
('current_streak', 'all_time');

-- Create function to update challenge progress
CREATE OR REPLACE FUNCTION update_challenge_progress()
RETURNS TRIGGER AS $$
BEGIN
  -- Update workout_count challenges
  UPDATE challenge_participants cp
  SET
    current_progress = (
      SELECT COUNT(DISTINCT DATE(w.created_at))
      FROM workouts w
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'workout_count'
    ),
    completed = (
      SELECT COUNT(DISTINCT DATE(w.created_at)) >= c.goal_value
      FROM workouts w
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'workout_count'
    ),
    completed_at = CASE
      WHEN (
        SELECT COUNT(DISTINCT DATE(w.created_at)) >= c.goal_value
        FROM workouts w
        INNER JOIN challenges c ON c.id = cp.challenge_id
        WHERE w.user_id = cp.user_id
          AND w.created_at >= c.start_date
          AND w.created_at <= c.end_date + INTERVAL '1 day'
          AND c.challenge_type = 'workout_count'
      ) AND cp.completed_at IS NULL THEN NOW()
      ELSE cp.completed_at
    END
  FROM challenges c
  WHERE cp.challenge_id = c.id
    AND c.challenge_type = 'workout_count'
    AND cp.user_id = NEW.user_id;

  -- Update total_calories challenges
  UPDATE challenge_participants cp
  SET
    current_progress = COALESCE((
      SELECT SUM(w.total_calories)::INTEGER
      FROM workouts w
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'total_calories'
    ), 0),
    completed = COALESCE((
      SELECT SUM(w.total_calories)::INTEGER >= c.goal_value
      FROM workouts w
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'total_calories'
    ), false),
    completed_at = CASE
      WHEN COALESCE((
        SELECT SUM(w.total_calories)::INTEGER >= c.goal_value
        FROM workouts w
        INNER JOIN challenges c ON c.id = cp.challenge_id
        WHERE w.user_id = cp.user_id
          AND w.created_at >= c.start_date
          AND w.created_at <= c.end_date + INTERVAL '1 day'
          AND c.challenge_type = 'total_calories'
      ), false) AND cp.completed_at IS NULL THEN NOW()
      ELSE cp.completed_at
    END
  FROM challenges c
  WHERE cp.challenge_id = c.id
    AND c.challenge_type = 'total_calories'
    AND cp.user_id = NEW.user_id;

  -- Update total_volume challenges
  UPDATE challenge_participants cp
  SET
    current_progress = COALESCE((
      SELECT SUM(we.sets * we.reps * we.weight)::INTEGER
      FROM workout_exercises we
      INNER JOIN workouts w ON w.id = we.workout_id
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'total_volume'
    ), 0),
    completed = COALESCE((
      SELECT SUM(we.sets * we.reps * we.weight)::INTEGER >= c.goal_value
      FROM workout_exercises we
      INNER JOIN workouts w ON w.id = we.workout_id
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'total_volume'
    ), false),
    completed_at = CASE
      WHEN COALESCE((
        SELECT SUM(we.sets * we.reps * we.weight)::INTEGER >= c.goal_value
        FROM workout_exercises we
        INNER JOIN workouts w ON w.id = we.workout_id
        INNER JOIN challenges c ON c.id = cp.challenge_id
        WHERE w.user_id = cp.user_id
          AND w.created_at >= c.start_date
          AND w.created_at <= c.end_date + INTERVAL '1 day'
          AND c.challenge_type = 'total_volume'
      ), false) AND cp.completed_at IS NULL THEN NOW()
      ELSE cp.completed_at
    END
  FROM challenges c
  WHERE cp.challenge_id = c.id
    AND c.challenge_type = 'total_volume'
    AND cp.user_id = NEW.user_id;

  -- Update specific_exercise challenges
  UPDATE challenge_participants cp
  SET
    current_progress = COALESCE((
      SELECT SUM(we.sets * we.reps)::INTEGER
      FROM workout_exercises we
      INNER JOIN workouts w ON w.id = we.workout_id
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND we.exercise_name = c.exercise_name
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'specific_exercise'
    ), 0),
    completed = COALESCE((
      SELECT SUM(we.sets * we.reps)::INTEGER >= c.goal_value
      FROM workout_exercises we
      INNER JOIN workouts w ON w.id = we.workout_id
      INNER JOIN challenges c ON c.id = cp.challenge_id
      WHERE w.user_id = cp.user_id
        AND we.exercise_name = c.exercise_name
        AND w.created_at >= c.start_date
        AND w.created_at <= c.end_date + INTERVAL '1 day'
        AND c.challenge_type = 'specific_exercise'
    ), false),
    completed_at = CASE
      WHEN COALESCE((
        SELECT SUM(we.sets * we.reps)::INTEGER >= c.goal_value
        FROM workout_exercises we
        INNER JOIN workouts w ON w.id = we.workout_id
        INNER JOIN challenges c ON c.id = cp.challenge_id
        WHERE w.user_id = cp.user_id
          AND we.exercise_name = c.exercise_name
          AND w.created_at >= c.start_date
          AND w.created_at <= c.end_date + INTERVAL '1 day'
          AND c.challenge_type = 'specific_exercise'
      ), false) AND cp.completed_at IS NULL THEN NOW()
      ELSE cp.completed_at
    END
  FROM challenges c
  WHERE cp.challenge_id = c.id
    AND c.challenge_type = 'specific_exercise'
    AND cp.user_id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update challenge progress on workout insert
CREATE TRIGGER update_challenges_on_workout
AFTER INSERT ON workouts
FOR EACH ROW
EXECUTE FUNCTION update_challenge_progress();
