import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "exercise-videos";
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

/**
 * Compress video before upload using canvas and MediaRecorder
 */
export const compressVideo = async (
  videoBlob: Blob,
  targetWidth: number = 1280
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Calculate dimensions maintaining aspect ratio
      const aspectRatio = video.videoHeight / video.videoWidth;
      canvas.width = targetWidth;
      canvas.height = targetWidth * aspectRatio;

      // Create MediaRecorder to compress
      const stream = canvas.captureStream(30); // 30 fps
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp9",
        videoBitsPerSecond: 2500000, // 2.5 Mbps
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
      mediaRecorder.onstop = () => {
        const compressedBlob = new Blob(chunks, { type: "video/webm" });
        URL.revokeObjectURL(video.src);
        resolve(compressedBlob);
      };

      mediaRecorder.start();

      // Draw frames
      video.play();
      const drawFrame = () => {
        if (!video.paused && !video.ended) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          requestAnimationFrame(drawFrame);
        } else {
          mediaRecorder.stop();
        }
      };
      drawFrame();
    };

    video.onerror = () => reject(new Error("Error loading video"));
  });
};

/**
 * Upload video to Supabase Storage
 */
export const uploadVideoToStorage = async (
  userId: string,
  videoBlob: Blob,
  fileName: string,
  onProgress?: (progress: number) => void
): Promise<string> => {
  try {
    // Check file size
    if (videoBlob.size > MAX_FILE_SIZE) {
      throw new Error(`Video size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
    }

    // Create unique file path
    const timestamp = Date.now();
    const filePath = `${userId}/${timestamp}_${fileName}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, videoBlob, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    return data.path;
  } catch (error) {
    console.error("Error uploading video:", error);
    throw error;
  }
};

/**
 * Get signed URL for video playback
 */
export const getVideoUrl = async (filePath: string): Promise<string> => {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // 1 hour expiry

    if (error) throw error;
    return data.signedUrl;
  } catch (error) {
    console.error("Error getting video URL:", error);
    throw error;
  }
};

/**
 * Delete video from storage
 */
export const deleteVideoFromStorage = async (filePath: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting video:", error);
    throw error;
  }
};

/**
 * Generate thumbnail from video blob
 */
export const generateVideoThumbnail = async (
  videoBlob: Blob,
  timeInSeconds: number = 1
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      reject(new Error("Could not get canvas context"));
      return;
    }

    video.src = URL.createObjectURL(videoBlob);
    video.currentTime = timeInSeconds;

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to generate thumbnail"));
        }
      }, "image/jpeg", 0.8);
    };

    video.onerror = () => reject(new Error("Error loading video for thumbnail"));
  });
};

/**
 * Upload thumbnail to storage
 */
export const uploadThumbnail = async (
  userId: string,
  thumbnailBlob: Blob,
  videoFileName: string
): Promise<string> => {
  try {
    const timestamp = Date.now();
    const thumbnailPath = `${userId}/thumbnails/${timestamp}_${videoFileName}.jpg`;

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(thumbnailPath, thumbnailBlob, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;
    return data.path;
  } catch (error) {
    console.error("Error uploading thumbnail:", error);
    throw error;
  }
};

/**
 * Get video duration from blob
 */
export const getVideoDuration = async (videoBlob: Blob): Promise<number> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(videoBlob);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.floor(video.duration));
    };

    video.onerror = () => reject(new Error("Error loading video"));
  });
};
