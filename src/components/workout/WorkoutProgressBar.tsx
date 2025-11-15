import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, Dumbbell } from "lucide-react";

interface WorkoutProgressBarProps {
  totalExercises: number;
  completedExercises: number;
  currentExercise?: string;
  elapsedMinutes?: number;
}

export const WorkoutProgressBar = ({
  totalExercises,
  completedExercises,
  currentExercise,
  elapsedMinutes,
}: WorkoutProgressBarProps) => {
  const progressPercentage = totalExercises > 0
    ? (completedExercises / totalExercises) * 100
    : 0;

  const remaining = totalExercises - completedExercises;

  return (
    <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-800">Workout Progress</h3>
          </div>
          {elapsedMinutes !== undefined && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>{elapsedMinutes} min</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">
              {completedExercises} of {totalExercises} exercises completed
            </span>
            <span className="font-semibold text-blue-600">
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && remaining > 0 && (
          <div className="p-3 bg-white rounded-md border border-blue-200">
            <p className="text-xs text-gray-500 mb-1">Current Exercise:</p>
            <p className="font-semibold text-gray-800">{currentExercise}</p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 p-2 bg-green-100 rounded-md">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Completed</p>
              <p className="font-bold text-green-700">{completedExercises}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-md">
            <Circle className="h-5 w-5 text-gray-600" />
            <div>
              <p className="text-xs text-gray-600">Remaining</p>
              <p className="font-bold text-gray-700">{remaining}</p>
            </div>
          </div>
        </div>

        {/* Completion Message */}
        {completedExercises === totalExercises && totalExercises > 0 && (
          <div className="p-3 bg-green-100 border border-green-300 rounded-md text-center animate-pulse">
            <p className="text-green-800 font-bold">
              Workout Complete! Great job!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
