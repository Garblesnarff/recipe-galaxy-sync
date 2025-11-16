import { supabase } from "@/integrations/supabase/client";
import {
  uploadVideoToStorage,
  uploadThumbnail,
  generateVideoThumbnail,
  getVideoDuration,
  deleteVideoFromStorage,
  getVideoUrl,
} from "@/lib/videoStorage";

/**
 * Start video recording using MediaRecorder
 */
export const startVideoRecording = async (
  facingMode: "user" | "environment" = "environment"
): Promise<MediaRecorder> => {
  try {
    // Request camera and microphone permissions
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: true,
    });

    // Create MediaRecorder with optimal settings
    const options = {
      mimeType: "video/webm;codecs=vp9",
      videoBitsPerSecond: 2500000, // 2.5 Mbps
    };

    // Fallback for browsers that don't support vp9
    const mimeType = MediaRecorder.isTypeSupported(options.mimeType)
      ? options.mimeType
      : "video/webm";

    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: options.videoBitsPerSecondary,
    });

    return mediaRecorder;
  } catch (error) {
    console.error("Error starting video recording:", error);
    throw error;
  }
};

/**
 * Stop video recording and return the video blob
 */
export const stopVideoRecording = (recorder: MediaRecorder): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const chunks: Blob[] = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: recorder.mimeType });

      // Stop all tracks to release camera
      recorder.stream.getTracks().forEach((track) => track.stop());

      resolve(blob);
    };

    recorder.onerror = (event) => {
      reject(new Error("Recording error"));
    };

    if (recorder.state !== "inactive") {
      recorder.stop();
    }
  });
};

/**
 * Upload video and create database entry
 */
export const uploadVideo = async (
  userId: string,
  videoBlob: Blob,
  exerciseName: string,
  workoutLogId?: string | null,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Generate thumbnail
    const thumbnailBlob = await generateVideoThumbnail(videoBlob);

    // Get video duration
    const duration = await getVideoDuration(videoBlob);

    // Generate unique filename
    const fileName = `${exerciseName.replace(/\s+/g, "_")}_${Date.now()}.webm`;

    // Upload video to storage
    const videoPath = await uploadVideoToStorage(
      userId,
      videoBlob,
      fileName,
      onProgress
    );

    // Upload thumbnail
    const thumbnailPath = await uploadThumbnail(userId, thumbnailBlob, fileName);

    // Get public URLs
    const videoUrl = await getVideoUrl(videoPath);
    const thumbnailUrl = await getVideoUrl(thumbnailPath);

    // Create database entry
    const { data, error } = await supabase
      .from("exercise_videos")
      .insert({
        user_id: userId,
        workout_log_id: workoutLogId || null,
        exercise_name: exerciseName,
        video_url: videoPath, // Store the path, not the signed URL
        thumbnail_url: thumbnailPath,
        duration_seconds: duration,
        recorded_at: new Date().toISOString(),
        is_public: false,
      })
      .select()
      .single();

    if (error) throw error;

    return data.id;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};

/**
 * Delete video and its database entry
 */
export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    // Get video details
    const { data: video, error: fetchError } = await supabase
      .from("exercise_videos")
      .select("video_url, thumbnail_url")
      .eq("id", videoId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage
    if (video.video_url) {
      await deleteVideoFromStorage(video.video_url);
    }
    if (video.thumbnail_url) {
      await deleteVideoFromStorage(video.thumbnail_url);
    }

    // Delete database entry (this will cascade delete form_analysis entries)
    const { error: deleteError } = await supabase
      .from("exercise_videos")
      .delete()
      .eq("id", videoId);

    if (deleteError) throw deleteError;
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error;
  }
};

/**
 * Get video playback URL
 */
export const getVideoPlaybackUrl = async (videoId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from("exercise_videos")
      .select("video_url")
      .eq("id", videoId)
      .single();

    if (error) throw error;

    return await getVideoUrl(data.video_url);
  } catch (error) {
    console.error("Error getting video URL:", error);
    throw error;
  }
};

/**
 * Check if browser supports video recording
 */
export const checkVideoRecordingSupport = (): {
  supported: boolean;
  message?: string;
} => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    return {
      supported: false,
      message: "Your browser does not support video recording. Please use a modern browser.",
    };
  }

  if (!window.MediaRecorder) {
    return {
      supported: false,
      message: "Your browser does not support MediaRecorder API.",
    };
  }

  return { supported: true };
};

/**
 * Get available camera devices
 */
export const getCameraDevices = async (): Promise<MediaDeviceInfo[]> => {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    return devices.filter((device) => device.kind === "videoinput");
  } catch (error) {
    console.error("Error getting camera devices:", error);
    return [];
  }
};
