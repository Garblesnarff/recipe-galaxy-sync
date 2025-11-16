-- Offline Support Tables for Recipe Galaxy Sync
-- Migration: 20250115000014_add_offline_support.sql

-- Table to track offline operations that need to be synced
CREATE TABLE IF NOT EXISTS offline_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'update', 'delete')),
  table_name TEXT NOT NULL,
  data JSONB NOT NULL,
  created_at_offline TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  synced_at TIMESTAMPTZ,
  sync_status TEXT NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
  error_message TEXT,
  retry_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table to track sync conflicts between local and server data
CREATE TABLE IF NOT EXISTS sync_conflicts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  local_data JSONB NOT NULL,
  server_data JSONB NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_strategy TEXT CHECK (resolution_strategy IN ('use_local', 'use_server', 'manual')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_offline_queue_user_status ON offline_queue(user_id, sync_status);
CREATE INDEX IF NOT EXISTS idx_offline_queue_created ON offline_queue(created_at_offline);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user ON sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_resolved ON sync_conflicts(resolved_at);

-- RLS Policies for offline_queue
ALTER TABLE offline_queue ENABLE ROW LEVEL SECURITY;

-- Users can only see their own offline queue items
CREATE POLICY "Users can view own offline queue"
  ON offline_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own offline queue items
CREATE POLICY "Users can insert own offline queue"
  ON offline_queue FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own offline queue items
CREATE POLICY "Users can update own offline queue"
  ON offline_queue FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own offline queue items
CREATE POLICY "Users can delete own offline queue"
  ON offline_queue FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for sync_conflicts
ALTER TABLE sync_conflicts ENABLE ROW LEVEL SECURITY;

-- Users can only see their own conflicts
CREATE POLICY "Users can view own conflicts"
  ON sync_conflicts FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own conflicts
CREATE POLICY "Users can insert own conflicts"
  ON sync_conflicts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conflicts
CREATE POLICY "Users can update own conflicts"
  ON sync_conflicts FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own conflicts
CREATE POLICY "Users can delete own conflicts"
  ON sync_conflicts FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update updated_at
CREATE TRIGGER update_offline_queue_updated_at
  BEFORE UPDATE ON offline_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sync_conflicts_updated_at
  BEFORE UPDATE ON sync_conflicts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up old synced items (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_synced_items()
RETURNS void AS $$
BEGIN
  DELETE FROM offline_queue
  WHERE sync_status = 'synced'
    AND synced_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Comment on tables for documentation
COMMENT ON TABLE offline_queue IS 'Stores offline operations that need to be synced to the server when connection is restored';
COMMENT ON TABLE sync_conflicts IS 'Tracks conflicts between local offline data and server data that require resolution';
