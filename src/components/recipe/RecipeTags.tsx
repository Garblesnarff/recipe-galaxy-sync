
interface RecipeTagsProps {
  categories?: string[];
  diet_tags?: string[];
  cuisine_type?: string;
  season_occasion?: string[];
  cooking_method?: string;
  cuisineType?: string;
  dietTags?: string[];
  seasonOccasion?: string[];
  cookingMethod?: string;
}

export const RecipeTags = ({
  categories,
  diet_tags,
  cuisine_type,
  season_occasion,
  cooking_method,
  // Also accept camelCase versions for compatibility
  cuisineType,
  dietTags,
  seasonOccasion,
  cookingMethod
}: RecipeTagsProps) => {
  // Use the appropriate version, preferring the snake_case version if both are present
  const effectiveCuisineType = cuisine_type || cuisineType;
  const effectiveDietTags = diet_tags || dietTags || [];
  const effectiveSeasonOccasion = season_occasion || seasonOccasion || [];
  const effectiveCookingMethod = cooking_method || cookingMethod;

  if (!categories?.length && 
      !effectiveDietTags?.length && 
      !effectiveCuisineType && 
      !effectiveCookingMethod) {
    return null;
  }

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-lg font-medium mb-2">Categories & Tags</h3>
      <div className="flex flex-wrap gap-2">
        {effectiveCuisineType && effectiveCuisineType !== "Uncategorized" && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {effectiveCuisineType}
          </span>
        )}
        
        {categories?.map((category, index) => (
          <span key={`category-${index}`} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {category}
          </span>
        ))}
        
        {effectiveDietTags?.map((tag, index) => (
          <span key={`diet-${index}`} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            {tag}
          </span>
        ))}
        
        {effectiveSeasonOccasion?.map((season, index) => (
          <span key={`season-${index}`} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            {season}
          </span>
        ))}
        
        {effectiveCookingMethod && effectiveCookingMethod !== "Various" && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            {effectiveCookingMethod}
          </span>
        )}
      </div>
    </div>
  );
};
