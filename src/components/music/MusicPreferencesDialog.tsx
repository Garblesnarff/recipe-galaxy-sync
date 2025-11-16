/**
 * Music Preferences Dialog Component
 * Allows users to configure music preferences
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useMusicPlayer } from '@/hooks/useMusicPlayer';
import { Settings, Volume2, Zap, Music } from 'lucide-react';

const AVAILABLE_GENRES = [
  'work-out',
  'power-workout',
  'edm',
  'rock',
  'hip-hop',
  'pop',
  'electronic',
  'metal',
  'running',
  'dance',
  'chill',
  'ambient',
];

export function MusicPreferencesDialog() {
  const { preferences, updatePreferences, isUpdatingPreferences } =
    useMusicPlayer();

  const [open, setOpen] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [defaultVolume, setDefaultVolume] = useState(70);
  const [fadeInDuration, setFadeInDuration] = useState(3);
  const [energyLevel, setEnergyLevel] = useState<
    'low' | 'medium' | 'high' | 'mixed'
  >('mixed');
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);

  useEffect(() => {
    if (preferences) {
      setAutoPlay(preferences.auto_play_on_workout_start || false);
      setDefaultVolume(preferences.default_volume || 70);
      setFadeInDuration(preferences.fade_in_duration_seconds || 3);
      setEnergyLevel(preferences.energy_level_preference || 'mixed');
      setSelectedGenres(preferences.preferred_genres || []);
    }
  }, [preferences]);

  const handleSave = () => {
    updatePreferences({
      auto_play_on_workout_start: autoPlay,
      default_volume: defaultVolume,
      fade_in_duration_seconds: fadeInDuration,
      energy_level_preference: energyLevel,
      preferred_genres: selectedGenres,
    });
    setOpen(false);
  };

  const toggleGenre = (genre: string) => {
    if (selectedGenres.includes(genre)) {
      setSelectedGenres(selectedGenres.filter((g) => g !== genre));
    } else {
      setSelectedGenres([...selectedGenres, genre]);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Settings className="h-4 w-4 mr-2" />
          Music Preferences
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Music Preferences</DialogTitle>
          <DialogDescription>
            Customize how music plays during your workouts
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Auto-play */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-play" className="text-base">
                Auto-play on workout start
              </Label>
              <p className="text-sm text-gray-500">
                Automatically start music when you begin a workout
              </p>
            </div>
            <Switch
              id="auto-play"
              checked={autoPlay}
              onCheckedChange={setAutoPlay}
            />
          </div>

          {/* Default Volume */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base flex items-center">
                <Volume2 className="h-4 w-4 mr-2" />
                Default Volume
              </Label>
              <span className="text-sm text-gray-600">{defaultVolume}%</span>
            </div>
            <Slider
              value={[defaultVolume]}
              onValueChange={(value) => setDefaultVolume(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>

          {/* Fade-in Duration */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Fade-in Duration</Label>
              <span className="text-sm text-gray-600">
                {fadeInDuration}s
              </span>
            </div>
            <Slider
              value={[fadeInDuration]}
              onValueChange={(value) => setFadeInDuration(value[0])}
              max={10}
              step={1}
              className="w-full"
            />
            <p className="text-xs text-gray-500">
              Gradually increase volume when starting playback
            </p>
          </div>

          {/* Energy Level Preference */}
          <div className="space-y-3">
            <Label className="text-base flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              Energy Level Preference
            </Label>
            <Select value={energyLevel} onValueChange={(value: any) => setEnergyLevel(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                    Low - Calm & Relaxing
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2" />
                    Medium - Moderate Intensity
                  </div>
                </SelectItem>
                <SelectItem value="high">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-red-500 mr-2" />
                    High - Intense & Energetic
                  </div>
                </SelectItem>
                <SelectItem value="mixed">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                    Mixed - Variety
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preferred Genres */}
          <div className="space-y-3">
            <Label className="text-base flex items-center">
              <Music className="h-4 w-4 mr-2" />
              Preferred Genres
            </Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_GENRES.map((genre) => (
                <Badge
                  key={genre}
                  variant={
                    selectedGenres.includes(genre) ? 'default' : 'outline'
                  }
                  className="cursor-pointer"
                  onClick={() => toggleGenre(genre)}
                >
                  {genre}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Select your favorite music genres for workouts
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={isUpdatingPreferences}
            className="bg-green-600 hover:bg-green-700"
          >
            {isUpdatingPreferences ? 'Saving...' : 'Save Preferences'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
