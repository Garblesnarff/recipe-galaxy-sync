export interface ExerciseVideo {
  id: string;
  user_id: string;
  workout_log_id: string | null;
  exercise_name: string;
  video_url: string;
  thumbnail_url: string | null;
  duration_seconds: number;
  recorded_at: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export type AnalysisType = 'ai_generated' | 'trainer_feedback' | 'self_assessment';

export interface FormAnalysis {
  id: string;
  video_id: string;
  analysis_type: AnalysisType;
  overall_score: number;
  feedback_text: string | null;
  issues_detected: string[];
  strengths: string[];
  improvement_suggestions: string[];
  analyzed_by: string | null;
  analyzed_at: string;
  created_at: string;
}

export interface FormAnalysisResult {
  overallScore: number;
  feedbackText: string;
  issuesDetected: string[];
  strengths: string[];
  improvementSuggestions: string[];
}

export interface VideoWithAnalysis extends ExerciseVideo {
  analysis?: FormAnalysis[];
}

export interface VideoComparisonData {
  video1: ExerciseVideo;
  video2: ExerciseVideo;
  analysis1?: FormAnalysis;
  analysis2?: FormAnalysis;
  improvements: string[];
  scoreChange: number;
}
