
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Exercise } from "@/types/workout";
import { fetchExercises, createExercise, deleteExercise } from "@/services/exerciseService";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { ExerciseForm } from "@/components/workout/ExerciseForm";
import { ExerciseFilterBar } from "@/components/workout/ExerciseFilters";
import { useExerciseFilters } from "@/hooks/useExerciseFilters";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";

const ExerciseLibrary = () => {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const { userId } = useAuthSession();
  const { filters, setFilters } = useExerciseFilters();

  useEffect(() => {
    loadExercises();
  }, [filters]);

  const loadExercises = async () => {
    setIsLoading(true);
    const data = await fetchExercises(filters);
    setExercises(data);
    setIsLoading(false);
  };

  const handleCreateExercise = async (data: Partial<Exercise>) => {
    if (!userId) {
      toast.error("Must be logged in to create an exercise");
      return;
    }
    setIsSubmitting(true);
    const newExerciseId = await createExercise(data, userId);
    setIsSubmitting(false);

    if (newExerciseId) {
      setIsCreateDialogOpen(false);
      await loadExercises();
    }
  };

  const handleDeleteClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedExercise) return;

    const success = await deleteExercise(selectedExercise.id);
    setIsDeleteDialogOpen(false);

    if (success) {
      await loadExercises();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/workouts")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Exercise Library</h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> Custom Exercise
          </Button>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <ExerciseFilterBar
          filters={filters}
          onFiltersChange={setFilters}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : exercises.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-medium mb-2">No Exercises Found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters or create a custom exercise
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create Custom Exercise
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exercises.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Exercise Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Custom Exercise</DialogTitle>
          </DialogHeader>
          <ExerciseForm
            onSubmit={handleCreateExercise}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Exercise</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedExercise?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ExerciseLibrary;
