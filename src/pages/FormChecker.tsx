import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRecentVideos, usePublicVideos } from "@/hooks/useFormAnalysis";
import { VideoRecorder } from "@/components/video/VideoRecorder";
import { VideoGallery } from "@/components/video/VideoGallery";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, Video, Award, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Common exercises for quick selection
const COMMON_EXERCISES = [
  "Squats",
  "Deadlift",
  "Bench Press",
  "Push-ups",
  "Pull-ups",
  "Lunges",
  "Plank",
  "Shoulder Press",
  "Dumbbell Rows",
  "Burpees",
];

export default function FormChecker() {
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [showRecorder, setShowRecorder] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<string>("");

  const { data: recentVideos, isLoading: isLoadingRecent } = useRecentVideos(userId, 12);
  const { data: publicVideos, isLoading: isLoadingPublic } = usePublicVideos(
    undefined,
    80
  );

  const handleRecordClick = () => {
    if (!selectedExercise) {
      return;
    }
    setShowRecorder(true);
  };

  const handleVideoRecorded = (videoId: string) => {
    setShowRecorder(false);
    setSelectedExercise("");
    // Navigate to video detail page
    navigate(`/form-checker/video/${videoId}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Form Check</h1>
        <p className="text-muted-foreground">
          Record your exercises and get AI-powered form analysis
        </p>
      </div>

      {/* Record New Video Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Record New Form Check
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Select value={selectedExercise} onValueChange={setSelectedExercise}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an exercise" />
                </SelectTrigger>
                <SelectContent>
                  {COMMON_EXERCISES.map((exercise) => (
                    <SelectItem key={exercise} value={exercise}>
                      {exercise}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleRecordClick}
              disabled={!selectedExercise}
              size="lg"
            >
              <Camera className="mr-2 h-4 w-4" />
              Start Recording
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">
            Select an exercise and record yourself performing it. Our AI will analyze
            your form and provide personalized feedback.
          </p>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Videos</p>
                <p className="text-2xl font-bold">{recentVideos?.length || 0}</p>
              </div>
              <Video className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Score</p>
                <p className="text-2xl font-bold">
                  {recentVideos && recentVideos.length > 0
                    ? Math.round(
                        recentVideos.reduce((sum, v) => {
                          const score =
                            v.analysis?.find((a) => a.analysis_type === "ai_generated")
                              ?.overall_score || 0;
                          return sum + score;
                        }, 0) / recentVideos.length
                      )
                    : 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Best Score</p>
                <p className="text-2xl font-bold">
                  {recentVideos && recentVideos.length > 0
                    ? Math.max(
                        ...recentVideos.map(
                          (v) =>
                            v.analysis?.find(
                              (a) => a.analysis_type === "ai_generated"
                            )?.overall_score || 0
                        )
                      )
                    : 0}
                </p>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Videos */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-4">Your Recent Videos</h2>
        <VideoGallery
          videos={recentVideos || []}
          isLoading={isLoadingRecent}
          showExerciseFilter={true}
          showDeleteButton={true}
        />
      </div>

      {/* Example Videos */}
      {publicVideos && publicVideos.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Example Videos (Good Form)</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Watch these high-scoring examples to learn proper form
          </p>
          <VideoGallery
            videos={publicVideos}
            isLoading={isLoadingPublic}
            showExerciseFilter={true}
            showDeleteButton={false}
          />
        </div>
      )}

      {/* Video Recorder Dialog */}
      <Dialog open={showRecorder} onOpenChange={setShowRecorder}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Record Form Check</DialogTitle>
          </DialogHeader>
          <VideoRecorder
            exerciseName={selectedExercise}
            userId={userId}
            onVideoRecorded={handleVideoRecorded}
            onClose={() => setShowRecorder(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
