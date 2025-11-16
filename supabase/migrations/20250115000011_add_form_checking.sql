-- Create form checking and video analysis tables

-- Exercise Videos Table
CREATE TABLE exercise_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  workout_log_id UUID REFERENCES workout_logs(id) ON DELETE SET NULL,
  exercise_name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER NOT NULL,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Form Analysis Table
CREATE TABLE form_analysis (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES exercise_videos(id) ON DELETE CASCADE NOT NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('ai_generated', 'trainer_feedback', 'self_assessment')),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  feedback_text TEXT,
  issues_detected JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  improvement_suggestions JSONB DEFAULT '[]'::jsonb,
  analyzed_by TEXT,
  analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_exercise_videos_user_id ON exercise_videos(user_id);
CREATE INDEX idx_exercise_videos_workout_log_id ON exercise_videos(workout_log_id);
CREATE INDEX idx_exercise_videos_exercise_name ON exercise_videos(exercise_name);
CREATE INDEX idx_exercise_videos_is_public ON exercise_videos(is_public);
CREATE INDEX idx_exercise_videos_recorded_at ON exercise_videos(recorded_at);

CREATE INDEX idx_form_analysis_video_id ON form_analysis(video_id);
CREATE INDEX idx_form_analysis_type ON form_analysis(analysis_type);
CREATE INDEX idx_form_analysis_analyzed_at ON form_analysis(analyzed_at);

-- Enable Row Level Security
ALTER TABLE exercise_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analysis ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exercise_videos

-- Users can view their own videos and public videos
CREATE POLICY "Users can view their own videos"
  ON exercise_videos FOR SELECT
  USING (user_id = auth.uid() OR is_public = true);

-- Users can create their own videos
CREATE POLICY "Users can create their own videos"
  ON exercise_videos FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own videos
CREATE POLICY "Users can update their own videos"
  ON exercise_videos FOR UPDATE
  USING (user_id = auth.uid());

-- Users can delete their own videos
CREATE POLICY "Users can delete their own videos"
  ON exercise_videos FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for form_analysis

-- Users can view analysis for videos they can access
CREATE POLICY "Users can view analysis for accessible videos"
  ON form_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM exercise_videos
      WHERE exercise_videos.id = form_analysis.video_id
      AND (exercise_videos.user_id = auth.uid() OR exercise_videos.is_public = true)
    )
  );

-- Users can create analysis for their own videos
CREATE POLICY "Users can create analysis for their videos"
  ON form_analysis FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM exercise_videos
      WHERE exercise_videos.id = form_analysis.video_id
      AND exercise_videos.user_id = auth.uid()
    )
  );

-- Users can update analysis for their own videos
CREATE POLICY "Users can update analysis for their videos"
  ON form_analysis FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM exercise_videos
      WHERE exercise_videos.id = form_analysis.video_id
      AND exercise_videos.user_id = auth.uid()
    )
  );

-- Users can delete analysis for their own videos
CREATE POLICY "Users can delete analysis for their videos"
  ON form_analysis FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM exercise_videos
      WHERE exercise_videos.id = form_analysis.video_id
      AND exercise_videos.user_id = auth.uid()
    )
  );

-- Create storage bucket for exercise videos (via Supabase dashboard or API)
-- This is a comment as storage buckets are typically created via the Supabase dashboard or API
-- Bucket name: 'exercise-videos'
-- Public: false (requires authentication)
-- File size limit: 100MB per file
-- Allowed MIME types: video/mp4, video/webm, video/quicktime

-- Storage policies would be:
-- 1. Users can upload videos to their own folder: bucket_id = 'exercise-videos' AND (storage.foldername(name))[1] = auth.uid()::text
-- 2. Users can view their own videos and public videos
-- 3. Users can delete their own videos
