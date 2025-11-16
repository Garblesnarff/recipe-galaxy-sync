import { useEffect, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';
import { shouldAnnounceInterval } from '@/utils/audioUtils';

export interface TimerWithAudioProps {
  duration: number; // seconds
  onComplete?: () => void;
  announceIntervals?: number[]; // [30, 10, 5, 3, 2, 1]
  label?: string; // "Rest" or "Exercise"
  autoStart?: boolean;
  showControls?: boolean;
}

export function TimerWithAudio({
  duration,
  onComplete,
  announceIntervals,
  label = 'Timer',
  autoStart = false,
  showControls = true,
}: TimerWithAudioProps) {
  const [remaining, setRemaining] = useState(duration);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isMuted, setIsMuted] = useState(false);
  const { config, announce, playSound } = useAudio();

  // Get announce intervals from config if not provided
  const intervals = announceIntervals || config?.announceIntervals || [10, 5, 3, 2, 1];

  // Reset timer when duration changes
  useEffect(() => {
    setRemaining(duration);
    setIsRunning(autoStart);
  }, [duration, autoStart]);

  // Timer logic
  useEffect(() => {
    if (!isRunning || remaining <= 0) return;

    const timer = setInterval(() => {
      setRemaining((prev) => {
        const newRemaining = prev - 1;

        // Announce countdown at intervals
        if (
          !isMuted &&
          config?.enabled &&
          config?.voiceAnnouncements &&
          shouldAnnounceInterval(newRemaining, intervals)
        ) {
          announce(newRemaining.toString(), { priority: 'high' });

          // Play sound effect
          if (config?.soundEffects) {
            if (newRemaining === 1) {
              playSound('COUNTDOWN_FINAL');
            } else if (newRemaining <= 5) {
              playSound('COUNTDOWN_TICK');
            }
          }
        }

        // Timer complete
        if (newRemaining <= 0) {
          setIsRunning(false);
          if (onComplete) onComplete();

          // Play completion sound
          if (!isMuted && config?.soundEffects) {
            playSound('REST_END');
          }

          return 0;
        }

        return newRemaining;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, remaining, isMuted, config, intervals, announce, playSound, onComplete]);

  const handlePlayPause = useCallback(() => {
    setIsRunning((prev) => !prev);
  }, []);

  const handleMuteToggle = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((duration - remaining) / duration) * 100;

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Label */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">
            {label}
          </p>
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-bold tabular-nums">
            {formatTime(remaining)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {formatTime(duration)} total
          </p>
        </div>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2" />

        {/* Controls */}
        {showControls && (
          <div className="flex gap-2 justify-center">
            <Button
              size="lg"
              variant="default"
              onClick={handlePlayPause}
              className="flex-1"
            >
              {isRunning ? (
                <>
                  <Pause className="mr-2 h-5 w-5" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="mr-2 h-5 w-5" />
                  {remaining === duration ? 'Start' : 'Resume'}
                </>
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              onClick={handleMuteToggle}
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5" />
              ) : (
                <Volume2 className="h-5 w-5" />
              )}
            </Button>
          </div>
        )}

        {/* Status */}
        <div className="text-center text-sm">
          {remaining <= 0 && (
            <p className="text-green-600 font-semibold">Complete!</p>
          )}
          {isRunning && remaining > 0 && (
            <p className="text-blue-600">Running...</p>
          )}
          {!isRunning && remaining > 0 && remaining < duration && (
            <p className="text-orange-600">Paused</p>
          )}
        </div>
      </div>
    </Card>
  );
}
