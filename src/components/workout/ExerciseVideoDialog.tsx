import { Exercise } from "@/types/workout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { VideoPlayer } from "./VideoPlayer";
import { Plus, X, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExerciseVideoDialogProps {
  exercise: Exercise;
  open: boolean;
  onClose: () => void;
  onAddToWorkout?: () => void;
}

export const ExerciseVideoDialog = ({
  exercise,
  open,
  onClose,
  onAddToWorkout,
}: ExerciseVideoDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1 pr-4">
              <DialogTitle className="text-2xl font-bold mb-2">
                {exercise.name}
              </DialogTitle>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="text-xs">
                  {exercise.category}
                </Badge>
                {exercise.difficulty && (
                  <Badge variant="secondary" className="text-xs">
                    {exercise.difficulty}
                  </Badge>
                )}
                {exercise.is_custom && (
                  <Badge className="text-xs bg-blue-500">
                    Custom
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-180px)]">
          <div className="px-6 pb-6 space-y-6">
            {/* Video Player */}
            {exercise.video_url && (
              <div className="w-full">
                <VideoPlayer
                  videoUrl={exercise.video_url}
                  title={exercise.name}
                />
              </div>
            )}

            {/* Exercise Description */}
            {exercise.description && (
              <div>
                <h3 className="font-semibold text-lg mb-2 flex items-center">
                  <Info className="h-5 w-5 mr-2 text-blue-500" />
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {exercise.description}
                </p>
              </div>
            )}

            {/* Exercise Instructions */}
            {exercise.instructions && (
              <div>
                <h3 className="font-semibold text-lg mb-3">Instructions</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {exercise.instructions}
                  </p>
                </div>
              </div>
            )}

            {/* Muscle Groups */}
            {exercise.muscle_groups.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                  Target Muscles
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.muscle_groups.map((muscle) => (
                    <Badge key={muscle} variant="secondary">
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment */}
            {exercise.equipment.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm text-gray-500 uppercase mb-2">
                  Equipment Needed
                </h3>
                <div className="flex flex-wrap gap-2">
                  {exercise.equipment.map((equip) => (
                    <span
                      key={equip}
                      className="text-sm bg-gray-100 px-3 py-1 rounded-full"
                    >
                      {equip}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer with Add to Workout Button */}
        {onAddToWorkout && (
          <div className="px-6 py-4 border-t bg-gray-50">
            <Button
              onClick={() => {
                onAddToWorkout();
                onClose();
              }}
              className="w-full"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add to Workout
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
