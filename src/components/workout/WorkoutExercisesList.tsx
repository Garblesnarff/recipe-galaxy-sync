import { WorkoutExercise } from "@/types/workout";
import { ExerciseListItem } from "./ExerciseListItem";
import { Button } from "@/components/ui/button";
import { Plus, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface WorkoutExercisesListProps {
  exercises: WorkoutExercise[];
  onEdit?: (exercise: WorkoutExercise, index: number) => void;
  onDelete?: (index: number) => void;
  onAdd?: () => void;
  isDraggable?: boolean;
  showAddButton?: boolean;
}

export const WorkoutExercisesList = ({
  exercises,
  onEdit,
  onDelete,
  onAdd,
  isDraggable = false,
  showAddButton = true,
}: WorkoutExercisesListProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Exercises</h3>
        {showAddButton && onAdd && (
          <Button onClick={onAdd} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Exercise
          </Button>
        )}
      </div>

      {exercises.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No exercises added yet. Click "Add Exercise" to get started.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {exercises.map((exercise, index) => (
            <ExerciseListItem
              key={exercise.id || index}
              exercise={exercise}
              index={index}
              onEdit={onEdit ? () => onEdit(exercise, index) : undefined}
              onDelete={onDelete ? () => onDelete(index) : undefined}
              isDraggable={isDraggable}
            />
          ))}
        </div>
      )}
    </div>
  );
};
