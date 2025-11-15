import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Exercise } from "@/types/workout";
import { Dumbbell, Target, Video, Plus, Info } from "lucide-react";
import { memo } from "react";

interface ExerciseCardProps {
  exercise: Exercise;
  onSelect?: () => void;
  showAddButton?: boolean;
}

const ExerciseCard = memo(({
  exercise,
  onSelect,
  showAddButton = false,
}: ExerciseCardProps) => {
  return (
    <Card className="exercise-card group hover:shadow-md transition-shadow">
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
              onClick={() => window.open(exercise.video_url, '_blank')}
            >
              <Video className="h-4 w-4" />
            </Button>
          )}
          {exercise.instructions && (
            <Button variant="outline" size="sm">
              <Info className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

ExerciseCard.displayName = "ExerciseCard";

export { ExerciseCard };
