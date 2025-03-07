
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RecipeFormData } from "@/types/recipe";

interface RecipeDetailsProps {
  formData: RecipeFormData;
  onChange: (field: keyof RecipeFormData, value: string) => void;
}

export const RecipeDetails = ({ formData, onChange }: RecipeDetailsProps) => {
  return (
    <>
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          required
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
          value={formData.description}
          onChange={e => onChange('description', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="cookTime">Cook Time</Label>
          <Input
            id="cookTime"
            placeholder="e.g., 30 mins"
            value={formData.cookTime}
            onChange={e => onChange('cookTime', e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="difficulty">Difficulty</Label>
          <select
            id="difficulty"
            className="w-full rounded-md border border-input px-3 py-2"
            value={formData.difficulty}
            onChange={e => onChange('difficulty', e.target.value)}
          >
            <option>Easy</option>
            <option>Medium</option>
            <option>Hard</option>
          </select>
        </div>
      </div>
    </>
  );
};
