import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MainNav } from "@/components/layout/MainNav";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ProgramWeekView } from "@/components/workout/ProgramWeekView";
import { EnrollProgramDialog } from "@/components/workout/EnrollProgramDialog";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getProgramDetail,
  getUserEnrollments,
  getProgramProgress,
  markWorkoutComplete,
  advanceToNextWeek,
} from "@/services/workout/trainingPrograms";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Calendar,
  TrendingUp,
  Target,
  ArrowLeft,
  CheckCircle,
  ChevronRight,
} from "lucide-react";

const ProgramDetail = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [enrollDialogOpen, setEnrollDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { data: program, isLoading: programLoading } = useQuery({
    queryKey: ['program-detail', programId],
    queryFn: () => getProgramDetail(programId!),
    enabled: !!programId,
  });

  const { data: enrollments } = useQuery({
    queryKey: ['user-enrollments', userId],
    queryFn: () => getUserEnrollments(userId!),
    enabled: !!userId,
  });

  const currentEnrollment = enrollments?.find(
    (e) => e.program_id === programId && !e.completed
  );

  const { data: progress } = useQuery({
    queryKey: ['program-progress', currentEnrollment?.id],
    queryFn: () => getProgramProgress(currentEnrollment!.id),
    enabled: !!currentEnrollment,
  });

  const completeWorkoutMutation = useMutation({
    mutationFn: ({ enrollmentId, workoutId }: { enrollmentId: string; workoutId: string }) =>
      markWorkoutComplete(enrollmentId, workoutId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['program-detail', programId] });
      queryClient.invalidateQueries({ queryKey: ['program-progress'] });
      toast({
        title: "Workout Completed!",
        description: "Great job! Keep up the momentum.",
      });
    },
    onError: (error) => {
      console.error("Error completing workout:", error);
      toast({
        title: "Error",
        description: "Failed to mark workout as complete. Please try again.",
        variant: "destructive",
      });
    },
  });

  const advanceWeekMutation = useMutation({
    mutationFn: (enrollmentId: string) => advanceToNextWeek(enrollmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['program-progress'] });
      toast({
        title: "Week Completed!",
        description: "Moving on to the next week. Keep crushing it!",
      });
    },
    onError: (error) => {
      console.error("Error advancing week:", error);
      toast({
        title: "Error",
        description: "Failed to advance to next week. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleWorkoutComplete = (workoutId: string) => {
    if (currentEnrollment) {
      completeWorkoutMutation.mutate({
        enrollmentId: currentEnrollment.id,
        workoutId,
      });
    }
  };

  const handleAdvanceWeek = () => {
    if (currentEnrollment) {
      advanceWeekMutation.mutate(currentEnrollment.id);
    }
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (programLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-96 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </>
    );
  }

  if (!program) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-gray-500">Program not found</p>
          <Button onClick={() => navigate('/training-programs')} className="mt-4">
            Back to Programs
          </Button>
        </div>
      </>
    );
  }

  const progressPercentage = progress?.percentage || 0;

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/training-programs')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Programs
        </Button>

        {/* Program Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Cover Image */}
          {program.image_url && (
            <div className="h-64 w-full overflow-hidden">
              <img
                src={program.image_url}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{program.title}</h1>
                <p className="text-gray-600 mb-4">{program.description}</p>

                <div className="flex flex-wrap gap-2">
                  <Badge className={`${getDifficultyColor(program.difficulty)} text-white`}>
                    {program.difficulty}
                  </Badge>
                  <Badge variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    {program.duration_weeks} weeks
                  </Badge>
                  <Badge variant="outline">
                    <Target className="h-3 w-3 mr-1" />
                    <span className="capitalize">{program.goal?.replace('_', ' ')}</span>
                  </Badge>
                </div>
              </div>

              {!currentEnrollment && (
                <Button
                  onClick={() => setEnrollDialogOpen(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Enroll Now
                </Button>
              )}
            </div>

            {/* Enrollment Status */}
            {currentEnrollment && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                    <span className="font-semibold text-blue-900">
                      You're enrolled in this program!
                    </span>
                  </div>
                  <Badge className="bg-blue-600 text-white">
                    Week {currentEnrollment.current_week} of {program.duration_weeks}
                  </Badge>
                </div>

                <div className="mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-700">Overall Progress</span>
                    <span className="text-sm font-semibold text-blue-700">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3 bg-blue-200" />
                </div>

                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    onClick={handleAdvanceWeek}
                    disabled={advanceWeekMutation.isPending}
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    {currentEnrollment.current_week >= program.duration_weeks
                      ? "Complete Program"
                      : "Advance to Next Week"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Week-by-Week Breakdown */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Week-by-Week Breakdown
          </h2>
          <div className="space-y-4">
            {program.weeks && program.weeks.length > 0 ? (
              program.weeks.map((week: any) => (
                <div key={week.id} id={`week-${week.week_number}`}>
                  <ProgramWeekView
                    weekNumber={week.week_number}
                    focus={week.focus}
                    description={week.description}
                    workouts={week.workouts || []}
                    isCurrentWeek={currentEnrollment?.current_week === week.week_number}
                    isCompleted={currentEnrollment && currentEnrollment.current_week > week.week_number}
                    onWorkoutComplete={handleWorkoutComplete}
                  />
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <TrendingUp className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-gray-500">
                  This program structure is being prepared. Check back soon!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Enroll Dialog */}
      <EnrollProgramDialog
        open={enrollDialogOpen}
        onOpenChange={setEnrollDialogOpen}
        program={program}
      />
    </>
  );
};

export default ProgramDetail;
