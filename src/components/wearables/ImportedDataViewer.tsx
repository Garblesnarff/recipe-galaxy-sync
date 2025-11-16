import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, Heart, Footprints, Flame, Plus } from "lucide-react";
import { ImportedHealthData } from "@/services/wearables/syncService";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface ImportedDataViewerProps {
  importedData: ImportedHealthData[];
  onCreateWorkout?: (data: ImportedHealthData) => void;
}

export function ImportedDataViewer({ importedData, onCreateWorkout }: ImportedDataViewerProps) {
  // Separate data by type
  const workouts = importedData.filter(d => d.data_type === 'workout');
  const stepsData = importedData.filter(d => d.data_type === 'steps');
  const caloriesData = importedData.filter(d => d.data_type === 'calories');
  const heartRateData = importedData.filter(d => d.data_type === 'heart_rate');

  // Prepare chart data for steps
  const stepsChartData = stepsData
    .slice(0, 14)
    .reverse()
    .map(d => ({
      date: format(new Date(d.date_recorded), 'MMM dd'),
      steps: d.value?.count || 0,
      platform: d.platform,
    }));

  // Prepare chart data for calories
  const caloriesChartData = caloriesData
    .slice(0, 14)
    .reverse()
    .map(d => ({
      date: format(new Date(d.date_recorded), 'MMM dd'),
      calories: d.value?.count || 0,
      platform: d.platform,
    }));

  const PLATFORM_COLORS: Record<string, string> = {
    apple_health: '#ec4899',
    google_fit: '#3b82f6',
    fitbit: '#14b8a6',
    garmin: '#6366f1',
  };

  if (importedData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Imported Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No imported data yet</p>
            <p className="text-sm mt-1">
              Sync your wearable devices to see your health data here
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Imported Health Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="workouts">Workouts</TabsTrigger>
            <TabsTrigger value="steps">Steps</TabsTrigger>
            <TabsTrigger value="calories">Calories</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="text-2xl font-bold">{workouts.length}</div>
                      <div className="text-xs text-gray-500">Workouts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Footprints className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {stepsData.length > 0
                          ? (stepsData[0].value?.count || 0).toLocaleString()
                          : 0}
                      </div>
                      <div className="text-xs text-gray-500">Steps Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="text-2xl font-bold">
                        {caloriesData.length > 0
                          ? (caloriesData[0].value?.count || 0).toLocaleString()
                          : 0}
                      </div>
                      <div className="text-xs text-gray-500">Calories Today</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Heart className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="text-2xl font-bold">{heartRateData.length}</div>
                      <div className="text-xs text-gray-500">HR Logs</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Steps Chart */}
            {stepsChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Steps (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={stepsChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Calories Chart */}
            {caloriesChartData.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Calories (Last 14 Days)</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={caloriesChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </TabsContent>

          {/* Workouts Tab */}
          <TabsContent value="workouts" className="space-y-3">
            {workouts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No imported workouts</p>
              </div>
            ) : (
              workouts.map((workout) => (
                <div
                  key={workout.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          {workout.value?.type || workout.value?.name || 'Workout'}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {workout.platform.replace('_', ' ')}
                        </Badge>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          Duration: {workout.value?.duration || 0} minutes
                        </div>
                        <div>
                          Calories: {workout.value?.calories || 0}
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(workout.date_recorded), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </div>

                    {onCreateWorkout && !workout.workout_log_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCreateWorkout(workout)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Log
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps" className="space-y-3">
            {stepsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No steps data</p>
              </div>
            ) : (
              <>
                {stepsChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={stepsChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <div className="space-y-2">
                  {stepsData.slice(0, 7).map((data) => (
                    <div
                      key={data.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {(data.value?.count || 0).toLocaleString()} steps
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(data.date_recorded), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {data.platform.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>

          {/* Calories Tab */}
          <TabsContent value="calories" className="space-y-3">
            {caloriesData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No calories data</p>
              </div>
            ) : (
              <>
                {caloriesChartData.length > 0 && (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={caloriesChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="calories" stroke="#f97316" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                <div className="space-y-2">
                  {caloriesData.slice(0, 7).map((data) => (
                    <div
                      key={data.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div>
                        <div className="font-medium">
                          {(data.value?.count || 0).toLocaleString()} calories
                        </div>
                        <div className="text-xs text-gray-500">
                          {format(new Date(data.date_recorded), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {data.platform.replace('_', ' ')}
                      </Badge>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
