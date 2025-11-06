
import { Tag, TagLabel, TagLeftIcon } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TagsIcon } from "lucide-react";
import { useMemo } from "react";
import { RecipeIngredient } from "@/types/recipeIngredient";

interface SaleIndicatorProps {
  salesCount?: number;
  ingredients?: (string | RecipeIngredient)[];
  className?: string;
  onlyIcon?: boolean;
}

export const SaleIndicator = ({ 
  salesCount: propSalesCount, 
  ingredients = [],
  className = "", 
  onlyIcon = false 
}: SaleIndicatorProps) => {
  // If ingredients are provided, we would calculate the sale count
  // This is a placeholder implementation - in a real app you'd check ingredients against a sales database
  const salesCount = useMemo(() => {
    if (propSalesCount !== undefined) return propSalesCount;
    
    // This would be where we'd check ingredients against a sales database
    // For now, just return a random count for demo purposes
    return Math.floor(Math.random() * 2); // 0 or 1 items on sale
  }, [propSalesCount, ingredients]);
  
  if (salesCount <= 0) return null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Tag variant="success" className={`${className} cursor-pointer`}>
            <TagLeftIcon>
              <TagsIcon className="h-3.5 w-3.5 text-recipe-green" />
            </TagLeftIcon>
            {!onlyIcon && (
              <TagLabel>On Sale</TagLabel>
            )}
          </Tag>
        </TooltipTrigger>
        <TooltipContent>
          <p>{salesCount} ingredient{salesCount > 1 ? 's' : ''} on sale</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
