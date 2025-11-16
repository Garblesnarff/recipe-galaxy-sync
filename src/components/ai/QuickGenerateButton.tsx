/**
 * Quick Generate Button Component
 * One-click workout generation using saved preferences
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { useQuickGenerate } from '@/hooks/useAIWorkouts';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuickGenerateButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export function QuickGenerateButton({
  variant = 'default',
  size = 'default',
  className = ''
}: QuickGenerateButtonProps) {
  const navigate = useNavigate();
  const [showDialog, setShowDialog] = useState(false);
  const { quickGenerate, isLoading, hasPreferences } = useQuickGenerate();

  const handleQuickGenerate = async () => {
    if (!hasPreferences) {
      navigate('/workouts/ai-generate');
      return;
    }

    setShowDialog(true);
  };

  const confirmGenerate = async () => {
    try {
      const result = await quickGenerate();
      setShowDialog(false);
      navigate(`/workouts/${result.workoutId}`);
    } catch (error) {
      console.error('Quick generate failed:', error);
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleQuickGenerate}
        className={className}
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Generate with AI
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              Generate Today's Workout?
            </DialogTitle>
            <DialogDescription>
              We'll create a personalized workout based on your saved preferences.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {hasPreferences ? (
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  This will generate a new workout using:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                  <li>Your fitness level and goals</li>
                  <li>Available equipment</li>
                  <li>Preferred workout duration</li>
                  <li>Any injuries or limitations</li>
                </ul>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Generation typically takes 10-20 seconds. The workout will be automatically saved to your workouts.
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No preferences found. Please set up your preferences first.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmGenerate}
              disabled={isLoading || !hasPreferences}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Now
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
