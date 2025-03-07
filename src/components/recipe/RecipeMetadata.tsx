
import { Clock, ChefHat } from "lucide-react";

interface RecipeMetadataProps {
  cookTime?: string;
  difficulty?: string;
  description?: string;
}

export const RecipeMetadata = ({ cookTime, difficulty, description }: RecipeMetadataProps) => {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        {cookTime && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="mr-1 h-4 w-4 text-gray-500" />
            <span>{cookTime}</span>
          </div>
        )}
        {difficulty && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <ChefHat className="mr-1 h-4 w-4 text-gray-500" />
            <span>{difficulty}</span>
          </div>
        )}
      </div>

      {description && <p className="text-gray-700 mb-6">{description}</p>}
    </>
  );
};
