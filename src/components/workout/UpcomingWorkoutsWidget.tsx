import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Calendar as CalendarIcon,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Pause,
} from "lucide-react";
import { useCurrentUser, useUpcomingWorkouts, useDeleteSchedule, useToggleScheduleActive } from "@/hooks/useWorkoutSchedule";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const UpcomingWorkoutsWidget = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: upcomingWorkouts, isLoading } = useUpcomingWorkouts(
    user?.id || "",
    7
  );
  const deleteScheduleMutation = useDeleteSchedule();
  const toggleScheduleMutation = useToggleScheduleActive();

  // Get the next 3 upcoming workouts
  const nextWorkouts = upcomingWorkouts?.slice(0, 3) || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
  };

  const handleStartWorkout = (workoutId: string) => {
    navigate(`/workouts/active/${workoutId}`);
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!user) return;
    await deleteScheduleMutation.mutateAsync({ scheduleId, userId: user.id });
  };

  const handleToggleSchedule = async (scheduleId: string, isActive: boolean) => {
    if (!user) return;
    await toggleScheduleMutation.mutateAsync({
      scheduleId,
      isActive: !isActive,
      userId: user.id,
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nextWorkouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Upcoming Workouts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CalendarIcon className="h-12 w-12 mx-auto text-gray-400 mb-3" />
            <p className="text-gray-500 mb-2">No upcoming workouts scheduled</p>
            <p className="text-sm text-gray-400">
              Schedule your workouts to see them here
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate("/workout-schedule")}
            >
              View Schedule
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5" />
            Upcoming Workouts
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/workout-schedule")}
          >
            View All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {nextWorkouts.map((schedule) => (
            <div
              key={schedule.id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">
                      {schedule.workout?.title || "Untitled Workout"}
                    </h3>
                    {!schedule.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Paused
                      </Badge>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                    <div className="flex items-center">
                      <CalendarIcon className="h-4 w-4 mr-1" />
                      {formatDate(schedule.scheduled_for)}
                    </div>
                    {schedule.time_of_day && (
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {schedule.time_of_day.substring(0, 5)}
                      </div>
                    )}
                    {schedule.workout?.duration_minutes && (
                      <Badge variant="outline" className="text-xs">
                        {schedule.workout.duration_minutes} min
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button
                    size="sm"
                    onClick={() => handleStartWorkout(schedule.workout.id)}
                    disabled={!schedule.is_active}
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Start
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          handleToggleSchedule(schedule.id, schedule.is_active)
                        }
                      >
                        <Pause className="h-4 w-4 mr-2" />
                        {schedule.is_active ? "Pause" : "Resume"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => navigate(`/workouts/${schedule.workout.id}`)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        View Workout
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteSchedule(schedule.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Schedule
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
