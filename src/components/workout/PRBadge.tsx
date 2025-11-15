import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface PRBadgeProps {
  recordType: 'max_weight' | 'max_reps' | 'max_duration';
  value: number;
  previousValue?: number;
  className?: string;
  compact?: boolean;
}

export const PRBadge = ({
  recordType,
  value,
  previousValue,
  className,
  compact = false
}: PRBadgeProps) => {
  const getRecordLabel = () => {
    switch (recordType) {
      case 'max_weight':
        return `${value} kg`;
      case 'max_reps':
        return `${value} reps`;
      case 'max_duration':
        return `${value}s`;
      default:
        return value;
    }
  };

  const getRecordType = () => {
    switch (recordType) {
      case 'max_weight':
        return 'Max Weight';
      case 'max_reps':
        return 'Max Reps';
      case 'max_duration':
        return 'Max Duration';
      default:
        return 'PR';
    }
  };

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-1.5 px-2 py-1 rounded-full",
          "bg-gradient-to-r from-yellow-500 to-amber-500",
          "text-white text-xs font-bold",
          "animate-pulse shadow-lg shadow-yellow-500/50",
          className
        )}
      >
        <Trophy className="h-3 w-3" />
        <span>PR!</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 border-yellow-500",
        "bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950/20 dark:to-amber-950/20",
        "p-4 shadow-lg shadow-yellow-500/20",
        "animate-[pulse_2s_ease-in-out_infinite]",
        className
      )}
    >
      {/* Animated sparkles background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-yellow-400/20 to-transparent rounded-full blur-2xl animate-[spin_3s_linear_infinite]" />
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-amber-400/20 to-transparent rounded-full blur-2xl animate-[spin_4s_linear_infinite_reverse]" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500 shadow-lg">
            <Trophy className="h-5 w-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-semibold text-yellow-700 dark:text-yellow-400 uppercase tracking-wider">
              New Personal Record!
            </span>
            <span className="text-sm text-muted-foreground">
              {getRecordType()}
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
            {getRecordLabel()}
          </span>
          {previousValue !== undefined && (
            <span className="text-sm text-muted-foreground line-through">
              {recordType === 'max_weight' && `${previousValue} kg`}
              {recordType === 'max_reps' && `${previousValue} reps`}
              {recordType === 'max_duration' && `${previousValue}s`}
            </span>
          )}
        </div>

        {previousValue !== undefined && (
          <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
            +{(value - previousValue).toFixed(1)} improvement
          </div>
        )}
      </div>

      {/* Celebration effect */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-yellow-400/30 to-transparent rounded-full blur-xl animate-ping" />
    </div>
  );
};

// Simple notification toast variant
export const PRToast = ({
  exerciseName,
  recordType,
  value
}: {
  exerciseName: string;
  recordType: 'max_weight' | 'max_reps' | 'max_duration';
  value: number;
}) => {
  const getRecordLabel = () => {
    switch (recordType) {
      case 'max_weight':
        return `${value} kg`;
      case 'max_reps':
        return `${value} reps`;
      case 'max_duration':
        return `${value}s`;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-full bg-gradient-to-r from-yellow-500 to-amber-500">
        <Trophy className="h-5 w-5 text-white" />
      </div>
      <div className="flex-1">
        <p className="font-semibold text-sm">New Personal Record!</p>
        <p className="text-xs text-muted-foreground">
          {exerciseName}: {getRecordLabel()}
        </p>
      </div>
    </div>
  );
};
