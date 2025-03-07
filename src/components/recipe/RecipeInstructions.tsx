
import { Label } from "@/components/ui/label";

interface RecipeInstructionsProps {
  instructions: string;
  onChange: (value: string) => void;
}

export const RecipeInstructions = ({ 
  instructions, 
  onChange 
}: RecipeInstructionsProps) => {
  return (
    <div>
      <Label htmlFor="instructions">Instructions</Label>
      <textarea
        id="instructions"
        required
        className="w-full min-h-[200px] rounded-md border border-input px-3 py-2"
        value={instructions}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  );
};
