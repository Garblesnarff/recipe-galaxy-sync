
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";

interface RecipeEditButtonProps {
  onClick: () => void;
  className?: string;
}

export const RecipeEditButton = ({ onClick, className }: RecipeEditButtonProps) => {
  return (
    <div className={`flex justify-end -mt-4 mb-4 ${className || ''}`}>
      <Button 
        onClick={onClick}
        variant="outline"
        size="sm"
        className="flex items-center gap-1"
      >
        <Edit className="h-4 w-4" />
        Edit Recipe
      </Button>
    </div>
  );
};
