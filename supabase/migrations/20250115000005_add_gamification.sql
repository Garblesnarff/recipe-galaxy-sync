-- Gamification System: Achievements, Badges, and Levels

-- Create achievements table
CREATE TABLE achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT, -- emoji or icon name
  requirement_type TEXT NOT NULL, -- 'workout_count', 'streak_days', 'calories_burned', 'pr_count', 'exercise_specific', 'time_of_day', 'weekly_count', 'monthly_count', 'total_minutes'
  requirement_value INTEGER NOT NULL,
  requirement_metadata JSONB, -- additional data like exercise_id, time range, etc.
  points INTEGER DEFAULT 10,
  tier TEXT DEFAULT 'bronze', -- 'bronze', 'silver', 'gold', 'platinum'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create user_achievements table
CREATE TABLE user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE NOT NULL,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, achievement_id)
);

-- Create user_stats table
CREATE TABLE user_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  total_workouts INTEGER DEFAULT 0,
  total_minutes INTEGER DEFAULT 0,
  total_calories INTEGER DEFAULT 0,
  current_streak_days INTEGER DEFAULT 0,
  longest_streak_days INTEGER DEFAULT 0,
  total_prs INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  total_points INTEGER DEFAULT 0,
  last_workout_date DATE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_earned_at ON user_achievements(earned_at);
CREATE INDEX idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX idx_achievements_tier ON achievements(tier);
CREATE INDEX idx_achievements_requirement_type ON achievements(requirement_type);

-- Enable RLS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies for achievements (public read)
CREATE POLICY "Achievements are viewable by everyone"
  ON achievements FOR SELECT
  USING (true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own achievements"
  ON user_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for user_stats
CREATE POLICY "Users can view their own stats"
  ON user_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON user_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON user_stats FOR UPDATE
  USING (auth.uid() = user_id);

-- Insert achievements

-- Workout Count Achievements (Bronze to Platinum progression)
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('First Step', 'Complete your first workout', '🎯', 'workout_count', 1, 10, 'bronze'),
  ('Getting Started', 'Complete 5 workouts', '💪', 'workout_count', 5, 25, 'bronze'),
  ('Committed', 'Complete 10 workouts', '🔥', 'workout_count', 10, 50, 'bronze'),
  ('Dedicated', 'Complete 25 workouts', '⭐', 'workout_count', 25, 100, 'silver'),
  ('Fitness Enthusiast', 'Complete 50 workouts', '🌟', 'workout_count', 50, 200, 'silver'),
  ('Century Club', 'Complete 100 workouts', '💯', 'workout_count', 100, 500, 'gold'),
  ('Fitness Warrior', 'Complete 250 workouts', '⚡', 'workout_count', 250, 1000, 'gold'),
  ('Legendary', 'Complete 500 workouts', '👑', 'workout_count', 500, 2500, 'platinum'),
  ('Unstoppable', 'Complete 1000 workouts', '🏆', 'workout_count', 1000, 5000, 'platinum');

-- Streak Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Consistency', 'Maintain a 3-day workout streak', '🔗', 'streak_days', 3, 30, 'bronze'),
  ('Week Warrior', 'Maintain a 7-day workout streak', '📅', 'streak_days', 7, 75, 'silver'),
  ('Two Week Champion', 'Maintain a 14-day workout streak', '🎖️', 'streak_days', 14, 150, 'silver'),
  ('Monthly Master', 'Maintain a 30-day workout streak', '📆', 'streak_days', 30, 300, 'gold'),
  ('Quarter Achiever', 'Maintain a 90-day workout streak', '🔱', 'streak_days', 90, 900, 'gold'),
  ('Hundred Days Strong', 'Maintain a 100-day workout streak', '💎', 'streak_days', 100, 1000, 'platinum'),
  ('Year of Dedication', 'Maintain a 365-day workout streak', '👽', 'streak_days', 365, 3650, 'platinum');

-- Calorie Burn Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Calorie Crusher', 'Burn 5,000 total calories', '🔥', 'calories_burned', 5000, 50, 'bronze'),
  ('Fat Burner', 'Burn 10,000 total calories', '💥', 'calories_burned', 10000, 100, 'silver'),
  ('Metabolism Master', 'Burn 25,000 total calories', '⚡', 'calories_burned', 25000, 250, 'silver'),
  ('Calorie Annihilator', 'Burn 50,000 total calories', '🌋', 'calories_burned', 50000, 500, 'gold'),
  ('Inferno', 'Burn 100,000 total calories', '🔥', 'calories_burned', 100000, 1000, 'platinum');

-- PR (Personal Record) Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('First PR', 'Set your first personal record', '🎉', 'pr_count', 1, 20, 'bronze'),
  ('PR Collector', 'Set 5 personal records', '📈', 'pr_count', 5, 50, 'bronze'),
  ('Record Breaker', 'Set 10 personal records', '📊', 'pr_count', 10, 100, 'silver'),
  ('PR Machine', 'Set 25 personal records', '🚀', 'pr_count', 25, 250, 'gold'),
  ('Limitless', 'Set 50 personal records', '🌠', 'pr_count', 50, 500, 'platinum');

-- Time-based Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Early Bird', 'Complete a workout before 6 AM', '🌅', 'time_of_day', 6, 50, 'silver'),
  ('Rise and Grind', 'Complete 10 workouts before 7 AM', '☀️', 'time_of_day', 7, 150, 'gold'),
  ('Night Owl', 'Complete a workout after 10 PM', '🦉', 'time_of_day', 22, 50, 'silver'),
  ('Midnight Warrior', 'Complete 10 workouts after 9 PM', '🌙', 'time_of_day', 21, 150, 'gold');

-- Weekly/Monthly Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Weekly Grind', 'Complete 5 workouts in a single week', '📊', 'weekly_count', 5, 100, 'silver'),
  ('Weekly Warrior', 'Complete 7 workouts in a single week', '⚔️', 'weekly_count', 7, 200, 'gold'),
  ('Marathon Month', 'Complete 20 workouts in a single month', '🏃', 'monthly_count', 20, 400, 'gold'),
  ('Month Dominator', 'Complete 30 workouts in a single month', '👊', 'monthly_count', 30, 600, 'platinum');

-- Time-based Volume Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Hour of Power', 'Accumulate 60 minutes of workout time', '⏱️', 'total_minutes', 60, 30, 'bronze'),
  ('Ten Hours Strong', 'Accumulate 600 minutes of workout time', '⏰', 'total_minutes', 600, 150, 'silver'),
  ('Fifty Hour Hero', 'Accumulate 3000 minutes of workout time', '🕐', 'total_minutes', 3000, 500, 'gold'),
  ('Hundred Hour Legend', 'Accumulate 6000 minutes of workout time', '⌚', 'total_minutes', 6000, 1000, 'platinum');

-- Special Achievements
INSERT INTO achievements (name, description, icon, requirement_type, requirement_value, points, tier) VALUES
  ('Weekend Warrior', 'Complete workouts on both Saturday and Sunday', '🎯', 'weekend_warrior', 1, 75, 'silver'),
  ('Perfect Week', 'Complete at least one workout every day for a week', '✨', 'perfect_week', 1, 250, 'gold');

-- Function to update user stats after workout
CREATE OR REPLACE FUNCTION update_user_stats_after_workout()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update user_stats
  INSERT INTO user_stats (user_id, total_workouts, total_minutes, total_calories, last_workout_date, updated_at)
  VALUES (
    NEW.user_id,
    1,
    COALESCE(NEW.duration_minutes, 0),
    COALESCE(NEW.calories_burned, 0),
    CURRENT_DATE,
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    total_workouts = user_stats.total_workouts + 1,
    total_minutes = user_stats.total_minutes + COALESCE(NEW.duration_minutes, 0),
    total_calories = user_stats.total_calories + COALESCE(NEW.calories_burned, 0),
    last_workout_date = CURRENT_DATE,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  days_since_last_workout INTEGER;
BEGIN
  FOR user_record IN SELECT user_id, last_workout_date, current_streak_days FROM user_stats
  LOOP
    IF user_record.last_workout_date IS NOT NULL THEN
      days_since_last_workout := CURRENT_DATE - user_record.last_workout_date;

      IF days_since_last_workout = 0 THEN
        -- Same day, maintain streak
        CONTINUE;
      ELSIF days_since_last_workout = 1 THEN
        -- Consecutive day, increment streak
        UPDATE user_stats
        SET
          current_streak_days = current_streak_days + 1,
          longest_streak_days = GREATEST(longest_streak_days, current_streak_days + 1),
          updated_at = NOW()
        WHERE user_id = user_record.user_id;
      ELSE
        -- Streak broken
        UPDATE user_stats
        SET
          current_streak_days = 1,
          updated_at = NOW()
        WHERE user_id = user_record.user_id;
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT ON achievements TO authenticated;
GRANT ALL ON user_achievements TO authenticated;
GRANT ALL ON user_stats TO authenticated;
