import { useState, useRef, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  startVideoRecording,
  stopVideoRecording,
  uploadVideo,
  checkVideoRecordingSupport,
  getCameraDevices,
} from "@/services/video/videoRecording";
import { toast } from "sonner";

interface UseVideoRecordingOptions {
  userId: string | null;
  exerciseName: string;
  workoutLogId?: string | null;
  maxDuration?: number; // in seconds
  onVideoRecorded?: (videoId: string) => void;
}

export function useVideoRecording({
  userId,
  exerciseName,
  workoutLogId,
  maxDuration = 300, // 5 minutes default
  onVideoRecorded,
}: UseVideoRecordingOptions) {
  const queryClient = useQueryClient();
  const [isRecording, setIsRecording] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Check browser support
  const browserSupport = checkVideoRecordingSupport();

  // Get available cameras
  const loadCameras = useCallback(async () => {
    const cameras = await getCameraDevices();
    setAvailableCameras(cameras);
  }, []);

  // Start camera preview
  const startPreview = useCallback(async () => {
    try {
      setIsPreparing(true);
      const recorder = await startVideoRecording(facingMode);
      const stream = recorder.stream;

      setPreviewStream(stream);
      mediaRecorderRef.current = recorder;
      await loadCameras();

      setIsPreparing(false);
    } catch (error) {
      console.error("Error starting preview:", error);
      toast.error("Failed to access camera. Please check permissions.");
      setIsPreparing(false);
    }
  }, [facingMode, loadCameras]);

  // Stop camera preview
  const stopPreview = useCallback(() => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
      setPreviewStream(null);
    }
    mediaRecorderRef.current = null;
  }, [previewStream]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current) {
      toast.error("Camera not ready. Please try again.");
      return;
    }

    setIsRecording(true);
    setRecordingDuration(0);
    mediaRecorderRef.current.start();

    // Start duration timer
    timerRef.current = setInterval(() => {
      setRecordingDuration((prev) => {
        const newDuration = prev + 1;

        // Auto-stop if max duration reached
        if (newDuration >= maxDuration) {
          stopRecordingInternal();
          clearInterval(timerRef.current!);
        }

        return newDuration;
      });
    }, 1000);
  }, [maxDuration]);

  // Stop recording (internal)
  const stopRecordingInternal = useCallback(async () => {
    if (!mediaRecorderRef.current || !isRecording) return;

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    try {
      const blob = await stopVideoRecording(mediaRecorderRef.current);
      setRecordedBlob(blob);
      stopPreview();
    } catch (error) {
      console.error("Error stopping recording:", error);
      toast.error("Failed to stop recording");
    }
  }, [isRecording, stopPreview]);

  // Discard recorded video and restart
  const discardRecording = useCallback(() => {
    setRecordedBlob(null);
    setRecordingDuration(0);
    startPreview();
  }, [startPreview]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (blob: Blob) => {
      if (!userId) throw new Error("User must be logged in");

      return await uploadVideo(
        userId,
        blob,
        exerciseName,
        workoutLogId,
        (progress) => setUploadProgress(progress)
      );
    },
    onSuccess: (videoId) => {
      queryClient.invalidateQueries({ queryKey: ["user-videos"] });
      queryClient.invalidateQueries({ queryKey: ["exercise-videos", exerciseName] });
      toast.success("Video uploaded successfully!");

      setRecordedBlob(null);
      setRecordingDuration(0);
      setUploadProgress(0);

      if (onVideoRecorded) {
        onVideoRecorded(videoId);
      }
    },
    onError: (error) => {
      console.error("Error uploading video:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to upload video"
      );
      setUploadProgress(0);
    },
  });

  // Upload recorded video
  const uploadRecording = useCallback(() => {
    if (!recordedBlob) {
      toast.error("No recording to upload");
      return;
    }

    if (!userId) {
      toast.error("You must be logged in to upload videos");
      return;
    }

    uploadMutation.mutate(recordedBlob);
  }, [recordedBlob, userId, uploadMutation]);

  // Toggle camera (front/back)
  const toggleCamera = useCallback(() => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
    if (previewStream) {
      stopPreview();
      // Will need to restart preview with new facing mode
      setTimeout(() => startPreview(), 100);
    }
  }, [previewStream, stopPreview, startPreview]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    // State
    isRecording,
    isPreparing,
    recordingDuration,
    previewStream,
    recordedBlob,
    facingMode,
    uploadProgress,
    availableCameras,
    browserSupport,
    isUploading: uploadMutation.isPending,

    // Actions
    startPreview,
    stopPreview,
    startRecording,
    stopRecording: stopRecordingInternal,
    discardRecording,
    uploadRecording,
    toggleCamera,

    // Utils
    formatDuration,
  };
}
