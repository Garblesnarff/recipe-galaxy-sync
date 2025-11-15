import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, Calendar, Dumbbell } from "lucide-react";
import { Link } from "react-router-dom";

interface WorkoutInWeek {
  id: string;
  day_of_week: number;
  order_index: number;
  workout?: {
    id: string;
    title: string;
    description: string;
    duration_minutes: number;
    difficulty: string;
  };
  completion?: Array<{
    id: string;
    completed_at: string;
  }>;
}

interface ProgramWeekViewProps {
  weekNumber: number;
  focus: string;
  description: string;
  workouts: WorkoutInWeek[];
  isCurrentWeek?: boolean;
  isCompleted?: boolean;
  onWorkoutComplete?: (workoutId: string) => void;
}

const DAYS_OF_WEEK = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export const ProgramWeekView = ({
  weekNumber,
  focus,
  description,
  workouts,
  isCurrentWeek = false,
  isCompleted = false,
  onWorkoutComplete,
}: ProgramWeekViewProps) => {
  // Group workouts by day
  const workoutsByDay = workouts.reduce((acc, workout) => {
    if (!acc[workout.day_of_week]) {
      acc[workout.day_of_week] = [];
    }
    acc[workout.day_of_week].push(workout);
    return acc;
  }, {} as Record<number, WorkoutInWeek[]>);

  // Sort workouts within each day by order_index
  Object.keys(workoutsByDay).forEach((day) => {
    workoutsByDay[parseInt(day)].sort((a, b) => a.order_index - b.order_index);
  });

  return (
    <Card className={`p-6 ${isCurrentWeek ? 'border-blue-500 border-2' : ''}`}>
      {/* Week Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-xl font-semibold">Week {weekNumber}</h3>
            {isCurrentWeek && (
              <Badge className="bg-blue-500 text-white">Current Week</Badge>
            )}
            {isCompleted && (
              <Badge className="bg-green-500 text-white">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completed
              </Badge>
            )}
          </div>
          <div className="text-sm font-medium text-gray-700 mb-1">{focus}</div>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="space-y-3">
        {Object.entries(workoutsByDay).length > 0 ? (
          Object.entries(workoutsByDay).map(([day, dayWorkouts]) => (
            <div key={day} className="border-l-4 border-blue-200 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="font-medium text-sm">{DAYS_OF_WEEK[parseInt(day)]}</span>
              </div>
              <div className="space-y-2">
                {dayWorkouts.map((workout) => {
                  const isWorkoutCompleted = workout.completion && workout.completion.length > 0;

                  return (
                    <div
                      key={workout.id}
                      className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isWorkoutCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-300 flex-shrink-0" />
                        )}

                        <div className="flex-1 min-w-0">
                          {workout.workout ? (
                            <>
                              <div className="flex items-center gap-2 mb-1">
                                <Dumbbell className="h-4 w-4 text-gray-500" />
                                <h4 className="font-medium text-sm">{workout.workout.title}</h4>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-1">
                                {workout.workout.description}
                              </p>
                              <div className="flex gap-2 mt-1">
                                {workout.workout.duration_minutes && (
                                  <Badge variant="outline" className="text-xs">
                                    {workout.workout.duration_minutes} min
                                  </Badge>
                                )}
                                {workout.workout.difficulty && (
                                  <Badge variant="outline" className="text-xs">
                                    {workout.workout.difficulty}
                                  </Badge>
                                )}
                              </div>
                            </>
                          ) : (
                            <p className="text-sm text-gray-500 italic">Rest Day</p>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {workout.workout && (
                          <>
                            <Link to={`/workout/${workout.workout.id}`}>
                              <Button variant="outline" size="sm">
                                View
                              </Button>
                            </Link>
                            {isCurrentWeek && !isWorkoutCompleted && onWorkoutComplete && (
                              <Button
                                size="sm"
                                onClick={() => onWorkoutComplete(workout.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Complete
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>No workouts scheduled for this week</p>
          </div>
        )}
      </div>
    </Card>
  );
};
