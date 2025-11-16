import { supabase } from "@/integrations/supabase/client";
import { ExerciseVideo, VideoWithAnalysis } from "@/types/video";

/**
 * Get all videos for a user
 */
export const getUserVideos = async (
  userId: string,
  options?: {
    limit?: number;
    offset?: number;
    sortBy?: "recorded_at" | "created_at";
    sortOrder?: "asc" | "desc";
  }
): Promise<VideoWithAnalysis[]> => {
  try {
    let query = supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("user_id", userId);

    // Apply sorting
    const sortBy = options?.sortBy || "recorded_at";
    const sortOrder = options?.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    if (options?.limit) {
      query = query.limit(options.limit);
    }
    if (options?.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as VideoWithAnalysis[];
  } catch (error) {
    console.error("Error fetching user videos:", error);
    throw error;
  }
};

/**
 * Get videos for a specific exercise
 */
export const getVideosByExercise = async (
  userId: string,
  exerciseName: string,
  options?: {
    limit?: number;
    includePublic?: boolean;
  }
): Promise<VideoWithAnalysis[]> => {
  try {
    let query = supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("exercise_name", exerciseName);

    // Filter by user or include public videos
    if (options?.includePublic) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq("user_id", userId);
    }

    query = query.order("recorded_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data as VideoWithAnalysis[];
  } catch (error) {
    console.error("Error fetching videos by exercise:", error);
    throw error;
  }
};

/**
 * Get public form example videos (good form demonstrations)
 */
export const getPublicFormVideos = async (
  exerciseName?: string,
  options?: {
    limit?: number;
    minScore?: number;
  }
): Promise<VideoWithAnalysis[]> => {
  try {
    let query = supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("is_public", true);

    if (exerciseName) {
      query = query.eq("exercise_name", exerciseName);
    }

    query = query.order("recorded_at", { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;

    if (error) throw error;

    let videos = data as VideoWithAnalysis[];

    // Filter by minimum score if specified
    if (options?.minScore) {
      videos = videos.filter((video) => {
        const aiAnalysis = video.analysis?.find(
          (a) => a.analysis_type === "ai_generated"
        );
        return aiAnalysis && aiAnalysis.overall_score >= (options.minScore || 0);
      });
    }

    return videos;
  } catch (error) {
    console.error("Error fetching public form videos:", error);
    throw error;
  }
};

/**
 * Mark video as public example (requires good form score)
 */
export const markVideoAsExample = async (
  videoId: string,
  isExample: boolean
): Promise<void> => {
  try {
    // If marking as example, verify it has a good form score
    if (isExample) {
      const { data: analysisData, error: analysisError } = await supabase
        .from("form_analysis")
        .select("overall_score")
        .eq("video_id", videoId)
        .eq("analysis_type", "ai_generated")
        .order("analyzed_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (analysisError) throw analysisError;

      if (!analysisData || analysisData.overall_score < 80) {
        throw new Error(
          "Video must have a form score of at least 80 to be marked as an example"
        );
      }
    }

    const { error } = await supabase
      .from("exercise_videos")
      .update({ is_public: isExample })
      .eq("id", videoId);

    if (error) throw error;
  } catch (error) {
    console.error("Error marking video as example:", error);
    throw error;
  }
};

/**
 * Get video by ID
 */
export const getVideoById = async (videoId: string): Promise<VideoWithAnalysis> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("id", videoId)
      .single();

    if (error) throw error;

    return data as VideoWithAnalysis;
  } catch (error) {
    console.error("Error fetching video by ID:", error);
    throw error;
  }
};

/**
 * Get videos for a specific workout log
 */
export const getVideosByWorkoutLog = async (
  workoutLogId: string
): Promise<VideoWithAnalysis[]> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("workout_log_id", workoutLogId)
      .order("recorded_at", { ascending: true });

    if (error) throw error;

    return data as VideoWithAnalysis[];
  } catch (error) {
    console.error("Error fetching videos by workout log:", error);
    throw error;
  }
};

/**
 * Get recent videos across all exercises
 */
export const getRecentVideos = async (
  userId: string,
  limit: number = 10
): Promise<VideoWithAnalysis[]> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("user_id", userId)
      .order("recorded_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return data as VideoWithAnalysis[];
  } catch (error) {
    console.error("Error fetching recent videos:", error);
    throw error;
  }
};

/**
 * Get video statistics for a user
 */
export const getUserVideoStats = async (
  userId: string
): Promise<{
  totalVideos: number;
  exercisesCovered: string[];
  averageScore: number;
  latestScore: number;
}> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        id,
        exercise_name,
        recorded_at,
        analysis:form_analysis(overall_score, analysis_type, analyzed_at)
      `)
      .eq("user_id", userId);

    if (error) throw error;

    const exercisesCovered = [...new Set(data.map((v) => v.exercise_name))];
    const totalVideos = data.length;

    let totalScore = 0;
    let scoreCount = 0;
    let latestScore = 0;
    let latestDate = new Date(0);

    data.forEach((video: any) => {
      const aiAnalyses = video.analysis?.filter(
        (a: any) => a.analysis_type === "ai_generated"
      ) || [];

      if (aiAnalyses.length > 0) {
        const latestAnalysis = aiAnalyses.sort(
          (a: any, b: any) =>
            new Date(b.analyzed_at).getTime() - new Date(a.analyzed_at).getTime()
        )[0];

        if (latestAnalysis.overall_score) {
          totalScore += latestAnalysis.overall_score;
          scoreCount++;

          const videoDate = new Date(video.recorded_at);
          if (videoDate > latestDate) {
            latestDate = videoDate;
            latestScore = latestAnalysis.overall_score;
          }
        }
      }
    });

    return {
      totalVideos,
      exercisesCovered,
      averageScore: scoreCount > 0 ? Math.round(totalScore / scoreCount) : 0,
      latestScore,
    };
  } catch (error) {
    console.error("Error fetching user video stats:", error);
    return {
      totalVideos: 0,
      exercisesCovered: [],
      averageScore: 0,
      latestScore: 0,
    };
  }
};

/**
 * Search videos by exercise name
 */
export const searchVideos = async (
  userId: string,
  searchQuery: string
): Promise<VideoWithAnalysis[]> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select(`
        *,
        analysis:form_analysis(*)
      `)
      .eq("user_id", userId)
      .ilike("exercise_name", `%${searchQuery}%`)
      .order("recorded_at", { ascending: false });

    if (error) throw error;

    return data as VideoWithAnalysis[];
  } catch (error) {
    console.error("Error searching videos:", error);
    throw error;
  }
};
