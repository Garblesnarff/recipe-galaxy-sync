import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { VoiceTestButton } from './VoiceTestButton';
import { useAudio } from '@/hooks/useAudio';
import { AudioConfig } from '@/config/audio';
import { Save, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function AudioSettings() {
  const { config, updateConfig, saveConfig, testAudio, isInitialized } = useAudio();
  const { toast } = useToast();
  const [localConfig, setLocalConfig] = useState<AudioConfig | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize local config when global config is ready
  useEffect(() => {
    if (config) {
      setLocalConfig(config);
    }
  }, [config]);

  if (!isInitialized || !localConfig) {
    return <div>Loading audio settings...</div>;
  }

  const handleConfigChange = (key: keyof AudioConfig, value: any) => {
    setLocalConfig(prev => prev ? { ...prev, [key]: value } : null);
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (localConfig) {
      updateConfig(localConfig);
      await saveConfig();
      setHasChanges(false);
      toast({
        title: 'Settings saved',
        description: 'Your audio preferences have been saved.',
      });
    }
  };

  const handleReset = () => {
    if (config) {
      setLocalConfig(config);
      setHasChanges(false);
    }
  };

  const handleIntervalToggle = (interval: number) => {
    const currentIntervals = localConfig.announceIntervals;
    const newIntervals = currentIntervals.includes(interval)
      ? currentIntervals.filter(i => i !== interval)
      : [...currentIntervals, interval].sort((a, b) => b - a);

    handleConfigChange('announceIntervals', newIntervals);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Audio Settings</CardTitle>
          <CardDescription>
            Customize voice announcements and sound effects for your workouts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Audio */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="audio-enabled">Enable Audio</Label>
              <p className="text-sm text-muted-foreground">
                Turn all audio features on or off
              </p>
            </div>
            <Switch
              id="audio-enabled"
              checked={localConfig.enabled}
              onCheckedChange={(checked) => handleConfigChange('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Voice Announcements */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="voice-announcements">Voice Announcements</Label>
                <p className="text-sm text-muted-foreground">
                  Spoken guidance during workouts
                </p>
              </div>
              <Switch
                id="voice-announcements"
                checked={localConfig.voiceAnnouncements}
                onCheckedChange={(checked) => handleConfigChange('voiceAnnouncements', checked)}
                disabled={!localConfig.enabled}
              />
            </div>

            {localConfig.voiceAnnouncements && (
              <>
                {/* Voice Selection */}
                <div className="space-y-2">
                  <Label>Voice Type</Label>
                  <Select
                    value={localConfig.voice}
                    onValueChange={(value) => handleConfigChange('voice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">System Default</SelectItem>
                      <SelectItem value="male">Male Voice</SelectItem>
                      <SelectItem value="female">Female Voice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Voice Speed */}
                <div className="space-y-2">
                  <Label>Voice Speed: {localConfig.voiceSpeed.toFixed(1)}x</Label>
                  <Slider
                    value={[localConfig.voiceSpeed]}
                    onValueChange={([value]) => handleConfigChange('voiceSpeed', value)}
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Adjust how fast the voice speaks
                  </p>
                </div>

                {/* Test Voice Button */}
                <VoiceTestButton className="w-full" />
              </>
            )}
          </div>

          <Separator />

          {/* Sound Effects */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="sound-effects">Sound Effects</Label>
              <p className="text-sm text-muted-foreground">
                Audio cues for workout events
              </p>
            </div>
            <Switch
              id="sound-effects"
              checked={localConfig.soundEffects}
              onCheckedChange={(checked) => handleConfigChange('soundEffects', checked)}
              disabled={!localConfig.enabled}
            />
          </div>

          <Separator />

          {/* Volume */}
          <div className="space-y-2">
            <Label>Volume: {localConfig.volume}%</Label>
            <Slider
              value={[localConfig.volume]}
              onValueChange={([value]) => handleConfigChange('volume', value)}
              min={0}
              max={100}
              step={5}
              className="w-full"
              disabled={!localConfig.enabled}
            />
          </div>

          <Separator />

          {/* Announcement Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Announcement Settings</h3>

            {/* Countdown Intervals */}
            <div className="space-y-2">
              <Label>Rest Timer Countdown</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Select when to announce remaining time
              </p>
              <div className="flex flex-wrap gap-2">
                {[30, 10, 5, 3, 2, 1].map((interval) => (
                  <Button
                    key={interval}
                    variant={localConfig.announceIntervals.includes(interval) ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleIntervalToggle(interval)}
                    disabled={!localConfig.enabled}
                  >
                    {interval}s
                  </Button>
                ))}
              </div>
            </div>

            {/* Set Completions */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="announce-sets">Announce Set Completions</Label>
                <p className="text-sm text-muted-foreground">
                  Get feedback after each set
                </p>
              </div>
              <Switch
                id="announce-sets"
                checked={localConfig.announceSetCompletions}
                onCheckedChange={(checked) => handleConfigChange('announceSetCompletions', checked)}
                disabled={!localConfig.enabled}
              />
            </div>

            {/* Rest Periods */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="announce-rest">Announce Rest Periods</Label>
                <p className="text-sm text-muted-foreground">
                  Guidance during rest intervals
                </p>
              </div>
              <Switch
                id="announce-rest"
                checked={localConfig.announceRestPeriods}
                onCheckedChange={(checked) => handleConfigChange('announceRestPeriods', checked)}
                disabled={!localConfig.enabled}
              />
            </div>

            {/* Workout Phases */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="announce-phases">Announce Workout Phases</Label>
                <p className="text-sm text-muted-foreground">
                  Start and completion announcements
                </p>
              </div>
              <Switch
                id="announce-phases"
                checked={localConfig.announceWorkoutPhases}
                onCheckedChange={(checked) => handleConfigChange('announceWorkoutPhases', checked)}
                disabled={!localConfig.enabled}
              />
            </div>
          </div>

          <Separator />

          {/* Music Ducking */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="music-ducking">Music Ducking</Label>
                <p className="text-sm text-muted-foreground">
                  Lower music volume during announcements
                </p>
              </div>
              <Switch
                id="music-ducking"
                checked={localConfig.musicDucking}
                onCheckedChange={(checked) => handleConfigChange('musicDucking', checked)}
                disabled={!localConfig.enabled}
              />
            </div>

            {localConfig.musicDucking && (
              <div className="space-y-2">
                <Label>Ducking Level: {localConfig.duckingLevel}%</Label>
                <Slider
                  value={[localConfig.duckingLevel]}
                  onValueChange={([value]) => handleConfigChange('duckingLevel', value)}
                  min={0}
                  max={100}
                  step={10}
                  className="w-full"
                />
                <p className="text-xs text-muted-foreground">
                  How much to reduce music volume
                </p>
              </div>
            )}
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              disabled={!hasChanges}
              className="flex-1"
            >
              <Save className="mr-2 h-4 w-4" />
              Save Settings
            </Button>
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
          </div>

          {/* Test Audio */}
          <Button
            variant="secondary"
            onClick={testAudio}
            className="w-full"
            disabled={!localConfig.enabled}
          >
            Test Audio Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
