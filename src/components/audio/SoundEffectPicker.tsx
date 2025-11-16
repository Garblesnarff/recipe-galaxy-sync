import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Upload } from 'lucide-react';
import { SOUND_EFFECTS, SoundEffectKey } from '@/config/audio';
import { useAudio } from '@/hooks/useAudio';
import { Label } from '@/components/ui/label';

export function SoundEffectPicker() {
  const { playSound } = useAudio();
  const [playingSound, setPlayingSound] = useState<string | null>(null);

  const handlePlaySound = async (soundKey: SoundEffectKey) => {
    setPlayingSound(soundKey);
    try {
      await playSound(soundKey);
    } catch (error) {
      console.error('Failed to play sound:', error);
    } finally {
      setTimeout(() => setPlayingSound(null), 1000);
    }
  };

  const soundGroups = {
    'Workout Events': [
      { key: 'WORKOUT_START', label: 'Workout Start', description: 'Played when workout begins' },
      { key: 'WORKOUT_COMPLETE', label: 'Workout Complete', description: 'Played when workout finishes' },
      { key: 'HALFWAY', label: 'Halfway Point', description: 'Played at workout midpoint' },
      { key: 'PR_ACHIEVED', label: 'Personal Record', description: 'Played for new records' },
    ] as const,
    'Exercise Events': [
      { key: 'SET_COMPLETE', label: 'Set Complete', description: 'Played after each set' },
    ] as const,
    'Rest Period': [
      { key: 'REST_START', label: 'Rest Start', description: 'Played when rest begins' },
      { key: 'REST_END', label: 'Rest End', description: 'Played when rest ends' },
      { key: 'COUNTDOWN_TICK', label: 'Countdown Tick', description: 'Played during countdown (3-5s)' },
      { key: 'COUNTDOWN_FINAL', label: 'Final Beep', description: 'Played at 1 second' },
    ] as const,
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sound Effects</CardTitle>
          <CardDescription>
            Preview and manage sound effects for workout events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {Object.entries(soundGroups).map(([groupName, sounds]) => (
            <div key={groupName} className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                {groupName}
              </h3>
              <div className="grid gap-3">
                {sounds.map((sound) => (
                  <div
                    key={sound.key}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <Label className="font-medium">{sound.label}</Label>
                      <p className="text-sm text-muted-foreground">
                        {sound.description}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePlaySound(sound.key)}
                      disabled={playingSound === sound.key}
                    >
                      <Play className={`h-4 w-4 ${playingSound === sound.key ? 'animate-pulse' : ''}`} />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Custom Sound Upload (Future Feature) */}
          <div className="pt-4 border-t">
            <Button variant="outline" className="w-full" disabled>
              <Upload className="mr-2 h-4 w-4" />
              Upload Custom Sound (Coming Soon)
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              Custom sound uploads will be available in a future update
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
