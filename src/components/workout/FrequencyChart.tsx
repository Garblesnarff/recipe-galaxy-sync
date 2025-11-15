import { Card } from "@/components/ui/card";
import { Calendar } from "lucide-react";
import { useState } from "react";

interface FrequencyChartProps {
  data: Array<{
    date: string;
    count: number;
    level: number;
  }>;
}

export const FrequencyChart = ({ data }: FrequencyChartProps) => {
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Generate last 12 weeks of dates
  const generateCalendarGrid = () => {
    const today = new Date();
    const weeks = 12;
    const days = weeks * 7;

    const grid: Date[][] = [];
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - days);

    // Start from the nearest Sunday
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    let currentWeek: Date[] = [];

    for (let i = 0; i < days + 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      currentWeek.push(date);

      if (currentWeek.length === 7) {
        grid.push([...currentWeek]);
        currentWeek = [];
      }
    }

    return grid;
  };

  const calendarGrid = generateCalendarGrid();

  // Get color for a date
  const getColor = (date: Date): string => {
    const dateStr = date.toISOString().split("T")[0];
    const dayData = data.find((d) => d.date === dateStr);

    if (!dayData || dayData.count === 0) return "bg-gray-100 border-gray-200";
    if (dayData.level >= 4) return "bg-green-600 border-green-700";
    if (dayData.level >= 3) return "bg-green-500 border-green-600";
    if (dayData.level >= 2) return "bg-green-400 border-green-500";
    return "bg-green-300 border-green-400";
  };

  // Get workout count for a date
  const getCount = (date: Date): number => {
    const dateStr = date.toISOString().split("T")[0];
    const dayData = data.find((d) => d.date === dateStr);
    return dayData?.count || 0;
  };

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // Calculate stats
  const totalWorkouts = data.reduce((sum, d) => sum + d.count, 0);
  const activeDays = data.filter((d) => d.count > 0).length;
  const maxDay = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    { date: "", count: 0, level: 0 }
  );

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Workout Frequency
            </h3>
            <p className="text-sm text-gray-500">
              Activity heatmap for the last 12 weeks
            </p>
          </div>
        </div>

        {/* Calendar Heatmap */}
        <div className="overflow-x-auto">
          <div className="inline-block min-w-full">
            {/* Month Labels */}
            <div className="flex mb-2">
              <div className="w-12"></div>
              {calendarGrid.map((week, weekIndex) => {
                const firstDay = week[0];
                const showMonth =
                  weekIndex === 0 || firstDay.getDate() <= 7;
                return (
                  <div
                    key={weekIndex}
                    className="flex-1 text-center text-xs text-gray-500"
                  >
                    {showMonth ? months[firstDay.getMonth()] : ""}
                  </div>
                );
              })}
            </div>

            {/* Grid */}
            <div className="flex gap-1">
              {/* Day Labels */}
              <div className="flex flex-col justify-around pr-2">
                {weekDays.map((day, index) => (
                  <div
                    key={day}
                    className="text-xs text-gray-500 h-3 flex items-center"
                  >
                    {index % 2 === 0 ? day : ""}
                  </div>
                ))}
              </div>

              {/* Heatmap Cells */}
              {calendarGrid.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((date, dayIndex) => {
                    const dateStr = date.toISOString().split("T")[0];
                    const count = getCount(date);
                    const isFuture = date > new Date();

                    return (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                        className={`
                          w-3 h-3 rounded-sm border cursor-pointer transition-all hover:scale-125
                          ${isFuture ? "bg-transparent border-transparent" : getColor(date)}
                          ${hoveredDate === dateStr ? "ring-2 ring-blue-500" : ""}
                        `}
                        onMouseEnter={() => !isFuture && setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        title={
                          isFuture
                            ? ""
                            : `${date.toLocaleDateString()}: ${count} workout${
                                count !== 1 ? "s" : ""
                              }`
                        }
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Hover Info */}
        {hoveredDate && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-center">
            <p className="text-sm font-semibold text-blue-900">
              {new Date(hoveredDate).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
            <p className="text-xs text-blue-700 mt-1">
              {data.find((d) => d.date === hoveredDate)?.count || 0} workout(s)
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-2 pt-4 border-t">
          <span className="text-xs text-gray-500">Less</span>
          <div className="flex gap-1">
            <div className="w-4 h-4 bg-gray-100 rounded-sm border border-gray-200"></div>
            <div className="w-4 h-4 bg-green-300 rounded-sm border border-green-400"></div>
            <div className="w-4 h-4 bg-green-400 rounded-sm border border-green-500"></div>
            <div className="w-4 h-4 bg-green-500 rounded-sm border border-green-600"></div>
            <div className="w-4 h-4 bg-green-600 rounded-sm border border-green-700"></div>
          </div>
          <span className="text-xs text-gray-500">More</span>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Workouts</p>
            <p className="text-lg font-semibold">{totalWorkouts}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Active Days</p>
            <p className="text-lg font-semibold">{activeDays}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Best Day</p>
            <p className="text-lg font-semibold">{maxDay.count}x</p>
          </div>
        </div>
      </div>
    </Card>
  );
};
