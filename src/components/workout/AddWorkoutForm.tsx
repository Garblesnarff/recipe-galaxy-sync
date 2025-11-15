import { Button } from "@/components/ui/button";
import { WorkoutDetails } from "./WorkoutDetails";
import { WorkoutExercisesList } from "./WorkoutExercisesList";
import { WorkoutFormData, WorkoutExercise, MUSCLE_GROUPS, EQUIPMENT_TYPES } from "@/types/workout";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface AddWorkoutFormProps {
  formData: WorkoutFormData;
  setFormData: (updater: (prev: WorkoutFormData) => WorkoutFormData) => void;
  exercises: WorkoutExercise[];
  onAddExercise: () => void;
  onEditExercise: (exercise: WorkoutExercise, index: number) => void;
  onRemoveExercise: (index: number) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
}

export const AddWorkoutForm = ({
  formData,
  setFormData,
  exercises,
  onAddExercise,
  onEditExercise,
  onRemoveExercise,
  isSubmitting,
  handleSubmit,
}: AddWorkoutFormProps) => {
  const handleFieldChange = (field: keyof WorkoutFormData, value: string | number | string[] | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleMuscleGroup = (muscle: string) => {
    const current = formData.target_muscle_groups;
    const updated = current.includes(muscle)
      ? current.filter(m => m !== muscle)
      : [...current, muscle];
    handleFieldChange('target_muscle_groups', updated);
  };

  const toggleEquipment = (equipment: string) => {
    const current = formData.equipment_needed;
    const updated = current.includes(equipment)
      ? current.filter(e => e !== equipment)
      : [...current, equipment];
    handleFieldChange('equipment_needed', updated);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" data-testid="add-workout-form">
      <WorkoutDetails
        formData={formData}
        onChange={handleFieldChange}
      />

      <div>
        <Label htmlFor="image_url">Image URL (Optional)</Label>
        <Input
          id="image_url"
          type="url"
          placeholder="https://example.com/workout-image.jpg"
          value={formData.image_url}
          onChange={e => handleFieldChange('image_url', e.target.value)}
        />
      </div>

      {/* Muscle Groups */}
      <div className="space-y-2">
        <Label>Target Muscle Groups</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.target_muscle_groups.map(muscle => (
            <Badge key={muscle} variant="secondary" className="flex items-center gap-1">
              {muscle}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleMuscleGroup(muscle)}
              />
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
          {MUSCLE_GROUPS.map(muscle => (
            <div key={muscle} className="flex items-center space-x-2">
              <Checkbox
                id={`muscle-${muscle}`}
                checked={formData.target_muscle_groups.includes(muscle)}
                onCheckedChange={() => toggleMuscleGroup(muscle)}
              />
              <label
                htmlFor={`muscle-${muscle}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {muscle}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Equipment */}
      <div className="space-y-2">
        <Label>Equipment Needed</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.equipment_needed.map(equip => (
            <Badge key={equip} variant="secondary" className="flex items-center gap-1">
              {equip}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => toggleEquipment(equip)}
              />
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 border rounded-md p-3 max-h-40 overflow-y-auto">
          {EQUIPMENT_TYPES.map(equip => (
            <div key={equip} className="flex items-center space-x-2">
              <Checkbox
                id={`equip-${equip}`}
                checked={formData.equipment_needed.includes(equip)}
                onCheckedChange={() => toggleEquipment(equip)}
              />
              <label
                htmlFor={`equip-${equip}`}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {equip}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Template Toggle */}
      <div className="flex items-center space-x-2 p-4 bg-blue-50 rounded-md">
        <Checkbox
          id="is_template"
          checked={formData.is_template}
          onCheckedChange={(checked) => handleFieldChange('is_template', checked === true)}
        />
        <div className="flex-1">
          <Label htmlFor="is_template" className="font-medium cursor-pointer">
            Save as Template
          </Label>
          <p className="text-xs text-gray-600">
            Templates can be reused to quickly create new workout instances
          </p>
        </div>
      </div>

      <WorkoutExercisesList
        exercises={exercises}
        onEdit={onEditExercise}
        onDelete={onRemoveExercise}
        onAdd={onAddExercise}
        isDraggable={true}
        showAddButton={true}
      />

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Creating Workout..." : "Create Workout"}
      </Button>
    </form>
  );
};
