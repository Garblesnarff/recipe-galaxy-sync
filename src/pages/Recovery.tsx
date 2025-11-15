import { useState } from "react";
import { MainNav } from "@/components/layout/MainNav";
import { RecoveryScoreWidget } from "@/components/workout/RecoveryScoreWidget";
import { RecoveryTrendChart } from "@/components/workout/RecoveryTrendChart";
import { RestDayLogger } from "@/components/workout/RestDayLogger";
import { RestDaySuggestion } from "@/components/workout/RestDaySuggestion";
import { useRecovery } from "@/hooks/useRecovery";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar, Moon, TrendingUp, RefreshCw } from "lucide-react";
import { RestDayData } from "@/services/workout/recovery";

const Recovery = () => {
  const [showLogDialog, setShowLogDialog] = useState(false);
  const {
    recoveryScore,
    recoveryHistory,
    restDays,
    restSuggestion,
    isLoading,
    isLoggingRest,
    logRestDay,
    refreshAll,
  } = useRecovery(30);

  const handleLogRestDay = async (data: RestDayData) => {
    await logRestDay(data);
    setShowLogDialog(false);
  };

  const handleScheduleRest = () => {
    setShowLogDialog(true);
  };

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Recovery</h1>
            <p className="text-gray-600 mt-1">
              Track your rest days and monitor your recovery
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={refreshAll}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowLogDialog(true)}>
              <Moon className="mr-2 h-4 w-4" />
              Log Rest Day
            </Button>
          </div>
        </div>

        {/* Rest Day Suggestion */}
        {restSuggestion?.shouldRest && (
          <RestDaySuggestion
            shouldRest={restSuggestion.shouldRest}
            reason={restSuggestion.reason}
            severity={restSuggestion.severity}
            onScheduleRest={handleScheduleRest}
          />
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Recovery Score */}
          <div className="lg:col-span-1">
            <RecoveryScoreWidget
              recoveryScore={recoveryScore}
              isLoading={isLoading}
              onLogRestDay={() => setShowLogDialog(true)}
            />
          </div>

          {/* Right Column - Charts and Calendar */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recovery Trend Chart */}
            <RecoveryTrendChart
              recoveryHistory={recoveryHistory}
              restDays={restDays}
              isLoading={isLoading}
            />

            {/* Rest Days Calendar View */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-6 w-6 text-green-600" />
                <h3 className="text-xl font-bold text-gray-800">
                  Recent Rest Days
                </h3>
                <Badge variant="secondary" className="ml-auto">
                  {restDays.length} in last 30 days
                </Badge>
              </div>

              {restDays.length > 0 ? (
                <div className="space-y-3">
                  {restDays.slice(0, 10).map((restDay) => (
                    <div
                      key={restDay.id}
                      className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <Moon className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="font-semibold text-gray-800">
                              {new Date(restDay.date).toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            {restDay.recovery_type && (
                              <p className="text-sm text-gray-600 capitalize">
                                {restDay.recovery_type.replace("_", " ")} Recovery
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          {restDay.sleep_hours && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Sleep</p>
                              <p className="font-semibold">{restDay.sleep_hours}h</p>
                            </div>
                          )}
                          {restDay.soreness_level && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Soreness</p>
                              <p className="font-semibold">{restDay.soreness_level}/10</p>
                            </div>
                          )}
                          {restDay.energy_level && (
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Energy</p>
                              <p className="font-semibold">{restDay.energy_level}/10</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {restDay.notes && (
                        <p className="text-sm text-gray-600 mt-2 pl-8">
                          {restDay.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500 mb-4">No rest days logged yet</p>
                  <Button onClick={() => setShowLogDialog(true)} variant="outline">
                    <Moon className="mr-2 h-4 w-4" />
                    Log Your First Rest Day
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Recovery Insights */}
        {recoveryHistory.length > 0 && (
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-bold text-gray-800">Recovery Insights</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-blue-600">
                  {Math.round(
                    recoveryHistory.reduce((sum, s) => sum + s.score, 0) /
                      recoveryHistory.length
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-gray-600 mb-1">Rest Days</p>
                <p className="text-3xl font-bold text-green-600">
                  {restDays.length}
                </p>
                <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                <p className="text-sm text-gray-600 mb-1">Best Score</p>
                <p className="text-3xl font-bold text-purple-600">
                  {recoveryHistory.length > 0
                    ? Math.max(...recoveryHistory.map((s) => s.score))
                    : 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {recoveryHistory.length > 0
                    ? new Date(
                        recoveryHistory.reduce((max, s) =>
                          s.score > max.score ? s : max
                        ).date
                      ).toLocaleDateString()
                    : "N/A"}
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Log Rest Day Dialog */}
      <Dialog open={showLogDialog} onOpenChange={setShowLogDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Log Rest Day</DialogTitle>
            <DialogDescription>
              Record your rest day details to help track your recovery
            </DialogDescription>
          </DialogHeader>
          <RestDayLogger
            onSubmit={handleLogRestDay}
            isLoading={isLoggingRest}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Recovery;
