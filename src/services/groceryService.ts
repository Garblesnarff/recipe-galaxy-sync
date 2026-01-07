
// Re-export all grocery-related functions and types
export type { GroceryItem, ParsedIngredient, IngredientScale } from './groceryTypes';
export type { RecipeIngredientsData } from './groceryAdd';
export {
  parseIngredient,
  scaleIngredient,
  scaleIngredients,
  deduplicateIngredients,
  combineIngredientsForGroceryList,
  formatScaledIngredient,
  handleGroceryError
} from './groceryUtils';
export {
  addToGroceryList,
  addIngredientsToGroceryList,
  addMultipleRecipesToGroceryList,
  addRecipeToGroceryListWithScaling
} from './groceryAdd';
export { getGroceryList } from './groceryFetch';
export {
  toggleItemPurchasedStatus,
  deleteGroceryItem,
  clearPurchasedItems,
  clearAllItems
} from './groceryUpdate';
