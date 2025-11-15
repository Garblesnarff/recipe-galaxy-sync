import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Exercise } from "@/types/workout";
import { Dumbbell, Target, Video, Plus, Info, Trash2 } from "lucide-react";
import { memo, useState } from "react";
import { ExerciseVideoDialog } from "./ExerciseVideoDialog";
import { getYouTubeThumbnail, extractYouTubeId } from "@/utils/youtube";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: () => void;
  showAddButton?: boolean;
  onDeleteClick?: (exercise: Exercise) => void;
}

const ExerciseCard = memo(({
  exercise,
  onSelect,
  showAddButton = false,
  onDeleteClick,
}: ExerciseCardProps) => {
  const [showVideo, setShowVideo] = useState(false);
  const videoId = exercise.video_url ? extractYouTubeId(exercise.video_url) : null;
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, 'hq') : null;

  return (
    <>
      <Card className="exercise-card group hover:shadow-md transition-shadow overflow-hidden">
        {/* Video Thumbnail Background */}
        {thumbnailUrl && (
          <div
            className="h-32 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${thumbnailUrl})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-2 right-2">
              <Badge className="bg-red-600 hover:bg-red-700">
                <Video className="h-3 w-3 mr-1" />
                Demo
              </Badge>
            </div>
          </div>
        )}

        <div className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg leading-tight mb-1">
              {exercise.name}
            </h3>
            {exercise.description && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {exercise.description}
              </p>
            )}
          </div>
          {exercise.is_custom && (
            <Badge variant="secondary" className="text-xs ml-2">
              Custom
            </Badge>
          )}
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap gap-2 mb-3">
          <Badge variant="outline" className="text-xs">
            <Dumbbell className="h-3 w-3 mr-1" />
            {exercise.category}
          </Badge>
          {exercise.difficulty && (
            <Badge variant="outline" className="text-xs">
              {exercise.difficulty}
            </Badge>
          )}
        </div>

        {/* Muscle groups */}
        {exercise.muscle_groups.length > 0 && (
          <div className="flex items-start mb-3">
            <Target className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {exercise.muscle_groups.slice(0, 3).map((muscle) => (
                <Badge key={muscle} variant="secondary" className="text-xs">
                  {muscle}
                </Badge>
              ))}
              {exercise.muscle_groups.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{exercise.muscle_groups.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Equipment */}
        {exercise.equipment.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">Equipment:</p>
            <div className="flex flex-wrap gap-1">
              {exercise.equipment.map((equip) => (
                <span key={equip} className="text-xs bg-gray-100 px-2 py-1 rounded">
                  {equip}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          {showAddButton && onSelect && (
            <Button
              onClick={onSelect}
              className="flex-1"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add to Workout
            </Button>
          )}
          {exercise.video_url && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowVideo(true)}
            >
              <Video className="h-4 w-4 mr-1" />
              Watch Demo
            </Button>
          )}
          {exercise.instructions && (
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4" />
            </Button>
          )}
          {exercise.is_custom && onDeleteClick && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDeleteClick(exercise)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>

      {/* Video Dialog */}
      <ExerciseVideoDialog
        exercise={exercise}
        open={showVideo}
        onClose={() => setShowVideo(false)}
        onAddToWorkout={onSelect}
      />
    </>
  );
});

ExerciseCard.displayName = "ExerciseCard";

export { ExerciseCard };
