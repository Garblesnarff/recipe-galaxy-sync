import { supabase } from "@/integrations/supabase/client";
import { FormAnalysisResult, FormAnalysis, VideoComparisonData } from "@/types/video";
import { analyzeVideoForm } from "@/lib/formAnalysisAI";
import { getVideoUrl } from "@/lib/videoStorage";

/**
 * Analyze form using AI and save results
 */
export const analyzeFormWithAI = async (
  videoId: string,
  exerciseName: string
): Promise<FormAnalysisResult> => {
  try {
    // Get video details
    const { data: video, error: videoError } = await supabase
      .from("exercise_videos")
      .select("video_url")
      .eq("id", videoId)
      .single();

    if (videoError) throw videoError;

    // Get signed URL for video
    const videoUrl = await getVideoUrl(video.video_url);

    // Fetch video blob
    const response = await fetch(videoUrl);
    const videoBlob = await response.blob();

    // Analyze with AI
    const analysis = await analyzeVideoForm(videoBlob, exerciseName);

    return analysis;
  } catch (error) {
    console.error("Error analyzing form with AI:", error);
    throw error;
  }
};

/**
 * Save form analysis to database
 */
export const saveFormAnalysis = async (
  videoId: string,
  analysis: FormAnalysisResult,
  analysisType: "ai_generated" | "trainer_feedback" | "self_assessment" = "ai_generated",
  analyzedBy?: string
): Promise<FormAnalysis> => {
  try {
    const { data, error } = await supabase
      .from("form_analysis")
      .insert({
        video_id: videoId,
        analysis_type: analysisType,
        overall_score: analysis.overallScore,
        feedback_text: analysis.feedbackText,
        issues_detected: analysis.issuesDetected,
        strengths: analysis.strengths,
        improvement_suggestions: analysis.improvementSuggestions,
        analyzed_by: analyzedBy || (analysisType === "ai_generated" ? "ai" : null),
        analyzed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return data as FormAnalysis;
  } catch (error) {
    console.error("Error saving form analysis:", error);
    throw error;
  }
};

/**
 * Get all form analyses for a video
 */
export const getFormAnalysis = async (videoId: string): Promise<FormAnalysis[]> => {
  try {
    const { data, error } = await supabase
      .from("form_analysis")
      .select("*")
      .eq("video_id", videoId)
      .order("analyzed_at", { ascending: false });

    if (error) throw error;

    return data as FormAnalysis[];
  } catch (error) {
    console.error("Error fetching form analysis:", error);
    throw error;
  }
};

/**
 * Get the latest AI analysis for a video
 */
export const getLatestAIAnalysis = async (
  videoId: string
): Promise<FormAnalysis | null> => {
  try {
    const { data, error } = await supabase
      .from("form_analysis")
      .select("*")
      .eq("video_id", videoId)
      .eq("analysis_type", "ai_generated")
      .order("analyzed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    return data as FormAnalysis | null;
  } catch (error) {
    console.error("Error fetching latest AI analysis:", error);
    throw error;
  }
};

/**
 * Compare two videos and their analyses
 */
export const compareVideos = async (
  videoId1: string,
  videoId2: string
): Promise<VideoComparisonData> => {
  try {
    // Fetch both videos with their analyses
    const { data: video1Data, error: error1 } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("id", videoId1)
      .single();

    const { data: video2Data, error: error2 } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("id", videoId2)
      .single();

    if (error1 || error2) throw error1 || error2;

    // Get latest AI analysis for each
    const analysis1 = video1Data.analysis?.find(
      (a: any) => a.analysis_type === "ai_generated"
    );
    const analysis2 = video2Data.analysis?.find(
      (a: any) => a.analysis_type === "ai_generated"
    );

    // Calculate improvements
    const improvements: string[] = [];
    let scoreChange = 0;

    if (analysis1 && analysis2) {
      scoreChange = analysis2.overall_score - analysis1.overall_score;

      // Identify improvements
      const oldIssues = new Set(analysis1.issues_detected || []);
      const newIssues = new Set(analysis2.issues_detected || []);

      // Issues that were resolved
      oldIssues.forEach((issue) => {
        if (!newIssues.has(issue)) {
          improvements.push(`Resolved: ${issue}`);
        }
      });

      // New strengths
      const oldStrengths = new Set(analysis1.strengths || []);
      const newStrengths = new Set(analysis2.strengths || []);

      newStrengths.forEach((strength) => {
        if (!oldStrengths.has(strength)) {
          improvements.push(`New strength: ${strength}`);
        }
      });
    }

    return {
      video1: video1Data,
      video2: video2Data,
      analysis1,
      analysis2,
      improvements,
      scoreChange,
    };
  } catch (error) {
    console.error("Error comparing videos:", error);
    throw error;
  }
};

/**
 * Update an existing analysis
 */
export const updateFormAnalysis = async (
  analysisId: string,
  updates: Partial<FormAnalysisResult>
): Promise<FormAnalysis> => {
  try {
    const { data, error } = await supabase
      .from("form_analysis")
      .update({
        overall_score: updates.overallScore,
        feedback_text: updates.feedbackText,
        issues_detected: updates.issuesDetected,
        strengths: updates.strengths,
        improvement_suggestions: updates.improvementSuggestions,
      })
      .eq("id", analysisId)
      .select()
      .single();

    if (error) throw error;

    return data as FormAnalysis;
  } catch (error) {
    console.error("Error updating form analysis:", error);
    throw error;
  }
};

/**
 * Delete form analysis
 */
export const deleteFormAnalysis = async (analysisId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from("form_analysis")
      .delete()
      .eq("id", analysisId);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting form analysis:", error);
    throw error;
  }
};

/**
 * Get average score for an exercise across all user's videos
 */
export const getAverageScoreForExercise = async (
  userId: string,
  exerciseName: string
): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        id,
        analysis:form_analysis(overall_score)
      `)
      .eq("user_id", userId)
      .eq("exercise_name", exerciseName);

    if (error) throw error;

    let totalScore = 0;
    let count = 0;

    data.forEach((video: any) => {
      if (video.analysis && video.analysis.length > 0) {
        // Get latest AI analysis
        const aiAnalysis = video.analysis.find(
          (a: any) => a.analysis_type === "ai_generated"
        );
        if (aiAnalysis && aiAnalysis.overall_score) {
          totalScore += aiAnalysis.overall_score;
          count++;
        }
      }
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  } catch (error) {
    console.error("Error getting average score:", error);
    return 0;
  }
};

/**
 * Get form progress over time for an exercise
 */
export const getFormProgressOverTime = async (
  userId: string,
  exerciseName: string
): Promise<Array<{ date: string; score: number; videoId: string }>> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        id,
        recorded_at,
        analysis:form_analysis(overall_score, analyzed_at, analysis_type)
      `)
      .eq("user_id", userId)
      .eq("exercise_name", exerciseName)
      .order("recorded_at", { ascending: true });

    if (error) throw error;

    const progress: Array<{ date: string; score: number; videoId: string }> = [];

    data.forEach((video: any) => {
      if (video.analysis && video.analysis.length > 0) {
        // Get latest AI analysis
        const aiAnalysis = video.analysis
          .filter((a: any) => a.analysis_type === "ai_generated")
          .sort((a: any, b: any) =>
            new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime()
          )[0];

        if (aiAnalysis && aiAnalysis.overall_score) {
          progress.push({
            date: video.recorded_at,
            score: aiAnalysis.overall_score,
            videoId: video.id,
          });
        }
      }
    });

    return progress;
  } catch (error) {
    console.error("Error getting form progress:", error);
    return [];
  }
};
