import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StrengthScoreCardProps {
  score: {
    totalScore: number;
    volumeScore: number;
    consistencyScore: number;
    progressionScore: number;
    recentVolume: number;
    previousVolume: number;
    improvement: number;
  } | null;
}

export const StrengthScoreCard = ({ score }: StrengthScoreCardProps) => {
  if (!score) {
    return (
      <Card className="p-6">
        <div className="text-center text-gray-500">
          <Award className="h-12 w-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm">No strength score available</p>
          <p className="text-xs mt-2">Complete workouts to calculate your score!</p>
        </div>
      </Card>
    );
  }

  // Determine score level and color
  const getScoreLevel = (score: number): { label: string; color: string } => {
    if (score >= 80) return { label: "Elite", color: "text-purple-600" };
    if (score >= 60) return { label: "Advanced", color: "text-blue-600" };
    if (score >= 40) return { label: "Intermediate", color: "text-green-600" };
    if (score >= 20) return { label: "Beginner", color: "text-yellow-600" };
    return { label: "Starting Out", color: "text-gray-600" };
  };

  const scoreLevel = getScoreLevel(score.totalScore);

  // Get trend icon
  const getTrendIcon = () => {
    if (score.improvement > 5)
      return <TrendingUp className="h-5 w-5 text-green-600" />;
    if (score.improvement < -5)
      return <TrendingDown className="h-5 w-5 text-red-600" />;
    return <Minus className="h-5 w-5 text-gray-600" />;
  };

  return (
    <Card className="p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Overall Strength Score
            </h3>
            <p className="text-sm text-gray-500">
              Your comprehensive strength metric
            </p>
          </div>
          <Badge variant="secondary" className={scoreLevel.color}>
            {scoreLevel.label}
          </Badge>
        </div>

        {/* Main Score Display */}
        <div className="text-center py-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
          <div className="flex items-center justify-center gap-2 mb-2">
            {getTrendIcon()}
            <p className="text-6xl font-bold text-gray-800">
              {score.totalScore}
            </p>
            <span className="text-2xl text-gray-500">/100</span>
          </div>
          {score.improvement !== 0 && (
            <p
              className={`text-sm font-medium ${
                score.improvement > 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {score.improvement > 0 ? "+" : ""}
              {score.improvement}% vs last month
            </p>
          )}
        </div>

        {/* Score Breakdown */}
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700">Score Breakdown</h4>

          {/* Volume Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Volume</span>
              <span className="text-sm font-semibold text-gray-800">
                {score.volumeScore}/40
              </span>
            </div>
            <Progress value={(score.volumeScore / 40) * 100} className="h-2" />
            <p className="text-xs text-gray-500 mt-1">
              Based on total training volume
            </p>
          </div>

          {/* Consistency Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Consistency</span>
              <span className="text-sm font-semibold text-gray-800">
                {score.consistencyScore}/30
              </span>
            </div>
            <Progress
              value={(score.consistencyScore / 30) * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Workout frequency this month
            </p>
          </div>

          {/* Progression Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Progression</span>
              <span className="text-sm font-semibold text-gray-800">
                {score.progressionScore}/30
              </span>
            </div>
            <Progress
              value={(score.progressionScore / 30) * 100}
              className="h-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              Improvement over previous month
            </p>
          </div>
        </div>

        {/* Volume Comparison */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Last 30 Days</p>
            <p className="text-xl font-bold text-blue-600">
              {(score.recentVolume / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-500">kg volume</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 mb-1">Previous 30 Days</p>
            <p className="text-xl font-bold text-gray-600">
              {(score.previousVolume / 1000).toFixed(1)}k
            </p>
            <p className="text-xs text-gray-500">kg volume</p>
          </div>
        </div>

        {/* Motivational Message */}
        {score.totalScore >= 80 && (
          <div className="p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-md border border-purple-300">
            <p className="text-center text-sm font-semibold text-purple-900">
              Outstanding performance! You're in the elite tier!
            </p>
          </div>
        )}
        {score.totalScore >= 60 && score.totalScore < 80 && (
          <div className="p-3 bg-gradient-to-r from-blue-100 to-green-100 rounded-md border border-blue-300">
            <p className="text-center text-sm font-semibold text-blue-900">
              Great work! You're showing advanced strength gains!
            </p>
          </div>
        )}
        {score.totalScore < 60 && score.improvement > 0 && (
          <div className="p-3 bg-gradient-to-r from-green-100 to-yellow-100 rounded-md border border-green-300">
            <p className="text-center text-sm font-semibold text-green-900">
              Keep going! You're making steady progress!
            </p>
          </div>
        )}
      </div>
    </Card>
  );
};
