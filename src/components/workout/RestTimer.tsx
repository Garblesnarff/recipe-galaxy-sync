import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Play, Pause, RotateCcw, X, Plus, Minus, Volume2, VolumeX } from "lucide-react";
import { useAudio } from "@/hooks/useAudio";
import { shouldAnnounceInterval } from "@/utils/audioUtils";

interface RestTimerProps {
  initialSeconds?: number;
  onComplete?: () => void;
  autoStart?: boolean;
}

export const RestTimer = ({
  initialSeconds = 60,
  onComplete,
  autoStart = false,
}: RestTimerProps) => {
  const [totalSeconds, setTotalSeconds] = useState(initialSeconds);
  const [remainingSeconds, setRemainingSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const [hasAnnounced, setHasAnnounced] = useState<Set<number>>(new Set());
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { config, announce, playSound } = useAudio();

  // Announce rest start on mount
  useEffect(() => {
    if (autoStart && config?.enabled && config?.announceRestPeriods && !isMuted) {
      const minutes = Math.floor(initialSeconds / 60);
      const seconds = initialSeconds % 60;
      let timeText = '';

      if (minutes > 0) {
        timeText = `${minutes} minute${minutes === 1 ? '' : 's'}`;
        if (seconds > 0) {
          timeText += ` ${seconds} second${seconds === 1 ? '' : 's'}`;
        }
      } else {
        timeText = `${seconds} second${seconds === 1 ? '' : 's'}`;
      }

      announce(`Rest for ${timeText}`, { priority: 'normal' });

      if (config?.soundEffects) {
        playSound('REST_START');
      }
    }
  }, []); // Only run once on mount

  useEffect(() => {
    // Play sound when complete
    if (remainingSeconds === 0 && onComplete) {
      if (audioRef.current) {
        audioRef.current.play();
      }

      // Audio announcements
      if (!isMuted && config?.enabled && config?.announceRestPeriods) {
        announce("Rest is over, time to go!", { priority: 'high' });
        if (config?.soundEffects) {
          playSound('REST_END');
        }
      }

      onComplete();
    }
  }, [remainingSeconds, onComplete, isMuted, config, announce, playSound]);

  useEffect(() => {
    if (isActive && remainingSeconds > 0) {
      intervalRef.current = window.setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            return 0;
          }

          const newRemaining = prev - 1;

          // Announce countdown at intervals
          const intervals = config?.announceIntervals || [10, 5, 3, 2, 1];
          if (
            !isMuted &&
            config?.enabled &&
            config?.announceRestPeriods &&
            shouldAnnounceInterval(newRemaining, intervals) &&
            !hasAnnounced.has(newRemaining)
          ) {
            announce(newRemaining.toString(), { priority: 'high' });
            setHasAnnounced((prev) => new Set(prev).add(newRemaining));

            // Play sound effect
            if (config?.soundEffects) {
              if (newRemaining === 1) {
                playSound('COUNTDOWN_FINAL');
              } else if (newRemaining <= 5) {
                playSound('COUNTDOWN_TICK');
              }
            }
          }

          // "Get ready" announcement
          if (newRemaining === 3 && !hasAnnounced.has(-1)) {
            announce('Get ready', { priority: 'high' });
            setHasAnnounced((prev) => new Set(prev).add(-1));
          }

          return newRemaining;
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
  }, [isActive, remainingSeconds, isMuted, config, announce, playSound, hasAnnounced]);

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setRemainingSeconds(totalSeconds);
  };

  const adjustTime = (adjustment: number) => {
    const newTotal = Math.max(5, totalSeconds + adjustment);
    setTotalSeconds(newTotal);
    if (!isActive) {
      setRemainingSeconds(newTotal);
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50">
      <audio ref={audioRef} src="/timer-complete.mp3" preload="auto" />

      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Rest Timer</h3>
        <p className="text-sm text-gray-500">Take a break before your next set</p>
      </div>

      <div className="mb-6">
        <div className="relative">
          <div className="text-6xl font-bold text-center mb-4 text-blue-600">
            {formatTime(remainingSeconds)}
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center mb-4">
        <Button
          onClick={toggleTimer}
          size="lg"
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isActive ? (
            <>
              <Pause className="h-5 w-5 mr-2" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-5 w-5 mr-2" />
              Start
            </>
          )}
        </Button>

        <Button onClick={resetTimer} variant="outline" size="lg">
          <RotateCcw className="h-5 w-5 mr-2" />
          Reset
        </Button>

        <Button onClick={handleMuteToggle} variant="outline" size="lg">
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="flex items-center justify-center gap-2">
        <Button
          onClick={() => adjustTime(-15)}
          variant="outline"
          size="sm"
          disabled={isActive}
        >
          <Minus className="h-4 w-4 mr-1" />
          15s
        </Button>
        <span className="text-sm text-gray-600 min-w-[80px] text-center">
          Total: {formatTime(totalSeconds)}
        </span>
        <Button
          onClick={() => adjustTime(15)}
          variant="outline"
          size="sm"
          disabled={isActive}
        >
          <Plus className="h-4 w-4 mr-1" />
          15s
        </Button>
      </div>

      {remainingSeconds === 0 && (
        <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-md text-center">
          <p className="text-green-800 font-semibold">Rest complete! Ready for next set</p>
        </div>
      )}
    </Card>
  );
};
