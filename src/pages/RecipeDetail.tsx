
import { useRecipeDetail } from "@/hooks/useRecipeDetail";
import { RecipeHeader } from "@/components/recipe/RecipeHeader";
import { RecipeEditButton } from "@/components/recipe/RecipeEditButton";
import { RecipeMetadata } from "@/components/recipe/RecipeMetadata";
import { RecipeTags } from "@/components/recipe/RecipeTags";
import { RecipeSource } from "@/components/recipe/RecipeSource";
import { RecipeIngredientsList } from "@/components/recipe/RecipeIngredientsList";
import { RecipeInstructionsList } from "@/components/recipe/RecipeInstructionsList";
import { RecipeActions } from "@/components/recipe/RecipeActions";
import { RecipeLoadingState } from "@/components/recipe/RecipeLoadingState";
import { RecipeIngredient } from "@/types/recipeIngredient";

const RecipeDetail = () => {
  const {
    recipe,
    isLoading,
    navigateToEdit,
    isFavorite,
    handleToggleFavorite,
    handleRating,
    currentServings,
    setCurrentServings,
    navigate
  } = useRecipeDetail();

  if (isLoading || !recipe) {
    return <RecipeLoadingState isLoading={isLoading} />;
  }

  const ratingsArray = (recipe.ratings as unknown as { rating: number; timestamp: string }[]) || [];
  
  // Convert ingredients to the proper format if they aren't already
  // This handles both string[] and RecipeIngredient[] formats
  const formattedIngredients: RecipeIngredient[] = Array.isArray(recipe.ingredients) 
    ? recipe.ingredients.map(ing => {
        // First convert to unknown, then handle different cases
        const ingredient = ing as unknown;
        
        if (typeof ingredient === 'string') {
          // Parse string ingredients into structured format
          const parts = ingredient.trim().split(/\s+/);
          let quantity = '';
          let unit = '';
          let name = ingredient as string;
          
          // Try to extract quantity (first part if it's a number)
          if (parts.length > 0 && /^[\d\/\.\-]+$/.test(parts[0])) {
            quantity = parts[0];
            
            // Try to extract unit (second part if present)
            if (parts.length > 1) {
              unit = parts[1];
              // Name is everything else
              name = parts.slice(2).join(' ');
            }
          }
          
          return { name, quantity, unit };
        } 
        // If it's already a RecipeIngredient-like object
        else if (typeof ingredient === 'object' && ingredient !== null) {
          const ingObj = ingredient as Record<string, unknown>;
          // Ensure it has at least a name property
          if (ingObj.name && typeof ingObj.name === 'string') {
            return {
              name: ingObj.name,
              quantity: typeof ingObj.quantity === 'string' ? ingObj.quantity : '',
              unit: typeof ingObj.unit === 'string' ? ingObj.unit : '',
              notes: typeof ingObj.notes === 'string' ? ingObj.notes : undefined
            };
          }
        }
        
        // Default fallback for any unhandled types
        return { 
          name: typeof ingredient === 'string' ? ingredient : 'Unknown ingredient',
          quantity: '',
          unit: '' 
        };
      })
    : [];
  
  return (
    <div className="min-h-screen bg-background pb-24">
      <RecipeHeader 
        title={recipe.title}
        imageUrl={recipe.image_url}
        rating={recipe.rating}
        ratingsCount={ratingsArray.length}
        isFavorite={isFavorite}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="container">
        <div className="bg-white px-6 pb-6 pt-0 shadow-sm">
          <RecipeEditButton onClick={navigateToEdit} />

          <RecipeMetadata 
            cookTime={recipe.cook_time}
            prepTime={recipe.prep_time}
            difficulty={recipe.difficulty}
            description={recipe.description}
            servings={recipe.servings}
            date={recipe.created_at}
          />

          <RecipeTags 
            categories={recipe.categories}
            diet_tags={recipe.diet_tags}
            cuisine_type={recipe.cuisine_type}
            season_occasion={recipe.season_occasion}
            cooking_method={recipe.cooking_method}
          />

          <RecipeSource sourceUrl={recipe.source_url} />

          <RecipeIngredientsList 
            ingredients={recipe.ingredients as string[]}
            servings={currentServings}
            originalServings={recipe.servings}
          />

          <RecipeInstructionsList 
            instructions={recipe.instructions}
          />

          <RecipeActions 
            recipe={{
              id: recipe.id,
              cook_time: recipe.cook_time,
              prep_time: recipe.prep_time,
              is_favorite: recipe.is_favorite
            }}
            ingredients={formattedIngredients}
            hideOptions={false}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
