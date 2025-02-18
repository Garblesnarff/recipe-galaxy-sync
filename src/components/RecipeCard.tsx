
import { Card } from "@/components/ui/card";
import { Rating } from "@/components/ui/rating";
import { Link } from "react-router-dom";

interface RecipeCardProps {
  id?: string;
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
    <Link to={`/recipe/${id}`}>
      <Card className="overflow-hidden group transition-all duration-300 hover:shadow-lg animate-fade-in">
        <div className="aspect-video relative overflow-hidden bg-gray-100">
          {image ? (
            <img
              src={image}
              alt={title}
              className="object-cover w-full h-full transform transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No image available
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-4">
            <h3 className="font-semibold text-lg leading-tight">{title}</h3>
            <Rating value={rating} readonly className="flex-shrink-0" />
          </div>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{description}</p>
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
