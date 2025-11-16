
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, SkipForward, CheckCircle, ChevronDown, ChevronUp, Camera } from "lucide-react";
import { useActiveWorkout } from "@/hooks/useActiveWorkout";
import { ActiveExerciseCard } from "@/components/workout/ActiveExerciseCard";
import { WorkoutTimer } from "@/components/workout/WorkoutTimer";
import { WorkoutProgressBar } from "@/components/workout/WorkoutProgressBar";
import { CompleteWorkoutDialog } from "@/components/workout/CompleteWorkoutDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { VideoPlayer } from "@/components/workout/VideoPlayer";
import { VideoRecorder } from "@/components/video/VideoRecorder";
import { Exercise } from "@/types/workout";
import { Card } from "@/components/ui/card";
import { fetchExerciseByName } from "@/services/workout";
import { useAuth } from "@/hooks/useAuth";
import { NowPlayingWidget } from "@/components/music/NowPlayingWidget";
import { useMusicPlayer } from "@/hooks/useMusicPlayer";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const ActiveWorkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { userId } = useAuth();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [showFormRecorder, setShowFormRecorder] = useState(false);
  const [currentExerciseData, setCurrentExerciseData] = useState<Exercise | null>(null);

  const {
    workout,
    isLoading,
    currentExerciseIndex,
    isResting,
    timerSeconds,
    isTimerRunning,
    exerciseLogs,
    totalElapsedSeconds,
    handleStartTimer,
    handlePauseTimer,
    handleNextExercise,
    handleLogSet,
    handleCompleteWorkout,
    progress,
  } = useActiveWorkout(id || '');

  // Music integration
  const { pausePlayback, stopPlayback } = useMusicPlayer({
    workoutId: id,
    autoPlay: true,
  });

  const currentExercise = workout?.exercises?.[currentExerciseIndex];

  // Fetch exercise data when current exercise changes
  useEffect(() => {
    const loadExerciseData = async () => {
      if (currentExercise?.exercise_name) {
        const exerciseData = await fetchExerciseByName(currentExercise.exercise_name);
        setCurrentExerciseData(exerciseData);
        // Reset video player to collapsed state when exercise changes
        setShowVideoPlayer(false);
      }
    };

    loadExerciseData();
  }, [currentExercise?.exercise_name]);

  if (isLoading || !workout) {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-8">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const handleExit = () => {
    setShowExitDialog(true);
  };

  const confirmExit = () => {
    navigate(`/workouts/${id}`);
  };

  const handleFinish = () => {
    setShowCompleteDialog(true);
  };

  const handleCompleteAndSave = async (notes: string, caloriesBurned?: number) => {
    // Stop music when workout completes
    stopPlayback();
    await handleCompleteWorkout(notes, caloriesBurned);
    setShowCompleteDialog(false);
    navigate('/workouts/history');
  };

  // Pause music when workout is paused
  useEffect(() => {
    if (!isTimerRunning && timerSeconds > 0) {
      pausePlayback();
    }
  }, [isTimerRunning]);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={handleExit}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold">{workout.title}</h1>
              <p className="text-sm text-gray-500">
                {Math.floor(totalElapsedSeconds / 60)}:{(totalElapsedSeconds % 60).toString().padStart(2, '0')} elapsed
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-6 space-y-6">
        {/* Music Player Widget */}
        <NowPlayingWidget />

        {/* Progress Bar */}
        <WorkoutProgressBar
          current={currentExerciseIndex + 1}
          total={workout.exercises?.length || 0}
          progress={progress}
        />

        {/* Timer */}
        <WorkoutTimer
          seconds={timerSeconds}
          isRunning={isTimerRunning}
          isResting={isResting}
        />

        {/* Video Player Section */}
        {currentExerciseData?.video_url && (
          <Card className="p-4">
            <Button
              variant="ghost"
              className="w-full flex items-center justify-between mb-2"
              onClick={() => setShowVideoPlayer(!showVideoPlayer)}
            >
              <span className="font-medium">Watch Form Demonstration</span>
              {showVideoPlayer ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>
            {showVideoPlayer && (
              <div className="mt-2">
                <VideoPlayer
                  videoUrl={currentExerciseData.video_url}
                  title={currentExercise?.exercise_name || "Exercise demonstration"}
                  className="w-full"
                />
              </div>
            )}
          </Card>
        )}

        {/* Current Exercise */}
        {currentExercise && (
          <>
            <ActiveExerciseCard
              exercise={currentExercise}
              exerciseLog={exerciseLogs[currentExercise.id]}
              onLogSet={handleLogSet}
              isResting={isResting}
            />

            {/* Record Form Button */}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowFormRecorder(true)}
            >
              <Camera className="mr-2 h-4 w-4" />
              Record Form Check
            </Button>
          </>
        )}

        {/* Controls */}
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            onClick={isTimerRunning ? handlePauseTimer : handleStartTimer}
          >
            {isTimerRunning ? (
              <>
                <Pause className="mr-2 h-5 w-5" />
                Pause
              </>
            ) : (
              <>
                <Play className="mr-2 h-5 w-5" />
                Start
              </>
            )}
          </Button>

          {currentExerciseIndex < (workout.exercises?.length || 0) - 1 ? (
            <Button
              variant="outline"
              size="lg"
              onClick={handleNextExercise}
            >
              <SkipForward className="mr-2 h-5 w-5" />
              Next Exercise
            </Button>
          ) : (
            <Button
              size="lg"
              onClick={handleFinish}
            >
              <CheckCircle className="mr-2 h-5 w-5" />
              Finish Workout
            </Button>
          )}
        </div>

        {/* Exercise List */}
        <div className="space-y-2">
          <h2 className="text-lg font-semibold">Exercises</h2>
          <div className="space-y-2">
            {workout.exercises?.map((exercise, index) => (
              <div
                key={exercise.id}
                className={`p-3 rounded-lg border ${
                  index === currentExerciseIndex
                    ? 'border-primary bg-primary/5'
                    : index < currentExerciseIndex
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{exercise.exercise_name}</p>
                    <p className="text-sm text-gray-500">
                      {exercise.sets} sets × {exercise.reps} reps
                      {exercise.weight_kg && ` @ ${exercise.weight_kg}kg`}
                    </p>
                  </div>
                  {index < currentExerciseIndex && (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Exit Confirmation Dialog */}
      <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exit Workout?</AlertDialogTitle>
            <AlertDialogDescription>
              Your progress will not be saved. Are you sure you want to exit?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Workout</AlertDialogCancel>
            <AlertDialogAction onClick={confirmExit} className="bg-red-500 hover:bg-red-600">
              Exit Without Saving
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Workout Dialog */}
      <CompleteWorkoutDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
        onComplete={handleCompleteAndSave}
        duration={Math.floor(totalElapsedSeconds / 60)}
        estimatedCalories={workout.calories_estimate}
      />

      {/* Form Recorder Dialog */}
      {currentExercise && (
        <Dialog open={showFormRecorder} onOpenChange={setShowFormRecorder}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Record Form Check - {currentExercise.exercise_name}</DialogTitle>
            </DialogHeader>
            <VideoRecorder
              exerciseName={currentExercise.exercise_name}
              userId={userId}
              workoutLogId={null}
              onVideoRecorded={(videoId) => {
                setShowFormRecorder(false);
                // Optionally navigate to video detail
                // navigate(`/form-checker/video/${videoId}`);
              }}
              onClose={() => setShowFormRecorder(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default ActiveWorkout;
