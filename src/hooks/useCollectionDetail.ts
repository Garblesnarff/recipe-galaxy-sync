
import { useState, useEffect } from "react";
import { Collection } from "@/types/collection";
import { fetchCollectionById, fetchCollectionRecipes, removeRecipeFromCollection } from "@/services/collectionService";

export const useCollectionDetail = (id: string | undefined) => {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [recipeToRemove, setRecipeToRemove] = useState<string | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      loadCollectionData(id);
    }
  }, [id]);

  const loadCollectionData = async (collectionId: string) => {
    setIsLoading(true);
    const collectionData = await fetchCollectionById(collectionId);
    const recipesData = await fetchCollectionRecipes(collectionId);
    
    setCollection(collectionData);
    setRecipes(recipesData);
    setIsLoading(false);
  };

  const handleRemoveRecipe = (recipeId: string) => {
    setRecipeToRemove(recipeId);
    setIsRemoveDialogOpen(true);
  };

  const confirmRemoveRecipe = async () => {
    if (!id || !recipeToRemove) return;
    
    const success = await removeRecipeFromCollection(id, recipeToRemove);
    setIsRemoveDialogOpen(false);
    
    if (success) {
      // Reload collection data
      await loadCollectionData(id);
    }
  };

  return {
    collection,
    recipes,
    isLoading,
    recipeToRemove,
    isRemoveDialogOpen,
    setIsRemoveDialogOpen,
    handleRemoveRecipe,
    confirmRemoveRecipe
  };
};
