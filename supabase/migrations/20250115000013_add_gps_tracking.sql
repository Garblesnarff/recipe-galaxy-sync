-- Add GPS tracking tables for outdoor workout tracking

-- Enable PostGIS extension for geospatial data
CREATE EXTENSION IF NOT EXISTS postgis;

-- GPS Workouts Table - Links to workout_logs with detailed GPS data
CREATE TABLE gps_workouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE CASCADE NOT NULL UNIQUE,
  route_name TEXT,
  total_distance_meters NUMERIC(10, 2) NOT NULL,
  total_elevation_gain_meters NUMERIC(8, 2) DEFAULT 0,
  total_elevation_loss_meters NUMERIC(8, 2) DEFAULT 0,
  average_pace TEXT, -- Format: "5:30/km"
  max_speed_kmh NUMERIC(6, 2),
  route_polyline TEXT NOT NULL, -- Encoded polyline for efficient storage
  start_location GEOGRAPHY(POINT, 4326),
  end_location GEOGRAPHY(POINT, 4326),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- GPS Waypoints Table - Stores individual GPS points during workout
CREATE TABLE gps_waypoints (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gps_workout_id UUID REFERENCES gps_workouts(id) ON DELETE CASCADE NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  latitude NUMERIC(10, 7) NOT NULL,
  longitude NUMERIC(10, 7) NOT NULL,
  altitude NUMERIC(8, 2), -- meters above sea level
  accuracy NUMERIC(6, 2) NOT NULL, -- GPS accuracy in meters
  speed NUMERIC(6, 2), -- Speed in m/s
  heart_rate INTEGER, -- Optional heart rate from wearable
  sequence_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  CONSTRAINT check_latitude CHECK (latitude >= -90 AND latitude <= 90),
  CONSTRAINT check_longitude CHECK (longitude >= -180 AND longitude <= 180),
  CONSTRAINT check_accuracy CHECK (accuracy >= 0),
  CONSTRAINT check_speed CHECK (speed IS NULL OR speed >= 0),
  CONSTRAINT check_heart_rate CHECK (heart_rate IS NULL OR (heart_rate >= 30 AND heart_rate <= 250))
);

-- Saved Routes Table - User-created or saved favorite routes
CREATE TABLE saved_routes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  route_name TEXT NOT NULL,
  description TEXT,
  distance_meters NUMERIC(10, 2) NOT NULL,
  elevation_gain_meters NUMERIC(8, 2) DEFAULT 0,
  route_polyline TEXT NOT NULL,
  start_location GEOGRAPHY(POINT, 4326) NOT NULL,
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'hard')),
  terrain_type TEXT CHECK (terrain_type IN ('road', 'trail', 'mixed')),
  times_completed INTEGER DEFAULT 0,
  average_completion_time INTERVAL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Route Completions Table - Track each time a saved route is completed
CREATE TABLE route_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  saved_route_id UUID REFERENCES saved_routes(id) ON DELETE CASCADE NOT NULL,
  gps_workout_id UUID REFERENCES gps_workouts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  completion_time INTERVAL NOT NULL,
  average_pace TEXT,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_gps_workouts_workout_log_id ON gps_workouts(workout_log_id);
CREATE INDEX idx_gps_workouts_created_at ON gps_workouts(created_at);

CREATE INDEX idx_gps_waypoints_workout_id ON gps_waypoints(gps_workout_id);
CREATE INDEX idx_gps_waypoints_sequence ON gps_waypoints(gps_workout_id, sequence_number);
CREATE INDEX idx_gps_waypoints_timestamp ON gps_waypoints(timestamp);

CREATE INDEX idx_saved_routes_user_id ON saved_routes(user_id);
CREATE INDEX idx_saved_routes_difficulty ON saved_routes(difficulty_level);
CREATE INDEX idx_saved_routes_terrain ON saved_routes(terrain_type);
CREATE INDEX idx_saved_routes_is_public ON saved_routes(is_public);
CREATE INDEX idx_saved_routes_created_at ON saved_routes(created_at);
-- Spatial index for finding nearby routes
CREATE INDEX idx_saved_routes_start_location ON saved_routes USING GIST(start_location);

CREATE INDEX idx_route_completions_route_id ON route_completions(saved_route_id);
CREATE INDEX idx_route_completions_user_id ON route_completions(user_id);
CREATE INDEX idx_route_completions_completed_at ON route_completions(completed_at);

-- Enable Row Level Security
ALTER TABLE gps_workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE gps_waypoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for gps_workouts
CREATE POLICY "Users can view their own GPS workouts"
  ON gps_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = gps_workouts.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create GPS workouts for their workout logs"
  ON gps_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = gps_workouts.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own GPS workouts"
  ON gps_workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = gps_workouts.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own GPS workouts"
  ON gps_workouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workout_logs
      WHERE workout_logs.id = gps_workouts.workout_log_id
      AND workout_logs.user_id = auth.uid()
    )
  );

-- RLS Policies for gps_waypoints
CREATE POLICY "Users can view waypoints for their GPS workouts"
  ON gps_waypoints FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM gps_workouts
      JOIN workout_logs ON workout_logs.id = gps_workouts.workout_log_id
      WHERE gps_workouts.id = gps_waypoints.gps_workout_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create waypoints for their GPS workouts"
  ON gps_waypoints FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM gps_workouts
      JOIN workout_logs ON workout_logs.id = gps_workouts.workout_log_id
      WHERE gps_workouts.id = gps_waypoints.gps_workout_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update waypoints for their GPS workouts"
  ON gps_waypoints FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM gps_workouts
      JOIN workout_logs ON workout_logs.id = gps_workouts.workout_log_id
      WHERE gps_workouts.id = gps_waypoints.gps_workout_id
      AND workout_logs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete waypoints for their GPS workouts"
  ON gps_waypoints FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM gps_workouts
      JOIN workout_logs ON workout_logs.id = gps_workouts.workout_log_id
      WHERE gps_workouts.id = gps_waypoints.gps_workout_id
      AND workout_logs.user_id = auth.uid()
    )
  );

-- RLS Policies for saved_routes
CREATE POLICY "Users can view their own and public saved routes"
  ON saved_routes FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

CREATE POLICY "Users can create their own saved routes"
  ON saved_routes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own saved routes"
  ON saved_routes FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own saved routes"
  ON saved_routes FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for route_completions
CREATE POLICY "Users can view their own route completions"
  ON route_completions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own route completions"
  ON route_completions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own route completions"
  ON route_completions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own route completions"
  ON route_completions FOR DELETE
  USING (user_id = auth.uid());

-- Function to update average_completion_time when route is completed
CREATE OR REPLACE FUNCTION update_route_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment times_completed
  UPDATE saved_routes
  SET
    times_completed = times_completed + 1,
    average_completion_time = (
      SELECT AVG(completion_time)
      FROM route_completions
      WHERE saved_route_id = NEW.saved_route_id
    ),
    updated_at = TIMEZONE('utc', NOW())
  WHERE id = NEW.saved_route_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update route stats on completion
CREATE TRIGGER trigger_update_route_stats
  AFTER INSERT ON route_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_route_stats();
