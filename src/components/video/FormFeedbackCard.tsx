import { FormAnalysis } from "@/types/video";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  UserCheck,
} from "lucide-react";

interface FormFeedbackCardProps {
  analysis: FormAnalysis;
  videoId: string;
  exerciseName: string;
  onRequestReview?: () => void;
}

export function FormFeedbackCard({
  analysis,
  videoId,
  exerciseName,
  onRequestReview,
}: FormFeedbackCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100";
    if (score >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent";
    if (score >= 60) return "Good";
    return "Needs Improvement";
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Form Analysis
              <Badge variant={analysis.analysis_type === "ai_generated" ? "secondary" : "default"}>
                {analysis.analysis_type === "ai_generated"
                  ? "AI Generated"
                  : analysis.analysis_type === "trainer_feedback"
                  ? "Trainer Review"
                  : "Self Assessment"}
              </Badge>
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {exerciseName} • {new Date(analysis.analyzed_at).toLocaleDateString()}
            </p>
          </div>

          {/* Overall Score */}
          <div
            className={`flex flex-col items-center p-3 rounded-lg ${getScoreBgColor(
              analysis.overall_score
            )}`}
          >
            <div className={`text-3xl font-bold ${getScoreColor(analysis.overall_score)}`}>
              {analysis.overall_score}
            </div>
            <div className={`text-xs font-medium ${getScoreColor(analysis.overall_score)}`}>
              {getScoreLabel(analysis.overall_score)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Feedback Text */}
        {analysis.feedback_text && (
          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm">{analysis.feedback_text}</p>
          </div>
        )}

        {/* Issues Detected */}
        {analysis.issues_detected && analysis.issues_detected.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <h4 className="font-semibold text-sm">Issues Detected</h4>
            </div>
            <ul className="space-y-1">
              {analysis.issues_detected.map((issue, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-yellow-600 mt-0.5">•</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strengths */}
        {analysis.strengths && analysis.strengths.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <h4 className="font-semibold text-sm">Strengths</h4>
            </div>
            <ul className="space-y-1">
              {analysis.strengths.map((strength, index) => (
                <li
                  key={index}
                  className="text-sm text-muted-foreground flex items-start gap-2"
                >
                  <span className="text-green-600 mt-0.5">•</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvement Suggestions */}
        {analysis.improvement_suggestions &&
          analysis.improvement_suggestions.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
                <h4 className="font-semibold text-sm">How to Improve</h4>
              </div>
              <ul className="space-y-1">
                {analysis.improvement_suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    className="text-sm text-muted-foreground flex items-start gap-2"
                  >
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        {/* Request Human Review Button */}
        {analysis.analysis_type === "ai_generated" && onRequestReview && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={onRequestReview}
            >
              <UserCheck className="mr-2 h-4 w-4" />
              Request Trainer Review
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Get personalized feedback from a certified trainer
            </p>
          </div>
        )}

        {/* Analyzed by */}
        {analysis.analyzed_by && analysis.analyzed_by !== "ai" && (
          <div className="text-xs text-muted-foreground">
            Reviewed by: {analysis.analyzed_by}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
