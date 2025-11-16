import { useState } from "react";
import { VideoWithAnalysis } from "@/types/video";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Play, Trash2, Calendar, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDeleteVideo } from "@/hooks/useFormAnalysis";
import { getVideoUrl } from "@/lib/videoStorage";

interface VideoGalleryProps {
  videos: VideoWithAnalysis[];
  isLoading?: boolean;
  onVideoClick?: (videoId: string) => void;
  showExerciseFilter?: boolean;
  showDeleteButton?: boolean;
}

type SortOption = "date-desc" | "date-asc" | "score-desc" | "score-asc";

export function VideoGallery({
  videos,
  isLoading = false,
  onVideoClick,
  showExerciseFilter = true,
  showDeleteButton = true,
}: VideoGalleryProps) {
  const navigate = useNavigate();
  const deleteVideoMutation = useDeleteVideo();

  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterExercise, setFilterExercise] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  // Get unique exercises for filter
  const exercises = Array.from(new Set(videos.map((v) => v.exercise_name))).sort();

  // Filter videos
  const filteredVideos = videos.filter((video) => {
    if (filterExercise === "all") return true;
    return video.exercise_name === filterExercise;
  });

  // Sort videos
  const sortedVideos = [...filteredVideos].sort((a, b) => {
    switch (sortBy) {
      case "date-desc":
        return new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime();
      case "date-asc":
        return new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime();
      case "score-desc": {
        const scoreA = getLatestScore(a);
        const scoreB = getLatestScore(b);
        return scoreB - scoreA;
      }
      case "score-asc": {
        const scoreA = getLatestScore(a);
        const scoreB = getLatestScore(b);
        return scoreA - scoreB;
      }
      default:
        return 0;
    }
  });

  // Get latest AI analysis score
  const getLatestScore = (video: VideoWithAnalysis): number => {
    const aiAnalysis = video.analysis?.find((a) => a.analysis_type === "ai_generated");
    return aiAnalysis?.overall_score || 0;
  };

  const handleVideoClick = (videoId: string) => {
    if (onVideoClick) {
      onVideoClick(videoId);
    } else {
      navigate(`/form-checker/video/${videoId}`);
    }
  };

  const handleDeleteClick = (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (videoToDelete) {
      deleteVideoMutation.mutate(videoToDelete);
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="aspect-video bg-muted" />
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">No videos yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Record your first form check to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and sorting */}
      <div className="flex flex-wrap gap-2">
        {showExerciseFilter && exercises.length > 1 && (
          <Select value={filterExercise} onValueChange={setFilterExercise}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Exercises" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exercises</SelectItem>
              {exercises.map((exercise) => (
                <SelectItem key={exercise} value={exercise}>
                  {exercise}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Newest First</SelectItem>
            <SelectItem value="date-asc">Oldest First</SelectItem>
            <SelectItem value="score-desc">Highest Score</SelectItem>
            <SelectItem value="score-asc">Lowest Score</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto text-sm text-muted-foreground flex items-center">
          {sortedVideos.length} video{sortedVideos.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Video grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedVideos.map((video) => {
          const latestScore = getLatestScore(video);
          const hasAnalysis = latestScore > 0;

          return (
            <Card
              key={video.id}
              className="cursor-pointer hover:shadow-lg transition-shadow group"
              onClick={() => handleVideoClick(video.id)}
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-black overflow-hidden">
                {video.thumbnail_url ? (
                  <img
                    src={video.thumbnail_url}
                    alt={video.exercise_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Play className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Play overlay */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="bg-white rounded-full p-3">
                    <Play className="h-6 w-6 text-black" />
                  </div>
                </div>

                {/* Score badge */}
                {hasAnalysis && (
                  <div className="absolute top-2 right-2">
                    <Badge
                      className={
                        latestScore >= 80
                          ? "bg-green-600"
                          : latestScore >= 60
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }
                    >
                      {latestScore}
                    </Badge>
                  </div>
                )}

                {/* Duration */}
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {Math.floor(video.duration_seconds / 60)}:
                  {(video.duration_seconds % 60).toString().padStart(2, "0")}
                </div>
              </div>

              {/* Info */}
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm truncate">
                  {video.exercise_name}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(video.recorded_at).toLocaleDateString()}</span>
                </div>

                {hasAnalysis && (
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="h-3 w-3 text-blue-600" />
                    <span className="text-xs text-blue-600">Analyzed</span>
                  </div>
                )}

                {/* Actions */}
                {showDeleteButton && (
                  <div className="mt-3 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={(e) => handleDeleteClick(video.id, e)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Video</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this video? This action cannot be undone
              and will also delete all associated form analyses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
