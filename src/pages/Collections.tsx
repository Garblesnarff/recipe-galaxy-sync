import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { Collection } from "@/types/collection";
import { fetchCollections, createCollection, deleteCollection } from "@/services/collectionService";
import { CollectionCard } from "@/components/collections/CollectionCard";
import { CollectionForm } from "@/components/collections/CollectionForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuthSession } from "@/hooks/useAuthSession";

const Collections = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const { userId } = useAuthSession();

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    setIsLoading(true);
    const data = await fetchCollections();
    setCollections(data);
    setIsLoading(false);
  };

  const handleCreateCollection = async (data: Partial<Collection>) => {
    if (!userId) {
      toast.error("Must be logged in to create a collection");
      return;
    }
    setIsSubmitting(true);
    const newCollectionId = await createCollection(data, userId);
    setIsSubmitting(false);
    
    if (newCollectionId) {
      setIsCreateDialogOpen(false);
      await loadCollections();
    }
  };

  const handleDeleteClick = (collection: Collection) => {
    setSelectedCollection(collection);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedCollection) return;
    
    const success = await deleteCollection(selectedCollection.id);
    setIsDeleteDialogOpen(false);
    
    if (success) {
      await loadCollections();
    }
  };

  const handleEditClick = (collection: Collection) => {
    navigate(`/collections/edit/${collection.id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              className="mr-2"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Collections</h1>
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-1 h-4 w-4" /> New Collection
          </Button>
        </div>
      </header>

      <main className="container py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-medium mb-2">No Collections Yet</h2>
            <p className="text-gray-600 mb-6">
              Create collections to organize your recipes
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-1 h-4 w-4" /> Create Your First Collection
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collections.map(collection => (
              <CollectionCard
                key={collection.id}
                collection={collection}
                onEditClick={handleEditClick}
                onDeleteClick={handleDeleteClick}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create Collection Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
          </DialogHeader>
          <CollectionForm
            onSubmit={handleCreateCollection}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Collection</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedCollection?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Collections;
