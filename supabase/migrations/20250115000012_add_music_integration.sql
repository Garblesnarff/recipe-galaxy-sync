-- Create music integration tables

-- Music Connections Table
CREATE TABLE music_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube_music')),
  is_connected BOOLEAN DEFAULT false,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  connected_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Workout Playlists Table
CREATE TABLE workout_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_id UUID REFERENCES workouts(id) ON DELETE SET NULL,
  playlist_name TEXT NOT NULL,
  platform_playlist_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('spotify', 'apple_music', 'youtube_music')),
  track_count INTEGER DEFAULT 0,
  total_duration_ms BIGINT DEFAULT 0,
  playlist_url TEXT,
  cover_image_url TEXT,
  is_default_for_workouts BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, platform_playlist_id, platform)
);

-- Music Preferences Table
CREATE TABLE music_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  auto_play_on_workout_start BOOLEAN DEFAULT false,
  default_volume INTEGER DEFAULT 70 CHECK (default_volume >= 0 AND default_volume <= 100),
  fade_in_duration_seconds INTEGER DEFAULT 3 CHECK (fade_in_duration_seconds >= 0 AND fade_in_duration_seconds <= 30),
  preferred_genres JSONB DEFAULT '[]'::jsonb,
  energy_level_preference TEXT DEFAULT 'mixed' CHECK (energy_level_preference IN ('low', 'medium', 'high', 'mixed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_music_connections_user_id ON music_connections(user_id);
CREATE INDEX idx_music_connections_platform ON music_connections(platform);
CREATE INDEX idx_music_connections_is_connected ON music_connections(is_connected);

CREATE INDEX idx_workout_playlists_user_id ON workout_playlists(user_id);
CREATE INDEX idx_workout_playlists_workout_id ON workout_playlists(workout_id);
CREATE INDEX idx_workout_playlists_platform ON workout_playlists(platform);
CREATE INDEX idx_workout_playlists_is_default ON workout_playlists(is_default_for_workouts);

CREATE INDEX idx_music_preferences_user_id ON music_preferences(user_id);

-- Enable Row Level Security
ALTER TABLE music_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for music_connections
CREATE POLICY "Users can view their own music connections"
  ON music_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own music connections"
  ON music_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own music connections"
  ON music_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own music connections"
  ON music_connections FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for workout_playlists
CREATE POLICY "Users can view their own workout playlists"
  ON workout_playlists FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own workout playlists"
  ON workout_playlists FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own workout playlists"
  ON workout_playlists FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own workout playlists"
  ON workout_playlists FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for music_preferences
CREATE POLICY "Users can view their own music preferences"
  ON music_preferences FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own music preferences"
  ON music_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own music preferences"
  ON music_preferences FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own music preferences"
  ON music_preferences FOR DELETE
  USING (user_id = auth.uid());

-- Function to auto-create music preferences for new users
CREATE OR REPLACE FUNCTION create_default_music_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO music_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default music preferences on user signup
CREATE TRIGGER on_auth_user_created_music_preferences
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_music_preferences();
