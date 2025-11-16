import { useEffect, useRef, useState } from "react";
import { useVideo, useFormAnalysis } from "@/hooks/useFormAnalysis";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormFeedbackCard } from "./FormFeedbackCard";
import { Play, Pause, SkipBack, SkipForward, Repeat } from "lucide-react";
import { getVideoUrl } from "@/lib/videoStorage";

interface VideoPlayerProps {
  videoId: string;
  showControls?: boolean;
  showFormFeedback?: boolean;
  autoplay?: boolean;
}

export function VideoPlayer({
  videoId,
  showControls = true,
  showFormFeedback = true,
  autoplay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isLooping, setIsLooping] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const { data: video, isLoading: isLoadingVideo } = useVideo(videoId);
  const { latestAnalysis, isLoadingLatest } = useFormAnalysis(videoId);

  // Load video URL
  useEffect(() => {
    if (video?.video_url) {
      getVideoUrl(video.video_url).then(setVideoUrl).catch(console.error);
    }
  }, [video]);

  // Handle video events
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleTimeUpdate = () => setCurrentTime(videoElement.currentTime);
    const handleLoadedMetadata = () => setDuration(videoElement.duration);

    videoElement.addEventListener("play", handlePlay);
    videoElement.addEventListener("pause", handlePause);
    videoElement.addEventListener("timeupdate", handleTimeUpdate);
    videoElement.addEventListener("loadedmetadata", handleLoadedMetadata);

    return () => {
      videoElement.removeEventListener("play", handlePlay);
      videoElement.removeEventListener("pause", handlePause);
      videoElement.removeEventListener("timeupdate", handleTimeUpdate);
      videoElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
    };
  }, []);

  // Update playback speed
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed]);

  // Update loop
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.loop = isLooping;
    }
  }, [isLooping]);

  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const skipBackward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 0.1);
    }
  };

  const skipForward = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.min(
        duration,
        videoRef.current.currentTime + 0.1
      );
    }
  };

  const toggleLoop = () => {
    setIsLooping(!isLooping);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoadingVideo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading video...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!video || !videoUrl) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Video not found</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-0">
          {/* Video */}
          <div className="relative bg-black">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video object-contain"
              autoPlay={autoplay}
              playsInline
            />

            {/* Form feedback overlay (optional) */}
            {showFormFeedback && latestAnalysis && (
              <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-2 rounded-lg">
                <div className="text-xs font-medium">Form Score</div>
                <div className={`text-2xl font-bold ${
                  latestAnalysis.overall_score >= 80
                    ? "text-green-400"
                    : latestAnalysis.overall_score >= 60
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}>
                  {latestAnalysis.overall_score}
                </div>
              </div>
            )}
          </div>

          {/* Custom Controls */}
          {showControls && (
            <div className="p-4 space-y-3 bg-muted">
              {/* Progress bar */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={(e) => {
                    if (videoRef.current) {
                      videoRef.current.currentTime = parseFloat(e.target.value);
                    }
                  }}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-muted-foreground min-w-[40px]">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipBackward}
                    title="Frame backward (0.1s)"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={togglePlayPause}
                  >
                    {isPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={skipForward}
                    title="Frame forward (0.1s)"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>

                  <Button
                    variant={isLooping ? "default" : "outline"}
                    size="sm"
                    onClick={toggleLoop}
                    title="Toggle loop"
                  >
                    <Repeat className="h-4 w-4" />
                  </Button>
                </div>

                {/* Playback speed */}
                <Select
                  value={playbackSpeed.toString()}
                  onValueChange={(value) => setPlaybackSpeed(parseFloat(value))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.25">0.25x</SelectItem>
                    <SelectItem value="0.5">0.5x</SelectItem>
                    <SelectItem value="0.75">0.75x</SelectItem>
                    <SelectItem value="1">1x</SelectItem>
                    <SelectItem value="1.25">1.25x</SelectItem>
                    <SelectItem value="1.5">1.5x</SelectItem>
                    <SelectItem value="2">2x</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Feedback */}
      {showFormFeedback && latestAnalysis && (
        <FormFeedbackCard
          analysis={latestAnalysis}
          videoId={videoId}
          exerciseName={video.exercise_name}
        />
      )}
    </div>
  );
}
