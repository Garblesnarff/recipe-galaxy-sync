
import { Clock, ChefHat, Users, Calendar } from "lucide-react";

interface RecipeMetadataProps {
  cookTime?: string;
  prepTime?: string;
  difficulty?: string;
  description?: string;
  servings?: number;
  date?: string;
}

export const RecipeMetadata = ({ 
  cookTime, 
  prepTime,
  difficulty, 
  description,
  servings,
  date
}: RecipeMetadataProps) => {
  return (
    <>
      <div className="flex flex-wrap gap-3 mb-4">
        {cookTime && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="mr-1 h-4 w-4 text-gray-500" />
            <span>{cookTime}</span>
          </div>
        )}
        
        {prepTime && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Clock className="mr-1 h-4 w-4 text-gray-500" />
            <span>Prep: {prepTime}</span>
          </div>
        )}
        
        {difficulty && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <ChefHat className="mr-1 h-4 w-4 text-gray-500" />
            <span>{difficulty}</span>
          </div>
        )}
        
        {servings && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Users className="mr-1 h-4 w-4 text-gray-500" />
            <span>{servings} servings</span>
          </div>
        )}
        
        {date && (
          <div className="flex items-center text-sm bg-gray-100 px-3 py-1 rounded-full">
            <Calendar className="mr-1 h-4 w-4 text-gray-500" />
            <span>Added: {new Date(date).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {description && <p className="text-gray-700 mb-6">{description}</p>}
    </>
  );
};
