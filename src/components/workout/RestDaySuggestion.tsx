import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Moon, AlertTriangle, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface RestDaySuggestionProps {
  shouldRest: boolean;
  reason: string;
  severity: "low" | "medium" | "high";
  onScheduleRest?: () => void;
  className?: string;
}

export const RestDaySuggestion = ({
  shouldRest,
  reason,
  severity,
  onScheduleRest,
  className,
}: RestDaySuggestionProps) => {
  if (!shouldRest) {
    return null;
  }

  const getAlertVariant = () => {
    switch (severity) {
      case "high":
        return "destructive";
      case "medium":
        return "default";
      case "low":
        return "default";
      default:
        return "default";
    }
  };

  const getIcon = () => {
    switch (severity) {
      case "high":
        return <AlertTriangle className="h-5 w-5" />;
      case "medium":
        return <Moon className="h-5 w-5" />;
      case "low":
        return <Info className="h-5 w-5" />;
      default:
        return <Moon className="h-5 w-5" />;
    }
  };

  const getTitle = () => {
    switch (severity) {
      case "high":
        return "Rest Day Needed!";
      case "medium":
        return "Consider Taking a Rest Day";
      case "low":
        return "Rest Day Suggestion";
      default:
        return "Rest Day Suggestion";
    }
  };

  const getBackgroundColor = () => {
    switch (severity) {
      case "high":
        return "bg-red-50 border-red-200";
      case "medium":
        return "bg-yellow-50 border-yellow-200";
      case "low":
        return "bg-blue-50 border-blue-200";
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  return (
    <Alert
      variant={getAlertVariant()}
      className={cn(
        "border-2",
        severity === "low" && getBackgroundColor(),
        severity === "medium" && getBackgroundColor(),
        className
      )}
    >
      <div className="flex items-start gap-4">
        <div className="mt-0.5">{getIcon()}</div>
        <div className="flex-1">
          <AlertTitle className="mb-2 text-lg font-semibold">
            {getTitle()}
          </AlertTitle>
          <AlertDescription className="mb-4 text-sm">
            {reason}
          </AlertDescription>

          {onScheduleRest && (
            <Button
              onClick={onScheduleRest}
              variant={severity === "high" ? "default" : "outline"}
              size="sm"
              className="mt-2"
            >
              <Moon className="mr-2 h-4 w-4" />
              Schedule Rest Day
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
};
