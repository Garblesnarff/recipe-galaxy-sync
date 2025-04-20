
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Recipe } from "@/types/recipe";
import { DietaryRestriction } from "@/types/dietary";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { RecipeImage } from "@/components/recipe/RecipeImage";
import { AdaptRecipeDialog } from "@/components/recipe/AdaptRecipeDialog";
import { SaleIndicator } from "@/components/SaleIndicator";
import { RecipeTimer } from "@/components/recipe/RecipeTimer";
import { RecipeMetadata } from "@/components/recipe/RecipeMetadata";
import { DietaryWarnings } from "@/components/recipe/DietaryWarnings";
import { RecipeIngredientsList } from "@/components/recipe/RecipeIngredientsList";
import { RecipeInstructionsList } from "@/components/recipe/RecipeInstructionsList";
import { RecipeTags } from "@/components/recipe/RecipeTags";
import { RecipeSource } from "@/components/recipe/RecipeSource";
import { RecipeActions } from "@/components/recipe/RecipeActions";

interface RecipeContentProps {
  recipe: Recipe;
  isAdapted: boolean;
  currentServings: number;
  setCurrentServings: (servings: number) => void;
  handleAdaptRecipe: (recipe: any) => void;
  handleResetAdaptation: () => void;
  isFavorite: boolean;
  handleToggleFavorite: () => void;
}

export const RecipeContent = ({
  recipe,
  isAdapted,
  currentServings,
  setCurrentServings,
  handleAdaptRecipe,
  handleResetAdaptation,
  isFavorite,
  handleToggleFavorite
}: RecipeContentProps) => {
  // Process the image URL - could be a string or a complex object
  const getProcessedImageUrl = (): string | undefined => {
    const imageUrl = recipe.image_url;
    if (!imageUrl) return undefined;
    
    if (typeof imageUrl === 'string') {
      // Try to parse as JSON in case it's a stringified object from the DB
      try {
        const parsedImage = JSON.parse(imageUrl);
        if (parsedImage && typeof parsedImage === 'object' && 'url' in parsedImage) {
          return parsedImage.url as string;
        }
      } catch (e) {
        // Not JSON, use as-is
        return imageUrl;
      }
      return imageUrl;
    } 
    
    // Handle object with URL property
    if (typeof imageUrl === 'object' && imageUrl !== null && !Array.isArray(imageUrl)) {
      // Use type assertion to tell TypeScript this is a Record with a url property
      const imgObj = imageUrl as Record<string, any>;
      if ('url' in imgObj && imgObj.url) {
        return imgObj.url as string;
      }
    }
    
    // Handle array of images
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      const firstItem = imageUrl[0];
      if (typeof firstItem === 'string') {
        return firstItem;
      } else if (firstItem && typeof firstItem === 'object' && firstItem !== null) {
        // Use type assertion for the nested object
        const imgObj = firstItem as Record<string, any>;
        if ('url' in imgObj && imgObj.url) {
          return imgObj.url as string;
        }
      }
    }
    
    return undefined;
  };
  
  const processedImageUrl = getProcessedImageUrl();
  
  return (
    <Card className={cn("p-4", isAdapted && "border-indigo-300")}>
      <div className="space-y-6">
        <RecipeHeader
          title={recipe.title || ""}
          isFavorite={isFavorite}
          onToggleFavorite={handleToggleFavorite}
          rating={recipe.rating}
          ratingsCount={recipe.ratings?.length || 0}
          imageUrl={processedImageUrl}
        />

        <RecipeImage imageUrl={processedImageUrl} />

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <AdaptRecipeDialog 
              recipeId={recipe.id}
              onAdapt={handleAdaptRecipe}
            />
            
            <SaleIndicator
              salesCount={2}
            />
          </div>

          <RecipeTimer
            minutes={recipe.cook_time ? parseInt(recipe.cook_time) : 0}
            label={recipe.cook_time ? `${recipe.cook_time} Cooking Time` : ""}
          />
        </div>

        <RecipeMetadata
          prepTime={recipe.prep_time}
          cookTime={recipe.cook_time}
          servings={currentServings}
          difficulty={recipe.difficulty}
          rating={recipe.rating}
          onServingsChange={setCurrentServings}
        />

        <DietaryWarnings
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
        />

        <RecipeIngredientsList
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
          servings={recipe.servings}
          currentServings={currentServings}
        />

        <RecipeInstructionsList
          instructions={recipe.instructions || ""}
        />

        <RecipeTags
          categories={recipe.categories}
          cuisineType={recipe.cuisine_type}
          dietTags={recipe.diet_tags}
          cookingMethod={recipe.cooking_method}
          seasonOccasion={recipe.season_occasion}
        />

        <RecipeSource
          sourceUrl={recipe.source_url}
          sourceType={recipe.source_type}
        />

        <RecipeActions
          recipeId={recipe.id}
          ingredients={Array.isArray(recipe.ingredients) ? recipe.ingredients : []}
        />
      </div>
    </Card>
  );
};
