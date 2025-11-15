-- Social Features Migration
-- User Profiles, Following, Sharing, and Activity Feed

-- User Profiles Table
CREATE TABLE user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- User Follows Table
CREATE TABLE user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Workout Shares Table
CREATE TABLE workout_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  is_public BOOLEAN DEFAULT false,
  share_code TEXT UNIQUE,
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Likes Table
CREATE TABLE workout_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(workout_id, user_id)
);

-- Workout Comments Table
CREATE TABLE workout_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  comment TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Activity Feed Table
CREATE TABLE activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL, -- 'workout_completed', 'pr_achieved', 'achievement_unlocked', 'program_started', 'program_completed'
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Indexes
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_follows_follower_id ON user_follows(follower_id);
CREATE INDEX idx_user_follows_following_id ON user_follows(following_id);
CREATE INDEX idx_workout_shares_share_code ON workout_shares(share_code);
CREATE INDEX idx_workout_shares_workout_id ON workout_shares(workout_id);
CREATE INDEX idx_workout_likes_workout_id ON workout_likes(workout_id);
CREATE INDEX idx_workout_likes_user_id ON workout_likes(user_id);
CREATE INDEX idx_workout_comments_workout_id ON workout_comments(workout_id);
CREATE INDEX idx_activity_feed_user_id ON activity_feed(user_id);
CREATE INDEX idx_activity_feed_created_at ON activity_feed(created_at DESC);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
-- Public profiles are viewable by everyone, private profiles only by followers
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view profiles they follow"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_follows
      WHERE user_follows.follower_id = auth.uid()
      AND user_follows.following_id = user_profiles.user_id
    )
  );

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for user_follows
CREATE POLICY "Users can view all follows"
  ON user_follows FOR SELECT
  USING (true);

CREATE POLICY "Users can follow others"
  ON user_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "Users can unfollow others"
  ON user_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- RLS Policies for workout_shares
CREATE POLICY "Anyone can view public shares"
  ON workout_shares FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can view their own shares"
  ON workout_shares FOR SELECT
  USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can view shares from users they follow"
  ON workout_shares FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_follows
      WHERE user_follows.follower_id = auth.uid()
      AND user_follows.following_id = workout_shares.shared_by_user_id
    )
  );

CREATE POLICY "Users can create shares for their workouts"
  ON workout_shares FOR INSERT
  WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can update their own shares"
  ON workout_shares FOR UPDATE
  USING (auth.uid() = shared_by_user_id)
  WITH CHECK (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can delete their own shares"
  ON workout_shares FOR DELETE
  USING (auth.uid() = shared_by_user_id);

-- RLS Policies for workout_likes
CREATE POLICY "Anyone can view likes"
  ON workout_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like workouts"
  ON workout_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike workouts"
  ON workout_likes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for workout_comments
CREATE POLICY "Anyone can view comments on public workouts"
  ON workout_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_shares
      WHERE workout_shares.workout_id = workout_comments.workout_id
      AND workout_shares.is_public = true
    )
  );

CREATE POLICY "Users can view comments on workouts they can access"
  ON workout_comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_comments.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can comment on workouts they can access"
  ON workout_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
  ON workout_comments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON workout_comments FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for activity_feed
CREATE POLICY "Users can view their own activity"
  ON activity_feed FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view activity from users they follow"
  ON activity_feed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_follows
      WHERE user_follows.follower_id = auth.uid()
      AND user_follows.following_id = activity_feed.user_id
    )
  );

CREATE POLICY "Users can view activity from public profiles"
  ON activity_feed FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = activity_feed.user_id
      AND user_profiles.is_public = true
    )
  );

CREATE POLICY "Users can create their own activity"
  ON activity_feed FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activity"
  ON activity_feed FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate share codes
CREATE OR REPLACE FUNCTION set_share_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.share_code IS NULL THEN
    NEW.share_code := generate_share_code();
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM workout_shares WHERE share_code = NEW.share_code) LOOP
      NEW.share_code := generate_share_code();
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workout_shares_set_share_code
  BEFORE INSERT ON workout_shares
  FOR EACH ROW
  EXECUTE FUNCTION set_share_code();
