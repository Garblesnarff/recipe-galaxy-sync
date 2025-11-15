import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, TrendingUp, Target } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollInProgram } from "@/services/workout/trainingPrograms";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EnrollProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  program: {
    id: string;
    title: string;
    description: string;
    duration_weeks: number;
    difficulty: string;
    goal: string;
    image_url?: string;
  };
}

export const EnrollProgramDialog = ({
  open,
  onOpenChange,
  program,
}: EnrollProgramDialogProps) => {
  const [isEnrolling, setIsEnrolling] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      return enrollInProgram(user.id, program.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['user-enrollments'] });
      toast({
        title: "Enrolled Successfully!",
        description: `You've enrolled in ${program.title}. Let's get started!`,
      });
      onOpenChange(false);
    },
    onError: (error) => {
      console.error("Error enrolling in program:", error);
      toast({
        title: "Enrollment Failed",
        description: "There was an error enrolling in this program. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleEnroll = () => {
    setIsEnrolling(true);
    enrollMutation.mutate();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Enroll in Training Program</DialogTitle>
          <DialogDescription>
            Start your journey with this structured training program
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Program Image */}
          {program.image_url && (
            <div className="w-full h-48 rounded-lg overflow-hidden">
              <img
                src={program.image_url}
                alt={program.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Program Details */}
          <div>
            <h3 className="text-xl font-semibold mb-2">{program.title}</h3>
            <p className="text-sm text-gray-600 mb-3">{program.description}</p>

            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={`${getDifficultyColor(program.difficulty)} text-white`}>
                {program.difficulty}
              </Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                {program.duration_weeks} weeks
              </Badge>
              <Badge variant="outline">
                <Target className="h-3 w-3 mr-1" />
                <span className="capitalize">{program.goal.replace('_', ' ')}</span>
              </Badge>
            </div>
          </div>

          {/* What to Expect */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              What to Expect
            </h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• Structured {program.duration_weeks}-week training schedule</li>
              <li>• Progressive difficulty and volume</li>
              <li>• Track your progress week by week</li>
              <li>• Achieve your {program.goal.replace('_', ' ')} goals</li>
            </ul>
          </div>

          {/* Commitment Message */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <p className="text-sm text-gray-700">
              By enrolling, you're committing to {program.duration_weeks} weeks of consistent training.
              You can track your progress and complete workouts at your own pace.
            </p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isEnrolling}
          >
            Cancel
          </Button>
          <Button
            onClick={handleEnroll}
            disabled={isEnrolling}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isEnrolling ? "Enrolling..." : "Start Program"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
