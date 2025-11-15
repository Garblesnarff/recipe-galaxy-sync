import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { memo } from "react";
import { Calendar, TrendingUp, Target, CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ProgramCardProps {
  id: string;
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: string;
  goal: string;
  image_url?: string;
  isEnrolled?: boolean;
  progress?: number;
  onEnroll?: () => void;
}

const ProgramCard = memo(({
  id,
  title,
  description,
  duration_weeks,
  difficulty,
  goal,
  image_url,
  isEnrolled = false,
  progress = 0,
  onEnroll,
}: ProgramCardProps) => {
  const defaultImage = "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800";

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500';
      case 'intermediate':
        return 'bg-yellow-500';
      case 'advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType.toLowerCase()) {
      case 'strength':
        return <TrendingUp className="h-4 w-4" />;
      case 'endurance':
        return <Target className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-lg transition-shadow">
      {/* Enrolled Badge */}
      {isEnrolled && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-green-500 text-white text-xs">
            <CheckCircle className="h-3 w-3 mr-1" />
            Enrolled
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

        {/* Overlay with difficulty */}
        <div className="absolute top-3 left-3">
          <Badge className={`${getDifficultyColor(difficulty)} text-white text-xs`}>
            {difficulty}
          </Badge>
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
          <Badge variant="outline" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            {duration_weeks} weeks
          </Badge>
          <Badge variant="outline" className="text-xs">
            {getGoalIcon(goal)}
            <span className="ml-1 capitalize">{goal.replace('_', ' ')}</span>
          </Badge>
        </div>

        {/* Progress bar if enrolled */}
        {isEnrolled && progress !== undefined && (
          <div className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-gray-600">Progress</span>
              <span className="text-xs font-semibold text-gray-700">{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* CTA */}
        <div className="mt-4">
          {isEnrolled ? (
            <Link to={`/training-programs/${id}`}>
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                Continue Program
              </Button>
            </Link>
          ) : (
            <div className="flex gap-2">
              <Link to={`/training-programs/${id}`} className="flex-1">
                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </Link>
              {onEnroll && (
                <Button
                  onClick={onEnroll}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  Enroll
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

ProgramCard.displayName = "ProgramCard";

export { ProgramCard };
