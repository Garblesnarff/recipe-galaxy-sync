import { WorkoutExercise } from "@/types/workout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GripVertical, Edit2, Trash2, Info, Video } from "lucide-react";
import { memo, useState } from "react";
import { ExerciseVideoDialog } from "./ExerciseVideoDialog";
import { Exercise } from "@/types/workout";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ExerciseListItemProps {
  exercise: WorkoutExercise;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
  isDraggable?: boolean;
  dragHandleProps?: any;
  video_url?: string;
  exerciseData?: Exercise;
}

const ExerciseListItem = memo(({
  exercise,
  index,
  onEdit,
  onDelete,
  isDraggable = false,
  dragHandleProps,
  video_url,
  exerciseData,
}: ExerciseListItemProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const hasVideo = video_url || exerciseData?.video_url;

  return (
    <>
      <div className="flex items-center gap-3 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
      {/* Drag handle */}
      {isDraggable && (
        <div {...dragHandleProps} className="cursor-move text-gray-400 hover:text-gray-600">
          <GripVertical className="h-5 w-5" />
        </div>
      )}

      {/* Exercise number */}
      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold text-sm">
        {index + 1}
      </div>

      {/* Exercise details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-semibold text-base">{exercise.exercise_name}</h4>
          {hasVideo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-blue-600 hover:text-blue-700"
                    onClick={() => setShowVideo(true)}
                  >
                    <Video className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Watch demonstration</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm text-gray-600">
          {exercise.sets && exercise.reps && (
            <Badge variant="outline" className="text-xs">
              {exercise.sets} × {exercise.reps} reps
            </Badge>
          )}
          {exercise.duration_seconds && (
            <Badge variant="outline" className="text-xs">
              {exercise.duration_seconds}s
            </Badge>
          )}
          {exercise.weight_kg && (
            <Badge variant="outline" className="text-xs">
              {exercise.weight_kg} kg
            </Badge>
          )}
          {exercise.rest_seconds && (
            <Badge variant="secondary" className="text-xs">
              Rest: {exercise.rest_seconds}s
            </Badge>
          )}
        </div>

        {exercise.notes && (
          <div className="mt-2 flex items-start gap-1 text-xs text-gray-500">
            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
            <p className="line-clamp-1">{exercise.notes}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="text-gray-600 hover:text-blue-600"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="text-gray-600 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>

      {/* Video Dialog */}
      {hasVideo && exerciseData && (
        <ExerciseVideoDialog
          exercise={exerciseData}
          open={showVideo}
          onClose={() => setShowVideo(false)}
        />
      )}
    </>
  );
});

ExerciseListItem.displayName = "ExerciseListItem";

export { ExerciseListItem };
