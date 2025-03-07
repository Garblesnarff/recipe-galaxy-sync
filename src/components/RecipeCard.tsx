
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";

interface RecipeCardProps {
  id: string;
  title: string;
  description: string;
  image?: string;
  rating: number;
  cookTime?: string;
  difficulty?: string;
}

export const RecipeCard = ({
  id,
  title,
  description,
  image,
  rating,
  cookTime,
  difficulty,
}: RecipeCardProps) => {
  return (
    <Link to={`/recipe/${id}`} className="block">
      <Card className="recipe-card group">
        <div className="absolute top-3 right-3 z-10">
          <div className="w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center">
            <Check className="h-5 w-5 text-recipe-green" />
          </div>
        </div>
        <div className="recipe-image">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-lg leading-tight mb-1">{title}</h3>
          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{description}</p>
          {(cookTime || difficulty) && (
            <div className="flex gap-3 mt-3 text-xs text-gray-500">
              {cookTime && <span>{cookTime}</span>}
              {difficulty && <span>{difficulty}</span>}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
};
