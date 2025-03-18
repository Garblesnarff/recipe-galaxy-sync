
interface RecipeTagsProps {
  categories?: string[];
  diet_tags?: string[];
  cuisine_type?: string;
  season_occasion?: string[];
  cooking_method?: string;
}

export const RecipeTags = ({
  categories,
  diet_tags,
  cuisine_type,
  season_occasion,
  cooking_method
}: RecipeTagsProps) => {
  if (!categories?.length && !diet_tags?.length && !cuisine_type && !cooking_method) {
    return null;
  }

  return (
    <div className="mt-4 mb-6">
      <h3 className="text-lg font-medium mb-2">Categories & Tags</h3>
      <div className="flex flex-wrap gap-2">
        {cuisine_type && cuisine_type !== "Uncategorized" && (
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {cuisine_type}
          </span>
        )}
        
        {categories?.map((category, index) => (
          <span key={`category-${index}`} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {category}
          </span>
        ))}
        
        {diet_tags?.map((tag, index) => (
          <span key={`diet-${index}`} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            {tag}
          </span>
        ))}
        
        {season_occasion?.map((season, index) => (
          <span key={`season-${index}`} className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
            {season}
          </span>
        ))}
        
        {cooking_method && cooking_method !== "Various" && (
          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm">
            {cooking_method}
          </span>
        )}
      </div>
    </div>
  );
};
