import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { TrendingUp, Calendar, CheckCircle, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getActiveEnrollments, getProgramProgress } from "@/services/workout/trainingPrograms";
import { useEffect, useState } from "react";

export const CurrentProgramWidget = () => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    fetchUser();
  }, []);

  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['active-enrollments', userId],
    queryFn: () => getActiveEnrollments(userId!),
    enabled: !!userId,
  });

  const activeEnrollment = enrollments?.[0];

  const { data: progress } = useQuery({
    queryKey: ['program-progress', activeEnrollment?.id],
    queryFn: () => getProgramProgress(activeEnrollment!.id),
    enabled: !!activeEnrollment?.id,
  });

  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-blue-200 rounded w-1/3"></div>
          <div className="h-4 bg-blue-200 rounded w-2/3"></div>
          <div className="h-2 bg-blue-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (!activeEnrollment) {
    return (
      <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Ready to Start a Training Program?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Join a structured multi-week program to reach your fitness goals
            </p>
          </div>
          <Link to="/training-programs">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Browse Programs
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Card>
    );
  }

  const program = activeEnrollment.program;
  const currentWeek = activeEnrollment.current_week;
  const progressPercentage = progress?.percentage || 0;

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <Badge className="bg-blue-600 text-white">Active Program</Badge>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-1">
            {program.title}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {program.description}
          </p>
        </div>
      </div>

      {/* Week and Progress Info */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">Current Week</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currentWeek} <span className="text-sm text-gray-500">/ {program.duration_weeks}</span>
          </p>
        </div>

        <div className="bg-white rounded-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">Completed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {progress?.completedWorkouts || 0}{' '}
            <span className="text-sm text-gray-500">/ {progress?.totalWorkouts || 0}</span>
          </p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm font-semibold text-blue-600">
            {Math.round(progressPercentage)}%
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3 bg-blue-200" />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Link to={`/training-programs/${program.id}`} className="flex-1">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
            View Program
          </Button>
        </Link>
        <Link to={`/training-programs/${program.id}#week-${currentWeek}`} className="flex-1">
          <Button variant="outline" className="w-full border-blue-600 text-blue-600 hover:bg-blue-50">
            Today's Workout
          </Button>
        </Link>
      </div>
    </Card>
  );
};
