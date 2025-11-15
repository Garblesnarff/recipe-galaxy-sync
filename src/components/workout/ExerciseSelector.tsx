import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExerciseCard } from "./ExerciseCard";
import { ExerciseFilterBar } from "./ExerciseFilters";
import { Exercise, ExerciseFilters } from "@/types/workout";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface ExerciseSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (exercise: Exercise) => void;
  exercises?: Exercise[];
  isLoading?: boolean;
}

export const ExerciseSelector = ({
  open,
  onOpenChange,
  onSelect,
  exercises = [],
  isLoading = false,
}: ExerciseSelectorProps) => {
  const [filters, setFilters] = useState<ExerciseFilters>({
    searchQuery: "",
    categories: [],
    muscle_groups: [],
    equipment: [],
    difficulty: null,
    custom_only: false
  });

  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>(exercises);

  useEffect(() => {
    let filtered = exercises;

    // Search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      filtered = filtered.filter(ex =>
        ex.name.toLowerCase().includes(query) ||
        ex.description?.toLowerCase().includes(query)
      );
    }

    // Categories
    if (filters.categories.length > 0) {
      filtered = filtered.filter(ex =>
        filters.categories.includes(ex.category)
      );
    }

    // Muscle groups
    if (filters.muscle_groups.length > 0) {
      filtered = filtered.filter(ex =>
        ex.muscle_groups.some(muscle => filters.muscle_groups.includes(muscle))
      );
    }

    // Equipment
    if (filters.equipment.length > 0) {
      filtered = filtered.filter(ex =>
        ex.equipment.some(equip => filters.equipment.includes(equip))
      );
    }

    // Difficulty
    if (filters.difficulty) {
      filtered = filtered.filter(ex => ex.difficulty === filters.difficulty);
    }

    // Custom only
    if (filters.custom_only) {
      filtered = filtered.filter(ex => ex.is_custom);
    }

    setFilteredExercises(filtered);
  }, [filters, exercises]);

  const handleSelect = (exercise: Exercise) => {
    onSelect(exercise);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Select Exercise</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ExerciseFilterBar filters={filters} onFiltersChange={setFilters} />

          <ScrollArea className="h-[calc(90vh-200px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : filteredExercises.length === 0 ? (
              <Alert>
                <AlertDescription>
                  No exercises found. Try adjusting your filters or search query.
                </AlertDescription>
              </Alert>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    onSelect={() => handleSelect(exercise)}
                    showAddButton={true}
                  />
                ))}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
