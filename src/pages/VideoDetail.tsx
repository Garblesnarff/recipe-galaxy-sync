import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  useVideo,
  useFormAnalysis,
  useFormProgress,
  useExerciseVideos,
  useDeleteVideo,
  useMarkVideoAsExample,
} from "@/hooks/useFormAnalysis";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VideoComparisonView } from "@/components/video/VideoComparisonView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  ArrowLeft,
  Trash2,
  BarChart3,
  GitCompare,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function VideoDetail() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();

  const [showComparison, setShowComparison] = useState(false);
  const [compareWithVideoId, setCompareWithVideoId] = useState<string>("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: video, isLoading: isLoadingVideo } = useVideo(videoId || null);
  const { analyzeVideo, isAnalyzing, latestAnalysis } = useFormAnalysis(videoId || null);
  const { progressData } = useFormProgress(userId, video?.exercise_name || null);
  const { data: exerciseVideos } = useExerciseVideos(
    userId,
    video?.exercise_name || null,
    false
  );

  const deleteVideoMutation = useDeleteVideo();
  const markAsExampleMutation = useMarkVideoAsExample();

  const handleAnalyze = () => {
    if (videoId && video) {
      analyzeVideo({ videoId, exerciseName: video.exercise_name });
    }
  };

  const handleDelete = () => {
    if (videoId) {
      deleteVideoMutation.mutate(videoId, {
        onSuccess: () => {
          navigate("/form-checker");
        },
      });
    }
  };

  const handleTogglePublic = () => {
    if (videoId && video) {
      markAsExampleMutation.mutate({
        videoId,
        isExample: !video.is_public,
      });
    }
  };

  const canMarkAsPublic = latestAnalysis && latestAnalysis.overall_score >= 80;

  // Prepare comparison options (other videos of same exercise)
  const comparisonOptions =
    exerciseVideos?.filter((v) => v.id !== videoId).slice(0, 5) || [];

  // Prepare chart data
  const chartData = progressData?.map((point) => ({
    date: new Date(point.date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: point.score,
  }));

  if (isLoadingVideo) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading video...</p>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">Video not found</p>
          <Button onClick={() => navigate("/form-checker")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Form Checker
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate("/form-checker")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Form Checker
        </Button>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold">{video.exercise_name}</h1>
            <p className="text-muted-foreground">
              Recorded on {new Date(video.recorded_at).toLocaleDateString()} at{" "}
              {new Date(video.recorded_at).toLocaleTimeString()}
            </p>
          </div>

          <div className="flex gap-2">
            {/* Toggle Public */}
            {canMarkAsPublic && (
              <Button
                variant="outline"
                onClick={handleTogglePublic}
                disabled={markAsExampleMutation.isPending}
              >
                {video.is_public ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Make Private
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Make Public
                  </>
                )}
              </Button>
            )}

            {/* Delete */}
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Video and Analysis (2 columns) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Player */}
          {!showComparison ? (
            <VideoPlayer
              videoId={videoId!}
              showControls={true}
              showFormFeedback={true}
              autoplay={false}
            />
          ) : compareWithVideoId ? (
            <VideoComparisonView
              videoId1={compareWithVideoId}
              videoId2={videoId!}
              video1Label="Previous"
              video2Label="Current"
            />
          ) : null}

          {/* Analysis Actions */}
          {!latestAnalysis && (
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <h3 className="font-semibold mb-2">No Analysis Yet</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Get AI-powered feedback on your form
                  </p>
                  <Button onClick={handleAnalyze} disabled={isAnalyzing} size="lg">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {isAnalyzing ? "Analyzing..." : "Analyze Form"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {latestAnalysis && (
            <Button
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              variant="outline"
              className="w-full"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isAnalyzing ? "Analyzing..." : "Re-analyze Form"}
            </Button>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Video Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Video Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-medium">
                  {Math.floor(video.duration_seconds / 60)}:
                  {(video.duration_seconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {video.is_public ? "Public" : "Private"}
                </span>
              </div>
              {video.workout_log_id && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From Workout:</span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0"
                    onClick={() => navigate(`/workouts/history`)}
                  >
                    View Workout
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Compare with Previous */}
          {comparisonOptions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <GitCompare className="h-4 w-4" />
                  Compare with Previous
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select
                  value={compareWithVideoId}
                  onValueChange={setCompareWithVideoId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select video" />
                  </SelectTrigger>
                  <SelectContent>
                    {comparisonOptions.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {new Date(v.recorded_at).toLocaleDateString()}
                        {v.analysis?.find((a) => a.analysis_type === "ai_generated") && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Score:{" "}
                            {
                              v.analysis.find((a) => a.analysis_type === "ai_generated")
                                ?.overall_score
                            }
                            )
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!compareWithVideoId}
                  onClick={() => setShowComparison(!showComparison)}
                >
                  {showComparison ? "Hide Comparison" : "Show Comparison"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Progress Chart */}
          {chartData && chartData.length > 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Progress Over Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis domain={[0, 100]} fontSize={12} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
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
              onClick={handleDelete}
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
