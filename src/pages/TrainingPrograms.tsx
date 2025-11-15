import { useState, useEffect } from "react";
import { MainNav } from "@/components/layout/MainNav";
import { ProgramCard } from "@/components/workout/ProgramCard";
import { EnrollProgramDialog } from "@/components/workout/EnrollProgramDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import {
  getTrainingPrograms,
  getUserEnrollments,
  getProgramProgress,
  type TrainingProgram,
} from "@/services/workout/trainingPrograms";
import { supabase } from "@/integrations/supabase/client";
import { Filter, X } from "lucide-react";

const TrainingPrograms = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { data: programs, isLoading: programsLoading } = useQuery({
    queryKey: ['training-programs', selectedGoal, selectedDifficulty],
    queryFn: () => getTrainingPrograms({
      goal: selectedGoal || undefined,
      difficulty: selectedDifficulty || undefined,
    }),
  });

  const { data: enrollments } = useQuery({
    queryKey: ['user-enrollments', userId],
    queryFn: () => getUserEnrollments(userId!),
    enabled: !!userId,
  });

  // Get progress for each enrollment
  const { data: progressData } = useQuery({
    queryKey: ['all-program-progress', enrollments],
    queryFn: async () => {
      if (!enrollments || enrollments.length === 0) return {};

      const progressPromises = enrollments.map(async (enrollment) => {
        const progress = await getProgramProgress(enrollment.id);
        return { [enrollment.program_id]: progress.percentage };
      });

      const results = await Promise.all(progressPromises);
      return Object.assign({}, ...results);
    },
    enabled: !!enrollments && enrollments.length > 0,
  });

  const handleEnrollClick = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setEnrollDialogOpen(true);
  };

  const isEnrolled = (programId: string) => {
    return enrollments?.some((e) => e.program_id === programId && !e.completed);
  };

  const getProgress = (programId: string) => {
    return progressData?.[programId] || 0;
  };

  const GOALS = ['strength', 'endurance', 'weight_loss', 'muscle_gain'];
  const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

  if (programsLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-96 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Training Programs</h1>
            <p className="text-gray-600 mt-2">
              Structured multi-week programs to help you achieve your fitness goals
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <h3 className="font-semibold text-sm">Filters</h3>
          </div>

          <div className="space-y-3">
            {/* Goal Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Goal</label>
              <div className="flex flex-wrap gap-2">
                {GOALS.map((goal) => (
                  <Badge
                    key={goal}
                    variant={selectedGoal === goal ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedGoal === goal
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedGoal(selectedGoal === goal ? null : goal)}
                  >
                    {goal.replace('_', ' ').charAt(0).toUpperCase() + goal.replace('_', ' ').slice(1)}
                    {selectedGoal === goal && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {DIFFICULTIES.map((difficulty) => (
                  <Badge
                    key={difficulty}
                    variant={selectedDifficulty === difficulty ? "default" : "outline"}
                    className={`cursor-pointer ${
                      selectedDifficulty === difficulty
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedDifficulty(selectedDifficulty === difficulty ? null : difficulty)}
                  >
                    {difficulty}
                    {selectedDifficulty === difficulty && <X className="ml-1 h-3 w-3" />}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {(selectedGoal || selectedDifficulty) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedGoal(null);
                  setSelectedDifficulty(null);
                }}
                className="text-sm"
              >
                Clear All Filters
              </Button>
            )}
          </div>
        </div>

        {/* Programs Grid */}
        {programs && programs.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {programs.map((program) => (
              <ProgramCard
                key={program.id}
                id={program.id}
                title={program.title}
                description={program.description}
                duration_weeks={program.duration_weeks}
                difficulty={program.difficulty}
                goal={program.goal}
                image_url={program.image_url || undefined}
                isEnrolled={isEnrolled(program.id)}
                progress={getProgress(program.id)}
                onEnroll={() => handleEnrollClick(program)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">No programs found</p>
            <p className="text-gray-400 mb-6">Try adjusting your filters</p>
            <Button
              onClick={() => {
                setSelectedGoal(null);
                setSelectedDifficulty(null);
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </div>

      {/* Enroll Dialog */}
      {selectedProgram && (
        <EnrollProgramDialog
          open={enrollDialogOpen}
          onOpenChange={setEnrollDialogOpen}
          program={selectedProgram}
        />
      )}
    </>
  );
};

export default TrainingPrograms;
