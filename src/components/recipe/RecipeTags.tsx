
import { Link, useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();

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

  const handleTagClick = (type: string, value: string) => {
    // Navigate to the index page with filter applied
    navigate('/', {
      state: {
        filterType: type,
        filterValue: value
      }
    });
  };

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-lg font-medium mb-2">Categories & Tags</h3>
      <div className="flex flex-wrap gap-2">
        {effectiveCuisineType && effectiveCuisineType !== "Uncategorized" && (
          <button
            onClick={() => handleTagClick('cuisine_type', effectiveCuisineType)}
            className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm hover:bg-blue-200 transition-colors cursor-pointer"
          >
            {effectiveCuisineType}
          </button>
        )}

        {categories?.map((category, index) => (
          <button
            key={`category-${index}`}
            onClick={() => handleTagClick('category', category)}
            className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm hover:bg-green-200 transition-colors cursor-pointer"
          >
            {category}
          </button>
        ))}

        {effectiveDietTags?.map((tag, index) => (
          <button
            key={`diet-${index}`}
            onClick={() => handleTagClick('diet_tag', tag)}
            className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm hover:bg-purple-200 transition-colors cursor-pointer"
          >
            {tag}
          </button>
        ))}

        {effectiveSeasonOccasion?.map((season, index) => (
          <button
            key={`season-${index}`}
            onClick={() => handleTagClick('season_occasion', season)}
            className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm hover:bg-orange-200 transition-colors cursor-pointer"
          >
            {season}
          </button>
        ))}

        {effectiveCookingMethod && effectiveCookingMethod !== "Various" && (
          <button
            onClick={() => handleTagClick('cooking_method', effectiveCookingMethod)}
            className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors cursor-pointer"
          >
            {effectiveCookingMethod}
          </button>
        )}
      </div>
    </div>
  );
};
