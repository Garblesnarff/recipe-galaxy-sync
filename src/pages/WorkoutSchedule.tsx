import { useState } from "react";
import { MainNav } from "@/components/layout/MainNav";
import { WeeklyScheduleCalendar } from "@/components/workout/WeeklyScheduleCalendar";
import { ScheduleWorkoutDialog } from "@/components/workout/ScheduleWorkoutDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar as CalendarIcon,
  CalendarDays,
  Plus,
  Clock,
  Trash2,
  Pause,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  useCurrentUser,
  useWorkoutSchedules,
  useDeleteSchedule,
  useToggleScheduleActive,
} from "@/hooks/useWorkoutSchedule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DAYS_OF_WEEK = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const WorkoutSchedule = () => {
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();
  const { data: schedules, isLoading } = useWorkoutSchedules(user?.id || "");
  const deleteScheduleMutation = useDeleteSchedule();
  const toggleScheduleMutation = useToggleScheduleActive();

  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<{
    id: string;
    title: string;
  } | null>(null);

  const handleWorkoutClick = (workoutId: string) => {
    navigate(`/workouts/${workoutId}`);
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

  const recurringSchedules = schedules?.filter((s) => s.day_of_week !== null) || [];
  const oneTimeSchedules = schedules?.filter((s) => s.scheduled_date !== null) || [];

  if (isLoading) {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <div className="h-96 flex items-center justify-center">
            <div className="text-gray-500">Loading schedules...</div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Workout Schedule</h1>
          <Button onClick={() => navigate("/workouts")}>
            <Plus className="mr-2 h-4 w-4" />
            Browse Workouts
          </Button>
        </div>

        <Tabs defaultValue="calendar" className="space-y-6">
          <TabsList>
            <TabsTrigger value="calendar">
              <CalendarDays className="mr-2 h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="list">
              <CalendarIcon className="mr-2 h-4 w-4" />
              Schedule List
            </TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <WeeklyScheduleCalendar
              onWorkoutClick={handleWorkoutClick}
              onDayClick={(date) => console.log("Day clicked:", date)}
            />
          </TabsContent>

          <TabsContent value="list" className="space-y-6">
            {/* Recurring Schedules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="mr-2 h-5 w-5" />
                  Recurring Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recurringSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No recurring schedules</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recurringSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {schedule.workout?.title || "Untitled Workout"}
                              </h3>
                              <Badge variant="outline">
                                {DAYS_OF_WEEK[schedule.day_of_week || 0]}
                              </Badge>
                              {!schedule.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Paused
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              {schedule.time_of_day && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {schedule.time_of_day.substring(0, 5)}
                                </div>
                              )}
                              {schedule.reminder_enabled && (
                                <div className="text-xs text-gray-500">
                                  Reminder: {schedule.reminder_minutes_before} min
                                  before
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleSchedule(
                                  schedule.id,
                                  schedule.is_active
                                )
                              }
                            >
                              {schedule.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Schedule
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this schedule?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSchedule(schedule.id)
                                    }
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* One-Time Schedules */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CalendarIcon className="mr-2 h-5 w-5" />
                  One-Time Schedules
                </CardTitle>
              </CardHeader>
              <CardContent>
                {oneTimeSchedules.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No one-time schedules</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {oneTimeSchedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold">
                                {schedule.workout?.title || "Untitled Workout"}
                              </h3>
                              {!schedule.is_active && (
                                <Badge variant="secondary" className="text-xs">
                                  Paused
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center">
                                <CalendarIcon className="h-4 w-4 mr-1" />
                                {new Date(
                                  schedule.scheduled_date || ""
                                ).toLocaleDateString("en-US", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })}
                              </div>
                              {schedule.time_of_day && (
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {schedule.time_of_day.substring(0, 5)}
                                </div>
                              )}
                              {schedule.reminder_enabled && (
                                <div className="text-xs text-gray-500">
                                  Reminder: {schedule.reminder_minutes_before} min
                                  before
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 ml-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleToggleSchedule(
                                  schedule.id,
                                  schedule.is_active
                                )
                              }
                            >
                              {schedule.is_active ? (
                                <Pause className="h-4 w-4" />
                              ) : (
                                <Play className="h-4 w-4" />
                              )}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Schedule
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this schedule?
                                    This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() =>
                                      handleDeleteSchedule(schedule.id)
                                    }
                                    className="bg-red-500 hover:bg-red-600"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {selectedWorkout && (
        <ScheduleWorkoutDialog
          workoutId={selectedWorkout.id}
          workoutTitle={selectedWorkout.title}
          open={scheduleDialogOpen}
          onClose={() => {
            setScheduleDialogOpen(false);
            setSelectedWorkout(null);
          }}
        />
      )}
    </>
  );
};

export default WorkoutSchedule;
