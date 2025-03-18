
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Collection } from "@/types/collection";
import { fetchCollections, addRecipeToCollection } from "@/services/collectionService";
import { Plus, Check } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

interface AddToCollectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  currentCollections: Collection[];
}

export const AddToCollectionDialog = ({
  isOpen,
  onClose,
  recipeId,
  currentCollections
}: AddToCollectionDialogProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCollections();
    }
  }, [isOpen]);

  const loadCollections = async () => {
    setIsLoading(true);
    const collectionsData = await fetchCollections();
    setCollections(collectionsData);
    setIsLoading(false);
  };

  const handleAddToCollection = async () => {
    if (!selectedCollectionId) {
      toast.error("Please select a collection");
      return;
    }

    setIsSubmitting(true);
    const success = await addRecipeToCollection(selectedCollectionId, recipeId);
    setIsSubmitting(false);

    if (success) {
      onClose();
    }
  };

  // Filter out collections that already contain the recipe
  const availableCollections = collections.filter(
    collection => !currentCollections.some(c => c.id === collection.id)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add to Collection</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : availableCollections.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-gray-500">
                {collections.length === 0
                  ? "You don't have any collections yet."
                  : "This recipe is already in all of your collections."}
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  onClose();
                  // We would navigate to collections page here
                  window.location.href = "/collections";
                }}
              >
                Create New Collection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
              {availableCollections.map(collection => (
                <button
                  key={collection.id}
                  className={`flex items-center p-3 rounded-md border transition-colors ${
                    selectedCollectionId === collection.id
                      ? "border-primary bg-primary/5"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCollectionId(collection.id)}
                >
                  <div className="flex-1 text-left">
                    <h4 className="font-medium">{collection.name}</h4>
                    <p className="text-xs text-gray-500">
                      {collection.recipe_count} {collection.recipe_count === 1 ? "recipe" : "recipes"}
                    </p>
                  </div>
                  {selectedCollectionId === collection.id && (
                    <Check className="h-5 w-5 text-primary" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCollection}
            disabled={!selectedCollectionId || isSubmitting}
          >
            <Plus className="mr-1 h-4 w-4" />
            {isSubmitting ? "Adding..." : "Add to Collection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
