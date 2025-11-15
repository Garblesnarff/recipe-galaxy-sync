import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Loader2 } from "lucide-react";
import {
  Exercise,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  DIFFICULTY_LEVELS,
} from "@/types/workout";
import { validateYouTubeUrl, getYouTubeThumbnail, extractYouTubeId } from "@/utils/youtube";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ExerciseFormProps {
  onSubmit: (data: Partial<Exercise>) => void;
  isSubmitting?: boolean;
  initialData?: Partial<Exercise>;
}

export const ExerciseForm = ({
  onSubmit,
  isSubmitting = false,
  initialData,
}: ExerciseFormProps) => {
  const [formData, setFormData] = useState<Partial<Exercise>>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    category: initialData?.category || "Strength",
    difficulty: initialData?.difficulty || "Beginner",
    muscle_groups: initialData?.muscle_groups || [],
    equipment: initialData?.equipment || [],
    video_url: initialData?.video_url || "",
    instructions: initialData?.instructions || "",
  });

  const [videoUrlError, setVideoUrlError] = useState<string>("");
  const [showThumbnail, setShowThumbnail] = useState(false);

  const handleInputChange = (field: keyof Exercise, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Validate YouTube URL when video_url changes
    if (field === "video_url") {
      if (value) {
        const validation = validateYouTubeUrl(value);
        if (validation.valid) {
          setVideoUrlError("");
          setShowThumbnail(true);
        } else {
          setVideoUrlError(validation.error || "Invalid YouTube URL");
          setShowThumbnail(false);
        }
      } else {
        setVideoUrlError("");
        setShowThumbnail(false);
      }
    }
  };

  const toggleArrayItem = (field: "muscle_groups" | "equipment", item: string) => {
    const currentArray = formData[field] || [];
    const newArray = currentArray.includes(item)
      ? currentArray.filter((i) => i !== item)
      : [...currentArray, item];
    setFormData((prev) => ({ ...prev, [field]: newArray }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate video URL if provided
    if (formData.video_url) {
      const validation = validateYouTubeUrl(formData.video_url);
      if (!validation.valid) {
        setVideoUrlError(validation.error || "Invalid YouTube URL");
        return;
      }
    }

    onSubmit(formData);
  };

  const videoId = formData.video_url ? extractYouTubeId(formData.video_url) : null;
  const thumbnailUrl = videoId ? getYouTubeThumbnail(videoId, "hq") : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Exercise Name */}
      <div>
        <Label htmlFor="name">Exercise Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="e.g., Bench Press"
          required
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category *</Label>
        <Select
          value={formData.category}
          onValueChange={(value) => handleInputChange("category", value)}
        >
          <SelectTrigger id="category">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            {EXERCISE_CATEGORIES.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Difficulty */}
      <div>
        <Label htmlFor="difficulty">Difficulty</Label>
        <Select
          value={formData.difficulty}
          onValueChange={(value) => handleInputChange("difficulty", value)}
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

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Brief description of the exercise"
          rows={3}
        />
      </div>

      {/* Video URL */}
      <div>
        <Label htmlFor="video_url">Video URL (Optional)</Label>
        <Input
          id="video_url"
          value={formData.video_url}
          onChange={(e) => handleInputChange("video_url", e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          type="url"
        />
        {videoUrlError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription>{videoUrlError}</AlertDescription>
          </Alert>
        )}
        {showThumbnail && thumbnailUrl && (
          <div className="mt-2">
            <img
              src={thumbnailUrl}
              alt="Video thumbnail"
              className="w-full max-w-xs rounded-lg border"
            />
          </div>
        )}
      </div>

      {/* Muscle Groups */}
      <div>
        <Label>Target Muscle Groups</Label>
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {MUSCLE_GROUPS.map((muscle) => (
              <div
                key={muscle}
                onClick={() => toggleArrayItem("muscle_groups", muscle)}
                className={`cursor-pointer text-sm px-3 py-2 rounded-md transition-colors ${
                  formData.muscle_groups?.includes(muscle)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {muscle}
              </div>
            ))}
          </div>
        </div>
        {formData.muscle_groups && formData.muscle_groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.muscle_groups.map((muscle) => (
              <Badge key={muscle} variant="secondary" className="flex items-center gap-1">
                {muscle}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleArrayItem("muscle_groups", muscle)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Equipment */}
      <div>
        <Label>Equipment Needed</Label>
        <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
          <div className="grid grid-cols-2 gap-2">
            {EQUIPMENT_TYPES.map((equip) => (
              <div
                key={equip}
                onClick={() => toggleArrayItem("equipment", equip)}
                className={`cursor-pointer text-sm px-3 py-2 rounded-md transition-colors ${
                  formData.equipment?.includes(equip)
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 hover:bg-gray-200"
                }`}
              >
                {equip}
              </div>
            ))}
          </div>
        </div>
        {formData.equipment && formData.equipment.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {formData.equipment.map((equip) => (
              <Badge key={equip} variant="secondary" className="flex items-center gap-1">
                {equip}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => toggleArrayItem("equipment", equip)}
                />
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Instructions */}
      <div>
        <Label htmlFor="instructions">Instructions (Optional)</Label>
        <Textarea
          id="instructions"
          value={formData.instructions}
          onChange={(e) => handleInputChange("instructions", e.target.value)}
          placeholder="Step-by-step instructions for performing the exercise"
          rows={5}
        />
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating...
          </>
        ) : (
          "Create Exercise"
        )}
      </Button>
    </form>
  );
};
