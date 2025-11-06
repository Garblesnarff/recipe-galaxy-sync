
import { useState } from "react";
import { Clock, Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useInterval } from "@/hooks/useInterval";
import { toast } from "sonner";

export interface RecipeTimerProps {
  minutes?: number;
  label?: string;
  prepTime?: string | number;
  cookTime?: string | number;
  isOpen?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export const RecipeTimer = ({
  minutes,
  label,
  prepTime,
  cookTime,
  isOpen,
  onOpen,
  onClose
}: RecipeTimerProps) => {
  // Convert cookTime to minutes if provided
  const calculatedMinutes = minutes ||
    (cookTime ? parseInt(cookTime.toString(), 10) : 0);

  const calculatedLabel = label ||
    (cookTime ? `${cookTime} Cooking Time` : "Timer");

  const initialSeconds = calculatedMinutes * 60;
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(100);

  // All hooks must be called before any conditional returns
  useInterval(
    () => {
      if (secondsLeft > 0) {
        setSecondsLeft(secondsLeft - 1);
        setProgress((secondsLeft - 1) / initialSeconds * 100);
      } else {
        setIsRunning(false);
        toast(`${calculatedLabel} timer is complete!`, {
          description: "Your timer has finished.",
        });
      }
    },
    isRunning ? 1000 : null
  );

  // Conditional return AFTER all hooks
  // If we're in popup mode
  if (onOpen && onClose) {
    if (!isOpen) {
      return (
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Clock className="mr-2 h-4 w-4" />
          {prepTime && cookTime ? `${prepTime} + ${cookTime}` : cookTime || prepTime}
        </Button>
      );
    }
  }

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSecondsLeft(initialSeconds);
    setProgress(100);
  };

  return (
    <div className="border rounded-md p-3 space-y-2 bg-white">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Clock className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium">{calculatedLabel}</span>
        </div>
        <Badge variant={isRunning ? "default" : "outline"}>
          {formatTime(secondsLeft)}
        </Badge>
      </div>
      
      <Progress value={progress} className="h-1.5" />
      
      <div className="flex justify-end space-x-1">
        {!isRunning ? (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handleStart}
            disabled={initialSeconds === 0}
          >
            <Play className="h-3 w-3" />
          </Button>
        ) : (
          <Button 
            variant="outline" 
            size="sm" 
            className="h-7 w-7 p-0" 
            onClick={handlePause}
          >
            <Pause className="h-3 w-3" />
          </Button>
        )}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-7 w-7 p-0" 
          onClick={handleReset}
          disabled={secondsLeft === initialSeconds}
        >
          <RotateCcw className="h-3 w-3" />
        </Button>
      </div>
      
      {onClose && (
        <div className="flex justify-center mt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      )}
    </div>
  );
};

export default RecipeTimer;
