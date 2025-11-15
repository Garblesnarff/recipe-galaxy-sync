import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { WorkoutFormData, DIFFICULTY_LEVELS, WORKOUT_TYPES } from "@/types/workout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface WorkoutDetailsProps {
  formData: WorkoutFormData;
  onChange: (field: keyof WorkoutFormData, value: string | number) => void;
}

export const WorkoutDetails = ({ formData, onChange }: WorkoutDetailsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Workout Title</Label>
        <Input
          id="title"
          required
          placeholder="e.g., Full Body Strength"
          value={formData.title}
          onChange={e => onChange('title', e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <textarea
          id="description"
          required
          className="w-full min-h-[100px] rounded-md border border-input px-3 py-2"
          placeholder="Describe your workout..."
          value={formData.description}
          onChange={e => onChange('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input
            id="duration_minutes"
            type="number"
            min="1"
            placeholder="e.g., 45"
            value={formData.duration_minutes || ''}
            onChange={e => onChange('duration_minutes', parseInt(e.target.value) || 0)}
          />
        </div>

        <div>
          <Label htmlFor="calories_estimate">Estimated Calories</Label>
          <Input
            id="calories_estimate"
            type="number"
            min="0"
            placeholder="e.g., 300"
            value={formData.calories_estimate || ''}
            onChange={e => onChange('calories_estimate', parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <Select
            value={formData.difficulty}
            onValueChange={(value) => onChange('difficulty', value)}
          >
            <SelectTrigger id="difficulty">
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              {DIFFICULTY_LEVELS.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="workout_type">Workout Type</Label>
          <Select
            value={formData.workout_type}
            onValueChange={(value) => onChange('workout_type', value)}
          >
            <SelectTrigger id="workout_type">
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </>
  );
};
