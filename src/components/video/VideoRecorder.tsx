import { useEffect, useRef, useState } from "react";
import { useVideoRecording } from "@/hooks/useVideoRecording";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Camera, StopCircle, RotateCw, Upload, X, Play } from "lucide-react";

interface VideoRecorderProps {
  exerciseName: string;
  userId: string | null;
  workoutLogId?: string | null;
  onVideoRecorded?: (videoId: string) => void;
  onClose?: () => void;
  maxDuration?: number; // seconds
}

export function VideoRecorder({
  exerciseName,
  userId,
  workoutLogId,
  onVideoRecorded,
  onClose,
  maxDuration = 300,
}: VideoRecorderProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const playbackRef = useRef<HTMLVideoElement>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);

  const {
    isRecording,
    isPreparing,
    recordingDuration,
    previewStream,
    recordedBlob,
    uploadProgress,
    browserSupport,
    isUploading,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    discardRecording,
    uploadRecording,
    toggleCamera,
    formatDuration,
  } = useVideoRecording({
    userId,
    exerciseName,
    workoutLogId,
    maxDuration,
    onVideoRecorded,
  });

  // Start preview on mount
  useEffect(() => {
    if (browserSupport.supported) {
      startPreview();
    }

    return () => {
      stopPreview();
    };
  }, []);

  // Update video preview stream
  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  // Create playback URL for recorded video
  useEffect(() => {
    if (recordedBlob) {
      const url = URL.createObjectURL(recordedBlob);
      setPlaybackUrl(url);

      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [recordedBlob]);

  // Update playback video source
  useEffect(() => {
    if (playbackRef.current && playbackUrl) {
      playbackRef.current.src = playbackUrl;
    }
  }, [playbackUrl]);

  // Handle countdown before recording
  const handleStartWithCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          startRecording();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!browserSupport.supported) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="font-semibold">Browser Not Supported</p>
            <p className="text-sm mt-2">{browserSupport.message}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {recordedBlob ? "Review Recording" : "Record Form Check"}
            </h3>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <p className="text-sm text-muted-foreground">Exercise: {exerciseName}</p>

          {/* Video Preview / Playback */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            {!recordedBlob ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                {countdown !== null && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white text-8xl font-bold">{countdown}</div>
                  </div>
                )}
                {isPreparing && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="text-white">Starting camera...</div>
                  </div>
                )}
              </>
            ) : (
              <video
                ref={playbackRef}
                controls
                className="w-full h-full object-cover"
              />
            )}

            {/* Recording indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-medium">
                  {formatDuration(recordingDuration)}
                </span>
              </div>
            )}

            {/* Max duration indicator */}
            {!recordedBlob && !isRecording && (
              <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded text-sm">
                Max: {formatDuration(maxDuration)}
              </div>
            )}
          </div>

          {/* Recording progress */}
          {isRecording && (
            <Progress
              value={(recordingDuration / maxDuration) * 100}
              className="w-full"
            />
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="w-full" />
              <p className="text-sm text-center text-muted-foreground">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-2 justify-center">
            {!recordedBlob ? (
              <>
                {!isRecording ? (
                  <>
                    <Button
                      onClick={handleStartWithCountdown}
                      disabled={isPreparing || isRecording}
                      size="lg"
                      className="flex-1"
                    >
                      <Camera className="mr-2 h-4 w-4" />
                      Start Recording
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={toggleCamera}
                      disabled={isPreparing || isRecording}
                    >
                      <RotateCw className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    size="lg"
                    className="flex-1"
                  >
                    <StopCircle className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={discardRecording}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <RotateCw className="mr-2 h-4 w-4" />
                  Re-record
                </Button>
                <Button
                  onClick={uploadRecording}
                  disabled={isUploading}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </>
            )}
          </div>

          {/* Tips */}
          {!recordedBlob && !isRecording && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm font-medium mb-1">Recording Tips:</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
                <li>Position camera to capture full body movement</li>
                <li>Ensure good lighting for best analysis results</li>
                <li>Perform 3-5 reps of the exercise</li>
                <li>Keep the camera stable during recording</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
