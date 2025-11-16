import { useEffect, useRef, useState } from "react";
import { useVideoComparison } from "@/hooks/useFormAnalysis";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Play, Pause, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { getVideoUrl } from "@/lib/videoStorage";

interface VideoComparisonViewProps {
  videoId1: string;
  videoId2: string;
  video1Label?: string;
  video2Label?: string;
}

export function VideoComparisonView({
  videoId1,
  videoId2,
  video1Label = "Previous",
  video2Label = "Current",
}: VideoComparisonViewProps) {
  const videoRef1 = useRef<HTMLVideoElement>(null);
  const videoRef2 = useRef<HTMLVideoElement>(null);
  const [videoUrl1, setVideoUrl1] = useState<string | null>(null);
  const [videoUrl2, setVideoUrl2] = useState<string | null>(null);
  const [isSynced, setIsSynced] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const { data: comparison, isLoading } = useVideoComparison(videoId1, videoId2);

  // Load video URLs
  useEffect(() => {
    if (comparison) {
      getVideoUrl(comparison.video1.video_url)
        .then(setVideoUrl1)
        .catch(console.error);
      getVideoUrl(comparison.video2.video_url)
        .then(setVideoUrl2)
        .catch(console.error);
    }
  }, [comparison]);

  // Synchronized playback
  const togglePlayPause = () => {
    const video1 = videoRef1.current;
    const video2 = videoRef2.current;

    if (!video1 || !video2) return;

    if (isPlaying) {
      video1.pause();
      video2.pause();
    } else {
      video1.play();
      video2.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Sync time when seeking
  const handleTimeUpdate = (sourceVideo: HTMLVideoElement, targetVideo: HTMLVideoElement) => {
    if (isSynced && Math.abs(sourceVideo.currentTime - targetVideo.currentTime) > 0.3) {
      targetVideo.currentTime = sourceVideo.currentTime;
    }
  };

  useEffect(() => {
    const video1 = videoRef1.current;
    const video2 = videoRef2.current;

    if (!video1 || !video2 || !isSynced) return;

    const sync1to2 = () => handleTimeUpdate(video1, video2);
    const sync2to1 = () => handleTimeUpdate(video2, video1);

    video1.addEventListener("timeupdate", sync1to2);
    video2.addEventListener("timeupdate", sync2to1);

    return () => {
      video1.removeEventListener("timeupdate", sync1to2);
      video2.removeEventListener("timeupdate", sync2to1);
    };
  }, [isSynced]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Loading comparison...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!comparison) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Unable to load comparison</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const scoreChange = comparison.scoreChange;
  const hasImproved = scoreChange > 0;
  const hasDeclined = scoreChange < 0;

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Form Comparison</span>
            <div className="flex items-center gap-2">
              {hasImproved && (
                <Badge className="bg-green-600">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +{scoreChange} points
                </Badge>
              )}
              {hasDeclined && (
                <Badge variant="destructive">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {scoreChange} points
                </Badge>
              )}
              {!hasImproved && !hasDeclined && (
                <Badge variant="secondary">
                  <Minus className="h-3 w-3 mr-1" />
                  No change
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Side-by-side videos */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Video 1 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{video1Label}</span>
              {comparison.analysis1 && (
                <Badge variant="secondary">
                  Score: {comparison.analysis1.overall_score}
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(comparison.video1.recorded_at).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <video
              ref={videoRef1}
              src={videoUrl1 || ""}
              className="w-full aspect-video object-cover bg-black"
              playsInline
            />
          </CardContent>
        </Card>

        {/* Video 2 */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>{video2Label}</span>
              {comparison.analysis2 && (
                <Badge
                  className={
                    hasImproved
                      ? "bg-green-600"
                      : hasDeclined
                      ? "bg-red-600"
                      : ""
                  }
                >
                  Score: {comparison.analysis2.overall_score}
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              {new Date(comparison.video2.recorded_at).toLocaleDateString()}
            </p>
          </CardHeader>
          <CardContent className="p-0">
            <video
              ref={videoRef2}
              src={videoUrl2 || ""}
              className="w-full aspect-video object-cover bg-black"
              playsInline
            />
          </CardContent>
        </Card>
      </div>

      {/* Playback controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-center gap-4">
            <Button onClick={togglePlayPause} size="lg">
              {isPlaying ? (
                <Pause className="h-5 w-5 mr-2" />
              ) : (
                <Play className="h-5 w-5 mr-2" />
              )}
              {isPlaying ? "Pause Both" : "Play Both"}
            </Button>
            <Button
              variant={isSynced ? "default" : "outline"}
              onClick={() => setIsSynced(!isSynced)}
            >
              {isSynced ? "Synced" : "Independent"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Improvements */}
      {comparison.improvements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Improvements Detected</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {comparison.improvements.map((improvement, index) => (
                <li
                  key={index}
                  className="text-sm flex items-start gap-2"
                >
                  <TrendingUp className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Analysis comparison */}
      {comparison.analysis1 && comparison.analysis2 && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Previous issues */}
          {comparison.analysis1.issues_detected?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Previous Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {comparison.analysis1.issues_detected.map((issue, index) => {
                    const isResolved =
                      !comparison.analysis2.issues_detected?.includes(issue);
                    return (
                      <li
                        key={index}
                        className={`text-sm flex items-start gap-2 ${
                          isResolved ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        <span className="mt-0.5">•</span>
                        <span>{issue}</span>
                        {isResolved && (
                          <Badge variant="outline" className="ml-auto">
                            Resolved
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Current issues */}
          {comparison.analysis2.issues_detected?.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {comparison.analysis2.issues_detected.map((issue, index) => {
                    const isNew =
                      !comparison.analysis1.issues_detected?.includes(issue);
                    return (
                      <li
                        key={index}
                        className="text-sm flex items-start gap-2"
                      >
                        <span className="mt-0.5">•</span>
                        <span>{issue}</span>
                        {isNew && (
                          <Badge variant="outline" className="ml-auto">
                            New
                          </Badge>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
