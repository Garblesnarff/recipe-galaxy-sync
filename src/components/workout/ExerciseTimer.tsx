import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw } from "lucide-react";

interface ExerciseTimerProps {
  exerciseName: string;
  durationSeconds: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const ExerciseTimer = ({
  exerciseName,
  durationSeconds,
  onComplete,
  autoStart = false,
}: ExerciseTimerProps) => {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play sound and callback when complete
    if (remainingSeconds === 0) {
      if (audioRef.current) {
        audioRef.current.play();
      }
      if (onComplete) {
        onComplete();
      }
    }
  }, [remainingSeconds, onComplete]);

  useEffect(() => {
    if (isActive && remainingSeconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, remainingSeconds]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setRemainingSeconds(durationSeconds);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((durationSeconds - remainingSeconds) / durationSeconds) * 100;

  return (
    <Card className="p-6 bg-gradient-to-br from-orange-50 to-red-50">
      <audio ref={audioRef} src="/timer-complete.mp3" preload="auto" />

      <div className="text-center mb-6">
        <h3 className="text-xl font-bold text-gray-800 mb-1">{exerciseName}</h3>
        <p className="text-sm text-gray-600">
          Hold for {formatTime(durationSeconds)}
        </p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="text-7xl font-bold text-center mb-4 text-orange-600">
            {formatTime(remainingSeconds)}
          </div>
          <Progress value={progress} className="h-4" />
        </div>
      </div>

      <div className="flex gap-3 justify-center mb-4">
        <Button
          onClick={toggleTimer}
          size="lg"
          className="flex-1 max-w-[200px] bg-orange-600 hover:bg-orange-700"
        >
          {isActive ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              {remainingSeconds === durationSeconds ? "Start" : "Resume"}
            </>
          )}
        </Button>

        <Button onClick={resetTimer} variant="outline" size="lg">
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {remainingSeconds === 0 && (
        <div className="mt-4 p-4 bg-green-100 border border-green-300 rounded-md text-center animate-pulse">
          <p className="text-green-800 font-bold text-lg">Exercise Complete!</p>
        </div>
      )}

      {isActive && remainingSeconds <= 10 && remainingSeconds > 0 && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-md text-center">
          <p className="text-yellow-800 font-semibold">Almost there! Keep going!</p>
        </div>
      )}
    </Card>
  );
};
