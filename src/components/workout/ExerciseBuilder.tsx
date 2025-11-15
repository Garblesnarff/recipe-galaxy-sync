import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ExerciseFormData } from "@/types/workout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ExerciseBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (exercise: ExerciseFormData) => void;
  initialData?: Partial<ExerciseFormData>;
  exerciseName?: string;
}

export const ExerciseBuilder = ({
  open,
  onOpenChange,
  onSave,
  initialData,
  exerciseName,
}: ExerciseBuilderProps) => {
  const [formData, setFormData] = useState<ExerciseFormData>({
    exercise_name: exerciseName || initialData?.exercise_name || "",
    sets: initialData?.sets || 3,
    reps: initialData?.reps || 10,
    duration_seconds: initialData?.duration_seconds || 0,
    rest_seconds: initialData?.rest_seconds || 60,
    weight_kg: initialData?.weight_kg || 0,
    notes: initialData?.notes || "",
    order_index: initialData?.order_index || 0,
  });

  const [exerciseType, setExerciseType] = useState<"reps" | "time">(
    initialData?.duration_seconds ? "time" : "reps"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onOpenChange(false);
  };

  const updateField = (field: keyof ExerciseFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Exercise Details" : "Add Exercise Details"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="exercise_name">Exercise Name</Label>
              <Input
                id="exercise_name"
                value={formData.exercise_name}
                onChange={(e) => updateField("exercise_name", e.target.value)}
                placeholder="e.g., Barbell Squat"
                required
              />
            </div>

            <Tabs value={exerciseType} onValueChange={(v) => setExerciseType(v as "reps" | "time")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="reps">Sets & Reps</TabsTrigger>
                <TabsTrigger value="time">Time-Based</TabsTrigger>
              </TabsList>

              <TabsContent value="reps" className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="sets">Sets</Label>
                    <Input
                      id="sets"
                      type="number"
                      min="1"
                      value={formData.sets}
                      onChange={(e) => updateField("sets", parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="reps">Reps per Set</Label>
                    <Input
                      id="reps"
                      type="number"
                      min="1"
                      value={formData.reps}
                      onChange={(e) => updateField("reps", parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="weight_kg">Weight (kg)</Label>
                  <Input
                    id="weight_kg"
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.weight_kg}
                    onChange={(e) => updateField("weight_kg", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="time" className="space-y-4 mt-4">
                <div>
                  <Label htmlFor="duration_seconds">Duration (seconds)</Label>
                  <Input
                    id="duration_seconds"
                    type="number"
                    min="1"
                    value={formData.duration_seconds}
                    onChange={(e) => updateField("duration_seconds", parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    For exercises like planks, wall sits, etc.
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="rest_seconds">Rest Between Sets (seconds)</Label>
              <Input
                id="rest_seconds"
                type="number"
                min="0"
                step="5"
                value={formData.rest_seconds}
                onChange={(e) => updateField("rest_seconds", parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 30-60s for endurance, 60-120s for strength
              </p>
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <textarea
                id="notes"
                className="w-full min-h-[80px] rounded-md border border-input px-3 py-2"
                value={formData.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Add any specific form cues, modifications, or reminders..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              {initialData ? "Update Exercise" : "Add Exercise"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
