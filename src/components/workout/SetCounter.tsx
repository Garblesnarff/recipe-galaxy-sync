import { useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle } from 'lucide-react';
import { useAudio } from '@/hooks/useAudio';

export interface SetCounterProps {
  currentSet: number;
  totalSets: number;
  onSetComplete?: (setNumber: number) => void;
  exerciseName?: string;
  reps?: number;
  weight?: number;
}

export function SetCounter({
  currentSet,
  totalSets,
  onSetComplete,
  exerciseName,
  reps,
  weight,
}: SetCounterProps) {
  const { config, announce, playSound } = useAudio();

  // Announce set completion
  const handleSetComplete = (setNumber: number) => {
    if (config?.enabled && config?.announceSetCompletions) {
      // Determine announcement
      let announcement = '';
      if (setNumber === totalSets) {
        announcement = 'Final set complete! Great work!';
      } else {
        const encouragements = ['Great set!', 'Nice work!', 'Keep it up!', 'Excellent!'];
        announcement = encouragements[Math.floor(Math.random() * encouragements.length)];
      }

      announce(announcement, { priority: 'low' });

      if (config?.soundEffects) {
        playSound('SET_COMPLETE');
      }
    }

    if (onSetComplete) {
      onSetComplete(setNumber);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Exercise Info */}
        {exerciseName && (
          <div className="text-center">
            <h3 className="text-lg font-semibold">{exerciseName}</h3>
            {(reps || weight) && (
              <p className="text-sm text-muted-foreground">
                {reps && `${reps} reps`}
                {reps && weight && ' @ '}
                {weight && `${weight}kg`}
              </p>
            )}
          </div>
        )}

        {/* Set Counter Display */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            Set Progress
          </p>
          <div className="text-4xl font-bold">
            {currentSet} / {totalSets}
          </div>
        </div>

        {/* Visual Set Indicators */}
        <div className="flex justify-center gap-2 flex-wrap">
          {Array.from({ length: totalSets }, (_, i) => i + 1).map((setNum) => (
            <div
              key={setNum}
              className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all ${
                setNum < currentSet
                  ? 'bg-green-500 border-green-500 text-white'
                  : setNum === currentSet
                  ? 'bg-primary border-primary text-white scale-110'
                  : 'bg-background border-muted-foreground/30 text-muted-foreground'
              }`}
            >
              {setNum < currentSet ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : setNum === currentSet ? (
                <Circle className="h-6 w-6 animate-pulse" />
              ) : (
                <span className="text-sm font-semibold">{setNum}</span>
              )}
            </div>
          ))}
        </div>

        {/* Complete Set Button */}
        {currentSet <= totalSets && (
          <Button
            onClick={() => handleSetComplete(currentSet)}
            className="w-full"
            size="lg"
            variant={currentSet === totalSets ? 'default' : 'outline'}
          >
            <CheckCircle2 className="mr-2 h-5 w-5" />
            {currentSet === totalSets ? 'Complete Final Set' : `Complete Set ${currentSet}`}
          </Button>
        )}

        {/* Status Message */}
        {currentSet > totalSets && (
          <div className="text-center text-green-600 font-semibold">
            All sets completed!
          </div>
        )}
        {currentSet === totalSets && (
          <div className="text-center text-orange-600 text-sm">
            Final set - give it your all!
          </div>
        )}
      </div>
    </Card>
  );
}
