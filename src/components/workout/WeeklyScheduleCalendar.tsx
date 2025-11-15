import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from "lucide-react";
import { useCurrentUser, useUpcomingWorkouts } from "@/hooks/useWorkoutSchedule";
import { cn } from "@/lib/utils";

interface WeeklyScheduleCalendarProps {
  onWorkoutClick?: (workoutId: string) => void;
  onDayClick?: (date: Date) => void;
}

export const WeeklyScheduleCalendar = ({
  onWorkoutClick,
  onDayClick,
}: WeeklyScheduleCalendarProps) => {
  const [weekOffset, setWeekOffset] = useState(0);
  const { data: user } = useCurrentUser();
  const { data: upcomingWorkouts, isLoading } = useUpcomingWorkouts(
    user?.id || "",
    7 + weekOffset * 7
  );

  // Get the dates for the current week view
  const getWeekDates = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDates.push(date);
    }
    return weekDates;
  };

  const weekDates = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group workouts by date
  const workoutsByDate: { [key: string]: any[] } = {};
  upcomingWorkouts?.forEach((workout) => {
    const dateKey = workout.scheduled_for;
    if (!workoutsByDate[dateKey]) {
      workoutsByDate[dateKey] = [];
    }
    workoutsByDate[dateKey].push(workout);
  });

  const formatDayName = (date: Date) => {
    return date.toLocaleDateString("en-US", { weekday: "short" });
  };

  const formatDate = (date: Date) => {
    return date.getDate();
  };

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date: Date) => {
    return date < today;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center">
            <div className="text-gray-500">Loading schedule...</div>
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
            Weekly Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(weekOffset - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {weekOffset !== 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekOffset(0)}
              >
                Today
              </Button>
            )}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setWeekOffset(weekOffset + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {weekDates.map((date, index) => {
            const dateKey = date.toISOString().split("T")[0];
            const dayWorkouts = workoutsByDate[dateKey] || [];
            const isCurrentDay = isToday(date);
            const isPastDay = isPast(date);

            return (
              <div
                key={index}
                className={cn(
                  "rounded-lg border p-3 min-h-[120px] cursor-pointer transition-colors",
                  isCurrentDay && "border-primary bg-primary/5",
                  isPastDay && "bg-gray-50 opacity-75",
                  "hover:bg-gray-50"
                )}
                onClick={() => onDayClick?.(date)}
              >
                <div className="text-center mb-2">
                  <div className="text-xs font-medium text-gray-500 uppercase">
                    {formatDayName(date)}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-semibold",
                      isCurrentDay && "text-primary"
                    )}
                  >
                    {formatDate(date)}
                  </div>
                </div>

                <div className="space-y-1">
                  {dayWorkouts.map((workout, workoutIndex) => (
                    <div
                      key={workoutIndex}
                      className={cn(
                        "text-xs p-2 rounded bg-blue-100 hover:bg-blue-200 cursor-pointer transition-colors",
                        isPastDay && "bg-gray-200 hover:bg-gray-300"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkoutClick?.(workout.workout.id);
                      }}
                    >
                      <div className="font-medium truncate">
                        {workout.workout.title}
                      </div>
                      {workout.time_of_day && (
                        <div className="flex items-center text-gray-600 mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {workout.time_of_day.substring(0, 5)}
                        </div>
                      )}
                    </div>
                  ))}

                  {dayWorkouts.length === 0 && (
                    <div className="text-xs text-gray-400 text-center py-2">
                      No workouts
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/20 border border-primary"></div>
            <span>Today</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-100"></div>
            <span>Scheduled</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
