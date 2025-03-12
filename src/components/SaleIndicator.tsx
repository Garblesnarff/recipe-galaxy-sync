
import { Tag, TagLabel, TagLeftIcon } from "@/components/ui/tag";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TagsIcon } from "lucide-react";

interface SaleIndicatorProps {
  salesCount: number;
  className?: string;
  onlyIcon?: boolean;
}

export const SaleIndicator = ({ salesCount, className = "", onlyIcon = false }: SaleIndicatorProps) => {
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
