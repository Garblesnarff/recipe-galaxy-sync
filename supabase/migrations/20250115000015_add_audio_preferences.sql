-- Add audio configuration to user profiles
-- This migration adds support for storing user audio preferences

-- Add audio_config column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS audio_config JSONB DEFAULT NULL;

-- Add comment to the column
COMMENT ON COLUMN profiles.audio_config IS 'Stores user audio preferences for workout announcements and sound effects';

-- Create an index on audio_config for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_audio_config ON profiles USING GIN (audio_config);

-- Update RLS policies (if needed)
-- The existing RLS policies on profiles should already cover this column
-- But we'll add a specific comment about audio_config access

-- Add helpful comment about the audio_config structure
COMMENT ON TABLE profiles IS 'User profiles including preferences, settings, and audio configuration.
audio_config structure:
{
  "enabled": boolean,
  "voiceAnnouncements": boolean,
  "soundEffects": boolean,
  "volume": number (0-100),
  "voice": "male" | "female" | "system",
  "voiceSpeed": number (0.5-2.0),
  "announceIntervals": number[] (e.g., [30, 10, 5, 3, 2, 1]),
  "announceSetCompletions": boolean,
  "announceRestPeriods": boolean,
  "announceWorkoutPhases": boolean,
  "musicDucking": boolean,
  "duckingLevel": number (0-100)
}';

-- Example query to set default audio config for a user:
-- UPDATE profiles
-- SET audio_config = '{
--   "enabled": true,
--   "voiceAnnouncements": true,
--   "soundEffects": true,
--   "volume": 80,
--   "voice": "system",
--   "voiceSpeed": 1.0,
--   "announceIntervals": [30, 10, 5, 3, 2, 1],
--   "announceSetCompletions": true,
--   "announceRestPeriods": true,
--   "announceWorkoutPhases": true,
--   "musicDucking": true,
--   "duckingLevel": 40
-- }'::jsonb
-- WHERE id = 'user-id-here';
