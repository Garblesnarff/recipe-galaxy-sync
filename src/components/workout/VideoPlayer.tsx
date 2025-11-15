import { useState } from "react";
import { YouTubeEmbed } from "./YouTubeEmbed";
import { extractYouTubeId } from "@/utils/youtube";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle } from "lucide-react";

interface VideoPlayerProps {
  videoUrl: string;
  title: string;
  className?: string;
}

export const VideoPlayer = ({
  videoUrl,
  title,
  className = "",
}: VideoPlayerProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Extract video ID from URL
  const videoId = extractYouTubeId(videoUrl);

  // Handle load completion
  const handleLoad = () => {
    setIsLoading(false);
  };

  // Handle load error
  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  // Show error state if invalid URL
  if (!videoId) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <AlertCircle className="h-12 w-12 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 text-center">
          Invalid YouTube URL. Please provide a valid video link.
        </p>
      </div>
    );
  }

  // Show error state if failed to load
  if (hasError) {
    return (
      <div className={`flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 ${className}`}>
        <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
        <p className="text-sm text-gray-600 text-center">
          Failed to load video. Please try again later.
        </p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full rounded-lg" />
        </div>
      )}
      <div
        className="rounded-lg overflow-hidden bg-black"
        onLoad={handleLoad}
        onError={handleError}
      >
        <YouTubeEmbed videoId={videoId} title={title} />
      </div>
    </div>
  );
};
