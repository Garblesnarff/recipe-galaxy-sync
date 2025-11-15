import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import type { Challenge } from "@/services/social/challenges";

interface CreateChallengeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateChallenge: (data: {
    title: string;
    description?: string;
    challenge_type: Challenge['challenge_type'];
    goal_value: number;
    start_date: string;
    end_date: string;
    exercise_name?: string;
    image_url?: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

const CreateChallengeDialog = ({
  open,
  onOpenChange,
  onCreateChallenge,
  isLoading = false
}: CreateChallengeDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [challengeType, setChallengeType] = useState<Challenge['challenge_type']>('workout_count');
  const [goalValue, setGoalValue] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [exerciseName, setExerciseName] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title || !goalValue || !startDate || !endDate) {
      return;
    }

    if (challengeType === 'specific_exercise' && !exerciseName) {
      return;
    }

    try {
      await onCreateChallenge({
        title,
        description: description || undefined,
        challenge_type: challengeType,
        goal_value: parseInt(goalValue),
        start_date: format(startDate, 'yyyy-MM-dd'),
        end_date: format(endDate, 'yyyy-MM-dd'),
        exercise_name: challengeType === 'specific_exercise' ? exerciseName : undefined,
        image_url: imageUrl || undefined
      });

      // Reset form
      setTitle("");
      setDescription("");
      setChallengeType('workout_count');
      setGoalValue("");
      setStartDate(undefined);
      setEndDate(undefined);
      setExerciseName("");
      setImageUrl("");
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  const getChallengeTypeLabel = (type: Challenge['challenge_type']) => {
    switch (type) {
      case 'workout_count':
        return 'Workout Count';
      case 'total_volume':
        return 'Total Volume (kg)';
      case 'total_calories':
        return 'Total Calories';
      case 'streak':
        return 'Workout Streak (days)';
      case 'specific_exercise':
        return 'Specific Exercise (reps)';
      default:
        return type;
    }
  };

  const getGoalPlaceholder = () => {
    switch (challengeType) {
      case 'workout_count':
        return 'e.g., 30';
      case 'total_volume':
        return 'e.g., 50000';
      case 'total_calories':
        return 'e.g., 10000';
      case 'streak':
        return 'e.g., 7';
      case 'specific_exercise':
        return 'e.g., 100';
      default:
        return '';
    }
  };

  const getGoalLabel = () => {
    switch (challengeType) {
      case 'workout_count':
        return 'Number of Workouts';
      case 'total_volume':
        return 'Total Volume (kg)';
      case 'total_calories':
        return 'Total Calories';
      case 'streak':
        return 'Streak Length (days)';
      case 'specific_exercise':
        return 'Total Reps';
      default:
        return 'Goal Value';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Custom Challenge</DialogTitle>
          <DialogDescription>
            Create your own fitness challenge and invite others to join you!
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              placeholder="e.g., 30 Days of Yoga"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe your challenge and motivate others to join..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          {/* Challenge Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Challenge Type *</Label>
            <Select value={challengeType} onValueChange={(v) => setChallengeType(v as Challenge['challenge_type'])}>
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="workout_count">
                  Workout Count - Track total number of workouts
                </SelectItem>
                <SelectItem value="total_volume">
                  Total Volume - Track cumulative weight lifted
                </SelectItem>
                <SelectItem value="total_calories">
                  Total Calories - Track total calories burned
                </SelectItem>
                <SelectItem value="streak">
                  Workout Streak - Track consecutive workout days
                </SelectItem>
                <SelectItem value="specific_exercise">
                  Specific Exercise - Track reps of a specific exercise
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Exercise Name (for specific_exercise type) */}
          {challengeType === 'specific_exercise' && (
            <div className="space-y-2">
              <Label htmlFor="exercise">Exercise Name *</Label>
              <Input
                id="exercise"
                placeholder="e.g., Push-ups"
                value={exerciseName}
                onChange={(e) => setExerciseName(e.target.value)}
                required
              />
            </div>
          )}

          {/* Goal Value */}
          <div className="space-y-2">
            <Label htmlFor="goal">{getGoalLabel()} *</Label>
            <Input
              id="goal"
              type="number"
              min="1"
              placeholder={getGoalPlaceholder()}
              value={goalValue}
              onChange={(e) => setGoalValue(e.target.value)}
              required
            />
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    disabled={(date) => startDate ? date < startDate : false}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Image URL */}
          <div className="space-y-2">
            <Label htmlFor="image">Image URL (optional)</Label>
            <Input
              id="image"
              type="url"
              placeholder="https://example.com/image.jpg"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !title || !goalValue || !startDate || !endDate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? "Creating..." : "Create Challenge"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { CreateChallengeDialog };
