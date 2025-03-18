
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
            ingredients={recipe.ingredients as string[]}
            recipeId={recipe.id}
            onRateClick={handleRating}
            servings={currentServings}
            onServingsChange={setCurrentServings}
            cookTime={recipe.cook_time}
          />
        </div>
      </div>
    </div>
  );
};

export default RecipeDetail;
