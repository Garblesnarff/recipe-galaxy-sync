
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Collection } from "@/types/collection";
import { CollectionForm } from "@/components/collections/CollectionForm";
import { fetchCollectionById, updateCollection } from "@/services/collectionService";
import { Skeleton } from "@/components/ui/skeleton";

const EditCollection = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (id) {
      loadCollection(id);
    }
  }, [id]);

  const loadCollection = async (collectionId: string) => {
    setIsLoading(true);
    const data = await fetchCollectionById(collectionId);
    setCollection(data);
    setIsLoading(false);
  };

  const handleUpdateCollection = async (data: Partial<Collection>) => {
    if (!id) return;
    
    setIsSubmitting(true);
    const success = await updateCollection(id, data);
    setIsSubmitting(false);
    
    if (success) {
      navigate(`/collections/${id}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate(`/collections/${id}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">
            {isLoading ? "Loading..." : `Edit ${collection?.name}`}
          </h1>
        </div>
      </header>

      <main className="container py-6 max-w-2xl">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : collection ? (
          <CollectionForm
            collection={collection}
            onSubmit={handleUpdateCollection}
            isSubmitting={isSubmitting}
          />
        ) : (
          <div className="text-center py-12">
            <h2 className="text-xl font-medium mb-2">Collection Not Found</h2>
            <p className="text-gray-600 mb-6">
              The collection you're trying to edit doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate("/collections")}>
              Back to Collections
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default EditCollection;
