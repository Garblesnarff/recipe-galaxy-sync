-- Add wearable device integration tables

-- Wearable Connections Table
CREATE TABLE wearable_connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('apple_health', 'google_fit', 'fitbit', 'garmin')),
  is_connected BOOLEAN DEFAULT false NOT NULL,
  sync_enabled BOOLEAN DEFAULT true NOT NULL,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  sync_preferences JSONB DEFAULT '{
    "import_workouts": true,
    "export_workouts": true,
    "import_hr": true,
    "import_calories": true,
    "import_steps": true
  }'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(user_id, platform)
);

-- Wearable Sync Log Table
CREATE TABLE wearable_sync_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  sync_type TEXT NOT NULL CHECK (sync_type IN ('import', 'export')),
  items_synced INTEGER DEFAULT 0,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('success', 'partial', 'failed')),
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Imported Health Data Table
CREATE TABLE imported_health_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  platform TEXT NOT NULL,
  data_type TEXT NOT NULL CHECK (data_type IN ('workout', 'heart_rate', 'steps', 'calories', 'sleep')),
  date_recorded DATE NOT NULL,
  value JSONB NOT NULL,
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  UNIQUE(user_id, platform, data_type, date_recorded)
);

-- Create indexes for better query performance
CREATE INDEX idx_wearable_connections_user_id ON wearable_connections(user_id);
CREATE INDEX idx_wearable_connections_platform ON wearable_connections(platform);
CREATE INDEX idx_wearable_connections_is_connected ON wearable_connections(is_connected);

CREATE INDEX idx_wearable_sync_log_user_id ON wearable_sync_log(user_id);
CREATE INDEX idx_wearable_sync_log_platform ON wearable_sync_log(platform);
CREATE INDEX idx_wearable_sync_log_synced_at ON wearable_sync_log(synced_at);
CREATE INDEX idx_wearable_sync_log_sync_status ON wearable_sync_log(sync_status);

CREATE INDEX idx_imported_health_data_user_id ON imported_health_data(user_id);
CREATE INDEX idx_imported_health_data_platform ON imported_health_data(platform);
CREATE INDEX idx_imported_health_data_data_type ON imported_health_data(data_type);
CREATE INDEX idx_imported_health_data_date_recorded ON imported_health_data(date_recorded);
CREATE INDEX idx_imported_health_data_workout_log_id ON imported_health_data(workout_log_id);

-- Enable Row Level Security
ALTER TABLE wearable_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE wearable_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE imported_health_data ENABLE ROW LEVEL SECURITY;

-- RLS Policies for wearable_connections
CREATE POLICY "Users can view their own wearable connections"
  ON wearable_connections FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own wearable connections"
  ON wearable_connections FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own wearable connections"
  ON wearable_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own wearable connections"
  ON wearable_connections FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for wearable_sync_log
CREATE POLICY "Users can view their own sync logs"
  ON wearable_sync_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own sync logs"
  ON wearable_sync_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for imported_health_data
CREATE POLICY "Users can view their own imported health data"
  ON imported_health_data FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own imported health data"
  ON imported_health_data FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own imported health data"
  ON imported_health_data FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own imported health data"
  ON imported_health_data FOR DELETE
  USING (user_id = auth.uid());
