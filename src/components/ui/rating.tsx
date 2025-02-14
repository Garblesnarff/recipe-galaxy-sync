
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface RatingProps {
  value: number;
  onChange?: (value: number) => void;
  readonly?: boolean;
  className?: string;
}

export const Rating = ({ value, onChange, readonly, className }: RatingProps) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !readonly && onChange?.(star)}
          className={cn(
            "transition-all duration-200",
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110",
            "focus:outline-none"
          )}
          disabled={readonly}
        >
          <Star
            className={cn(
              "w-5 h-5",
              star <= value
                ? "fill-recipe-sage text-recipe-sage"
                : "fill-transparent text-gray-300"
            )}
          />
        </button>
      ))}
    </div>
  );
};
