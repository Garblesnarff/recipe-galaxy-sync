import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Heart, Dumbbell, Clock, Zap, Target } from "lucide-react";

interface WorkoutCardProps {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  duration_minutes?: number;
  difficulty?: string;
  workout_type?: string;
  target_muscle_groups: string[];
  calories_estimate?: number;
  is_favorite?: boolean;
  onFavoriteToggle?: () => void;
  is_template?: boolean;
  onDelete?: () => void;
}

const WorkoutCard = memo(({
  id,
  title,
  description,
  image_url,
  duration_minutes,
  difficulty,
  workout_type,
  target_muscle_groups,
  calories_estimate,
  is_favorite = false,
  onFavoriteToggle,
  is_template = false,
  onDelete,
}: WorkoutCardProps) => {
  const defaultImage = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=400";

  return (
    <div className="block">
      <Card className="workout-card group relative overflow-hidden hover:shadow-lg transition-shadow">
        {/* Header with favorite and delete */}
        <div className="absolute top-3 right-3 z-10 flex gap-2">
          {onFavoriteToggle && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFavoriteToggle();
              }}
              className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors shadow-sm"
              aria-label="Toggle favorite"
            >
              <Heart
                className={`h-5 w-5 ${
                  is_favorite ? "fill-red-500 text-red-500" : "text-gray-600"
                }`}
              />
            </button>
          )}
        </div>

        {/* Template indicator */}
        {is_template && (
          <div className="absolute top-3 left-3 z-10">
            <Badge className="bg-blue-500 text-white text-xs">
              Template
            </Badge>
          </div>
        )}

        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={image_url || defaultImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImage;
            }}
          />

          {/* Overlay with quick stats */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
            <div className="flex items-center justify-between text-white text-sm">
              <div className="flex items-center space-x-3">
                {duration_minutes && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span>{duration_minutes} min</span>
                  </div>
                )}
                {calories_estimate && (
                  <div className="flex items-center">
                    <Zap className="h-4 w-4 mr-1" />
                    <span>{calories_estimate} cal</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-lg leading-tight">
              {title}
            </h3>
          </div>

          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            {difficulty && (
              <Badge variant="outline" className="text-xs">
                {difficulty}
              </Badge>
            )}
            {workout_type && (
              <Badge variant="outline" className="text-xs">
                <Dumbbell className="h-3 w-3 mr-1" />
                {workout_type}
              </Badge>
            )}
          </div>

          {/* Target muscle groups */}
          {target_muscle_groups.length > 0 && (
            <div className="flex items-start mb-3">
              <Target className="h-4 w-4 text-gray-500 mr-2 mt-0.5 flex-shrink-0" />
              <div className="flex flex-wrap gap-1">
                {target_muscle_groups.slice(0, 3).map((muscle) => (
                  <Badge key={muscle} variant="secondary" className="text-xs">
                    {muscle}
                  </Badge>
                ))}
                {target_muscle_groups.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{target_muscle_groups.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="mt-4">
            <Link to={`/workout/${id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                View Workout
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
});

WorkoutCard.displayName = "WorkoutCard";

export { WorkoutCard };
