/**
 * Multi-step AI Workout Generator Component
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, ChevronRight, ChevronLeft, Check, Target, Dumbbell, Clock, Zap } from 'lucide-react';
import { useGenerateWorkout } from '@/hooks/useAIWorkouts';
import { useNavigate } from 'react-router-dom';
import { EQUIPMENT_TYPES, MUSCLE_GROUPS } from '@/types/workout';
import { WorkoutGenerationParams } from '@/services/ai/workoutGenerator';

const FITNESS_GOALS = [
  'Weight Loss',
  'Muscle Gain',
  'Endurance',
  'Strength',
  'Flexibility',
  'General Fitness',
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90];
const DAYS_PER_WEEK_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

interface AIWorkoutGeneratorProps {
  onComplete?: (workoutId: string) => void;
}

export function AIWorkoutGenerator({ onComplete }: AIWorkoutGeneratorProps) {
  const navigate = useNavigate();
  const generateWorkout = useGenerateWorkout();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<WorkoutGenerationParams>>({
    fitnessLevel: 'beginner',
    goals: [],
    equipment: [],
    duration: 30,
    targetMuscleGroups: [],
    specialRequests: '',
    injuriesLimitations: '',
  });

  const [generatedWorkout, setGeneratedWorkout] = useState<any>(null);

  const updateFormData = (updates: Partial<WorkoutGenerationParams>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter(i => i !== item)
      : [...array, item];
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.fitnessLevel && formData.goals && formData.goals.length > 0;
      case 2:
        return formData.equipment && formData.equipment.length > 0;
      case 3:
        return formData.duration;
      case 4:
        return true; // Optional step
      default:
        return false;
    }
  };

  const handleGenerate = async () => {
    try {
      const result = await generateWorkout.mutateAsync(formData as Omit<WorkoutGenerationParams, 'userId'>);
      setGeneratedWorkout(result);
      setStep(5);

      if (onComplete) {
        onComplete(result.workoutId);
      }
    } catch (error) {
      console.error('Failed to generate workout:', error);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Fitness Level & Goals</CardTitle>
              <CardDescription>Tell us about your fitness experience and what you want to achieve</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Fitness Level */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">What's your fitness level?</Label>
                <RadioGroup
                  value={formData.fitnessLevel}
                  onValueChange={(value) => updateFormData({ fitnessLevel: value as any })}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="beginner" id="beginner" />
                    <Label htmlFor="beginner" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Beginner</div>
                      <div className="text-sm text-gray-500">New to working out or getting back into it</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="intermediate" id="intermediate" />
                    <Label htmlFor="intermediate" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Intermediate</div>
                      <div className="text-sm text-gray-500">Regular exercise routine, comfortable with various exercises</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50">
                    <RadioGroupItem value="advanced" id="advanced" />
                    <Label htmlFor="advanced" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Advanced</div>
                      <div className="text-sm text-gray-500">Experienced athlete or long-term fitness enthusiast</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Goals */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">What are your goals? (Select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {FITNESS_GOALS.map(goal => (
                    <div
                      key={goal}
                      className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        formData.goals?.includes(goal) ? 'border-blue-500 bg-blue-50' : ''
                      }`}
                      onClick={() => updateFormData({ goals: toggleArrayItem(formData.goals || [], goal) })}
                    >
                      <Checkbox
                        checked={formData.goals?.includes(goal)}
                        onCheckedChange={() => updateFormData({ goals: toggleArrayItem(formData.goals || [], goal) })}
                      />
                      <Label className="flex-1 cursor-pointer">{goal}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 2:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Equipment Availability</CardTitle>
              <CardDescription>Select the equipment you have access to</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {EQUIPMENT_TYPES.slice(0, 15).map(equipment => (
                  <div
                    key={equipment}
                    className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                      formData.equipment?.includes(equipment) ? 'border-blue-500 bg-blue-50' : ''
                    }`}
                    onClick={() => updateFormData({ equipment: toggleArrayItem(formData.equipment || [], equipment) })}
                  >
                    <Checkbox
                      checked={formData.equipment?.includes(equipment)}
                      onCheckedChange={() => updateFormData({ equipment: toggleArrayItem(formData.equipment || [], equipment) })}
                    />
                    <Label className="flex-1 cursor-pointer text-sm">{equipment}</Label>
                  </div>
                ))}
              </div>

              <div className="flex items-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Dumbbell className="h-5 w-5 text-blue-600" />
                <p className="text-sm text-blue-900">
                  Don't see your equipment? No worries! The AI will work with what you've selected.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 3:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Duration & Frequency</CardTitle>
              <CardDescription>How long and how often do you want to work out?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Duration */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Workout Duration</Label>
                <div className="grid grid-cols-5 gap-3">
                  {DURATION_OPTIONS.map(duration => (
                    <Button
                      key={duration}
                      variant={formData.duration === duration ? 'default' : 'outline'}
                      className="h-auto flex-col py-3"
                      onClick={() => updateFormData({ duration })}
                    >
                      <Clock className="h-4 w-4 mb-1" />
                      <span className="font-semibold">{duration}</span>
                      <span className="text-xs">min</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Target Muscle Groups (Optional) */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">Target Muscle Groups (Optional)</Label>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {MUSCLE_GROUPS.slice(0, 12).map(muscle => (
                    <Badge
                      key={muscle}
                      variant={formData.targetMuscleGroups?.includes(muscle) ? 'default' : 'outline'}
                      className="cursor-pointer justify-center py-2"
                      onClick={() => updateFormData({ targetMuscleGroups: toggleArrayItem(formData.targetMuscleGroups || [], muscle) })}
                    >
                      {muscle}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );

      case 4:
        return (
          <Card>
            <CardHeader>
              <CardTitle>Special Requests & Limitations</CardTitle>
              <CardDescription>Any specific needs or restrictions we should know about?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label htmlFor="injuries">Injuries or Physical Limitations</Label>
                <Textarea
                  id="injuries"
                  placeholder="E.g., knee pain, lower back issues, shoulder injury..."
                  value={formData.injuriesLimitations || ''}
                  onChange={(e) => updateFormData({ injuriesLimitations: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="special">Special Requests</Label>
                <Textarea
                  id="special"
                  placeholder="E.g., focus on core, include more cardio, prefer compound movements..."
                  value={formData.specialRequests || ''}
                  onChange={(e) => updateFormData({ specialRequests: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-start space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Target className="h-5 w-5 text-yellow-600 mt-0.5" />
                <p className="text-sm text-yellow-900">
                  The AI will create a safe workout plan based on your limitations. Always consult with a healthcare professional for medical advice.
                </p>
              </div>
            </CardContent>
          </Card>
        );

      case 5:
        return (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-6 w-6 text-green-500" />
                Workout Generated Successfully!
              </CardTitle>
              <CardDescription>Your personalized workout is ready</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {generatedWorkout && (
                <>
                  <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                    <h3 className="text-2xl font-bold mb-2">{generatedWorkout.workoutPlan.title}</h3>
                    <p className="text-gray-700 mb-4">{generatedWorkout.workoutPlan.description}</p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="text-sm text-gray-600">Duration</div>
                          <div className="font-semibold">{generatedWorkout.workoutPlan.estimatedDuration} min</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Zap className="h-5 w-5 text-yellow-600" />
                        <div>
                          <div className="text-sm text-gray-600">Calories</div>
                          <div className="font-semibold">{generatedWorkout.workoutPlan.caloriesEstimate} cal</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dumbbell className="h-5 w-5 text-purple-600" />
                        <div>
                          <div className="text-sm text-gray-600">Type</div>
                          <div className="font-semibold">{generatedWorkout.workoutPlan.workoutType}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Target className="h-5 w-5 text-red-600" />
                        <div>
                          <div className="text-sm text-gray-600">Difficulty</div>
                          <div className="font-semibold capitalize">{generatedWorkout.workoutPlan.difficultyLevel}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">Exercises ({generatedWorkout.workoutPlan.exercises.length})</h4>
                    <div className="space-y-2">
                      {generatedWorkout.workoutPlan.exercises.slice(0, 5).map((exercise: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <div className="font-medium">{exercise.exerciseName}</div>
                            <div className="text-sm text-gray-600">
                              {exercise.sets} sets × {exercise.reps} reps
                            </div>
                          </div>
                          <Badge variant="outline">{exercise.restSeconds}s rest</Badge>
                        </div>
                      ))}
                      {generatedWorkout.workoutPlan.exercises.length > 5 && (
                        <p className="text-sm text-gray-500 text-center py-2">
                          +{generatedWorkout.workoutPlan.exercises.length - 5} more exercises
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      className="flex-1"
                      onClick={() => navigate(`/workouts/${generatedWorkout.workoutId}`)}
                    >
                      View Full Workout
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setStep(1);
                        setGeneratedWorkout(null);
                      }}
                    >
                      Generate Another
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Progress Steps */}
      {step < 5 && (
        <div className="flex items-center justify-between mb-8">
          {[1, 2, 3, 4].map((stepNum) => (
            <div key={stepNum} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step === stepNum
                    ? 'bg-blue-600 text-white'
                    : step > stepNum
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step > stepNum ? <Check className="h-5 w-5" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div
                  className={`w-16 h-1 mx-2 ${
                    step > stepNum ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step Content */}
      {renderStep()}

      {/* Navigation Buttons */}
      {step < 5 && (
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {step < 4 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={generateWorkout.isPending || !canProceed()}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {generateWorkout.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Workout
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
