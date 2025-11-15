
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Copy } from "lucide-react";
import { WorkoutTemplate } from "@/types/workout";
import { fetchWorkoutTemplates, cloneTemplate } from "@/services/workoutService";
import { WorkoutCard } from "@/components/workout/WorkoutCard";
import { WorkoutFilterBar } from "@/components/workout/WorkoutFilters";
import { useWorkoutFilters } from "@/hooks/useWorkoutFilters";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";

const WorkoutTemplates = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cloningId, setCloningId] = useState<string | null>(null);
  const { userId } = useAuthSession();
  const { filters, setFilters, sortOption, setSortOption } = useWorkoutFilters();

  useEffect(() => {
    loadTemplates();
  }, [filters, sortOption]);

  const loadTemplates = async () => {
    setIsLoading(true);
    const data = await fetchWorkoutTemplates(filters, sortOption);
    setTemplates(data);
    setIsLoading(false);
  };

  const handleCloneTemplate = async (templateId: string) => {
    if (!userId) {
      toast.error("Must be logged in to clone a template");
      return;
    }

    setCloningId(templateId);
    const newWorkoutId = await cloneTemplate(templateId, userId);
    setCloningId(null);

    if (newWorkoutId) {
      toast.success("Template cloned successfully");
      navigate(`/workouts/${newWorkoutId}`);
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
            <h1 className="text-xl font-semibold">Workout Templates</h1>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        <WorkoutFilterBar
          filters={filters}
          onFiltersChange={setFilters}
          sortOption={sortOption}
          onSortChange={setSortOption}
        />

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-medium mb-2">No Templates Found</h2>
            <p className="text-gray-600 mb-6">
              Try adjusting your filters
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div key={template.id} className="relative">
                <WorkoutCard
                  id={template.id}
                  title={template.title}
                  description={template.description}
                  image={template.image_url}
                  duration={template.duration_minutes}
                  difficulty={template.difficulty}
                  workoutType={template.workout_type}
                  isFavorite={false}
                  targetMuscleGroups={template.target_muscle_groups}
                  caloriesEstimate={template.calories_estimate}
                />
                <div className="absolute top-2 right-2">
                  <Button
                    size="sm"
                    onClick={() => handleCloneTemplate(template.id)}
                    disabled={cloningId === template.id}
                  >
                    <Copy className="mr-1 h-3 w-3" />
                    {cloningId === template.id ? "Cloning..." : "Clone"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WorkoutTemplates;
