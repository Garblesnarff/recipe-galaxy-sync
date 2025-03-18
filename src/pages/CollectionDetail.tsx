
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil, Clock, ChefHat } from "lucide-react";
import { Collection } from "@/types/collection";
import { RecipeCard } from "@/components/RecipeCard";
import { fetchCollectionById, fetchCollectionRecipes, removeRecipeFromCollection } from "@/services/collectionService";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-white border-b">
          <div className="container py-4 flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/collections")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <Skeleton className="h-8 w-40" />
          </div>
        </header>
        <div className="container py-6">
          <Skeleton className="h-20 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium mb-2">Collection Not Found</h2>
          <p className="text-gray-600 mb-6">
            The collection you're looking for doesn't exist or has been removed.
          </p>
          <Button onClick={() => navigate("/collections")}>
            Back to Collections
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/collections")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">{collection.name}</h1>
          </div>
          <Button variant="outline" onClick={() => navigate(`/collections/edit/${id}`)}>
            <Pencil className="mr-1 h-4 w-4" /> Edit
          </Button>
        </div>
      </header>

      <main className="container py-6">
        {collection.description && (
          <div className="mb-6">
            <p className="text-gray-700">{collection.description}</p>
          </div>
        )}

        {recipes.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-medium mb-2">No Recipes in this Collection</h2>
            <p className="text-gray-600 mb-6">
              Add recipes to this collection to see them here.
            </p>
            <Button onClick={() => navigate("/")}>
              Browse Recipes
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes.map(recipe => (
              <div key={recipe.id} className="relative group">
                <RecipeCard
                  id={recipe.id}
                  title={recipe.title}
                  description={recipe.description}
                  image={recipe.image_url}
                  rating={recipe.rating || 0}
                  cookTime={recipe.cook_time}
                  difficulty={recipe.difficulty}
                  isFavorite={recipe.is_favorite}
                  onFavoriteToggle={() => {}} // This would need to be implemented
                  tags={[
                    ...(recipe.cuisine_type ? [recipe.cuisine_type] : []),
                    ...(recipe.categories?.slice(0, 1) || [])
                  ]}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleRemoveRecipe(recipe.id);
                  }}
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Remove Recipe Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Recipe</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this recipe from the collection? The recipe itself will not be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRemoveRecipe} className="bg-red-500 hover:bg-red-600">
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CollectionDetail;
