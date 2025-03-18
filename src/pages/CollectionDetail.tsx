
import { useParams } from "react-router-dom";
import { CollectionHeader } from "@/components/collections/detail/CollectionHeader";
import { CollectionDescription } from "@/components/collections/detail/CollectionDescription";
import { EmptyCollectionState } from "@/components/collections/detail/EmptyCollectionState";
import { CollectionRecipeGrid } from "@/components/collections/detail/CollectionRecipeGrid";
import { RemoveRecipeDialog } from "@/components/collections/detail/RemoveRecipeDialog";
import { CollectionLoadingSkeleton } from "@/components/collections/detail/CollectionLoadingSkeleton";
import { CollectionNotFound } from "@/components/collections/detail/CollectionNotFound";
import { useCollectionDetail } from "@/hooks/useCollectionDetail";

const CollectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const {
    collection,
    recipes,
    isLoading,
    isRemoveDialogOpen,
    setIsRemoveDialogOpen,
    handleRemoveRecipe,
    confirmRemoveRecipe
  } = useCollectionDetail(id);

  if (isLoading) {
    return <CollectionLoadingSkeleton />;
  }

  if (!collection) {
    return <CollectionNotFound />;
  }

  return (
    <div className="min-h-screen bg-background">
      <CollectionHeader collection={collection} id={id!} />

      <main className="container py-6">
        <CollectionDescription description={collection.description} />

        {recipes.length === 0 ? (
          <EmptyCollectionState />
        ) : (
          <CollectionRecipeGrid 
            recipes={recipes} 
            onRemoveRecipe={handleRemoveRecipe} 
          />
        )}
      </main>

      <RemoveRecipeDialog 
        isOpen={isRemoveDialogOpen}
        onClose={setIsRemoveDialogOpen}
        onConfirm={confirmRemoveRecipe}
      />
    </div>
  );
};

export default CollectionDetail;
