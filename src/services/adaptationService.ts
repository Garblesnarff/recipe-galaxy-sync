import { Recipe } from '@/types/recipe';
import { RecipeIngredient } from '@/types/recipeIngredient';
import { DietaryRestriction } from '@/types/dietary';
import { supabase } from '@/integrations/supabase/client';

export const adaptRecipeForDiet = async (
  recipeId: string,
  userRestrictions: DietaryRestriction[]
): Promise<Recipe | null> => {
  try {
    const { data: recipe, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .single();

    if (error) throw error;
    if (!recipe) return null;

    // This is a placeholder. In a real implementation, you would have a more
    // complex logic to check ingredients against restrictions and find substitutions.
    const adaptedRecipe = { ...recipe };
    adaptedRecipe.title = `${recipe.title} (Adapted)`;
    adaptedRecipe.ingredients = (recipe.ingredients as RecipeIngredient[]).map((ing: RecipeIngredient) => {
      if (typeof ing === 'object' && 'name' in ing && ing.name.toLowerCase().includes('peanut')) {
        return { ...ing, name: 'Sunflower Seed Butter', original: ing.name };
      }
      return ing;
    });

    return adaptedRecipe as Recipe;
  } catch (error) {
    console.error('Error adapting recipe:', error);
    return null;
  }
};
