/**
 * AI Preferences Form Component
 * Allows users to save their default AI workout preferences
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Save, Settings } from 'lucide-react';
import { useAIPreferences, useSavePreferences } from '@/hooks/useAIWorkouts';
import { EQUIPMENT_TYPES } from '@/types/workout';
import { AIWorkoutPreferences } from '@/services/ai/workoutGenerator';

const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Strength',
  'Flexibility',
  'General Fitness',
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90] as const;
const DAYS_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export function AIPreferencesForm() {
  const { data: existingPreferences, isLoading: loadingPreferences } = useAIPreferences();
  const savePreferences = useSavePreferences();

  const [formData, setFormData] = useState<Omit<AIWorkoutPreferences, 'user_id'>>({
    fitness_level: 'beginner',
    goals: [],
    available_equipment: [],
    workout_duration_preference: 30,
    days_per_week: 3,
    injuries_limitations: '',
  });

  useEffect(() => {
    if (existingPreferences) {
      setFormData({
        fitness_level: existingPreferences.fitness_level,
        goals: existingPreferences.goals,
        available_equipment: existingPreferences.available_equipment,
        workout_duration_preference: existingPreferences.workout_duration_preference,
        days_per_week: existingPreferences.days_per_week,
        injuries_limitations: existingPreferences.injuries_limitations || '',
      });
    }
  }, [existingPreferences]);

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await savePreferences.mutateAsync(formData);
  };

  if (loadingPreferences) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Workout Preferences
          </CardTitle>
          <CardDescription>
            Set your default preferences for quick AI workout generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Fitness Level */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Fitness Level</Label>
            <RadioGroup
              value={formData.fitness_level}
              onValueChange={(value) => setFormData(prev => ({ ...prev, fitness_level: value as any }))}
            >
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="beginner" id="pref-beginner" />
                <Label htmlFor="pref-beginner" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Beginner</div>
                  <div className="text-sm text-gray-500">New to working out</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="intermediate" id="pref-intermediate" />
                <Label htmlFor="pref-intermediate" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Intermediate</div>
                  <div className="text-sm text-gray-500">Regular exercise routine</div>
                </Label>
              </div>
              <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="advanced" id="pref-advanced" />
                <Label htmlFor="pref-advanced" className="flex-1 cursor-pointer">
                  <div className="font-semibold">Advanced</div>
                  <div className="text-sm text-gray-500">Experienced athlete</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Goals */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Fitness Goals</Label>
            <div className="grid grid-cols-2 gap-3">
              {FITNESS_GOALS.map(goal => (
                <div
                  key={goal}
                  className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    formData.goals.includes(goal) ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, goals: toggleArrayItem(prev.goals, goal) }))}
                >
                  <Checkbox
                    checked={formData.goals.includes(goal)}
                    onCheckedChange={() => setFormData(prev => ({ ...prev, goals: toggleArrayItem(prev.goals, goal) }))}
                  />
                  <Label className="flex-1 cursor-pointer">{goal}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Available Equipment</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto">
              {EQUIPMENT_TYPES.map(equipment => (
                <div
                  key={equipment}
                  className={`flex items-center space-x-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                    formData.available_equipment.includes(equipment) ? 'border-blue-500 bg-blue-50' : ''
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, available_equipment: toggleArrayItem(prev.available_equipment, equipment) }))}
                >
                  <Checkbox
                    checked={formData.available_equipment.includes(equipment)}
                    onCheckedChange={() => setFormData(prev => ({ ...prev, available_equipment: toggleArrayItem(prev.available_equipment, equipment) }))}
                  />
                  <Label className="flex-1 cursor-pointer text-sm">{equipment}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Preferred Workout Duration</Label>
            <div className="flex gap-2 flex-wrap">
              {DURATION_OPTIONS.map(duration => (
                <Button
                  key={duration}
                  type="button"
                  variant={formData.workout_duration_preference === duration ? 'default' : 'outline'}
                  onClick={() => setFormData(prev => ({ ...prev, workout_duration_preference: duration }))}
                >
                  {duration} min
                </Button>
              ))}
            </div>
          </div>

          {/* Days Per Week */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Days Per Week</Label>
            <div className="flex gap-2 flex-wrap">
              {DAYS_PER_WEEK_OPTIONS.map(days => (
                <Button
                  key={days}
                  type="button"
                  variant={formData.days_per_week === days ? 'default' : 'outline'}
                  className="w-12"
                  onClick={() => setFormData(prev => ({ ...prev, days_per_week: days }))}
                >
                  {days}
                </Button>
              ))}
            </div>
          </div>

          {/* Injuries/Limitations */}
          <div className="space-y-3">
            <Label htmlFor="pref-injuries">Injuries or Physical Limitations</Label>
            <Textarea
              id="pref-injuries"
              placeholder="Describe any injuries or limitations..."
              value={formData.injuries_limitations || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, injuries_limitations: e.target.value }))}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={savePreferences.isPending || formData.goals.length === 0 || formData.available_equipment.length === 0}
          >
            {savePreferences.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Preferences
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
