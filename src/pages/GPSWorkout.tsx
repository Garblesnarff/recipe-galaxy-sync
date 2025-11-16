/**
 * GPSWorkout Page
 * Main GPS tracking interface for outdoor workouts
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '@/components/layout/MainNav';
import { LiveGPSTracker } from '@/components/gps/LiveGPSTracker';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Play, AlertCircle, MapPin, Loader2 } from 'lucide-react';
import { useGPSTracking, useGPSPermissions } from '@/hooks/useGPSTracking';
import { toast } from 'sonner';

const WORKOUT_TYPES = [
  { value: 'running', label: 'Running', icon: '🏃' },
  { value: 'walking', label: 'Walking', icon: '🚶' },
  { value: 'cycling', label: 'Cycling', icon: '🚴' },
  { value: 'hiking', label: 'Hiking', icon: '🥾' },
];

export default function GPSWorkout() {
  const navigate = useNavigate();
  const { permissionState, requestPermission } = useGPSPermissions();
  const { session, isTracking, startTracking, saveWorkout, isLoading } = useGPSTracking();

  const [selectedWorkoutType, setSelectedWorkoutType] = useState('running');
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completedSessionId, setCompletedSessionId] = useState<string | null>(null);
  const [workoutNotes, setWorkoutNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleRequestPermission = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success('Location permission granted');
    } else {
      toast.error('Location permission denied. Please enable location in browser settings.');
    }
  };

  const handleStartWorkout = async () => {
    try {
      await startTracking();
      toast.success('GPS tracking started');
    } catch (error) {
      toast.error('Failed to start GPS tracking. Please check location permissions.');
      console.error('Error starting workout:', error);
    }
  };

  const handleWorkoutComplete = (sessionId: string) => {
    setCompletedSessionId(sessionId);
    setShowCompleteDialog(true);
  };

  const handleSaveWorkout = async () => {
    if (!completedSessionId) return;

    setIsSaving(true);
    try {
      const workoutLogId = await saveWorkout(selectedWorkoutType, workoutNotes);
      toast.success('Workout saved successfully!');
      setShowCompleteDialog(false);
      navigate(`/workouts/${workoutLogId}`);
    } catch (error) {
      toast.error('Failed to save workout');
      console.error('Error saving workout:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscardWorkout = () => {
    setShowCompleteDialog(false);
    setCompletedSessionId(null);
    setWorkoutNotes('');
    navigate('/workouts');
  };

  // Permission denied state
  if (permissionState === 'denied') {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Location permission is required for GPS tracking. Please enable location access in
              your browser settings and refresh the page.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  // Unsupported state
  if (permissionState === 'unsupported') {
    return (
      <>
        <MainNav />
        <div className="container mx-auto px-4 py-8">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              GPS tracking is not supported in your browser. Please use a modern browser that
              supports geolocation.
            </AlertDescription>
          </Alert>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNav />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold mb-2">GPS Workout</h1>
            <p className="text-gray-600">
              Track your outdoor activities with GPS route recording
            </p>
          </div>

          {/* Tracking Interface */}
          {isTracking ? (
            <LiveGPSTracker onComplete={handleWorkoutComplete} />
          ) : (
            <>
              {/* Permission Prompt */}
              {permissionState === 'prompt' && (
                <Alert>
                  <MapPin className="h-4 w-4" />
                  <AlertDescription>
                    This app needs access to your location to track your workout route.
                    <Button
                      variant="link"
                      className="ml-2 p-0 h-auto"
                      onClick={handleRequestPermission}
                    >
                      Grant Permission
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Workout Setup */}
              <Card className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="workout-type">Select Activity Type</Label>
                    <Select value={selectedWorkoutType} onValueChange={setSelectedWorkoutType}>
                      <SelectTrigger id="workout-type" className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {WORKOUT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <span>{type.icon}</span>
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    onClick={handleStartWorkout}
                    size="lg"
                    className="w-full"
                    disabled={permissionState !== 'granted' || isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Start Workout
                      </>
                    )}
                  </Button>

                  <div className="text-sm text-gray-500 space-y-2">
                    <p className="font-medium">Tips for best results:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Ensure you have a clear view of the sky for better GPS accuracy</li>
                      <li>Keep your device charged as GPS tracking uses battery</li>
                      <li>Wait a few seconds after starting for GPS signal to stabilize</li>
                    </ul>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {/* Save Workout Dialog */}
        <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Save Workout</DialogTitle>
              <DialogDescription>
                Add any notes about your workout before saving
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="notes">Workout Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="How did it feel? Any observations?"
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  className="mt-2"
                  rows={4}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleDiscardWorkout} disabled={isSaving}>
                Discard
              </Button>
              <Button onClick={handleSaveWorkout} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Workout'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
