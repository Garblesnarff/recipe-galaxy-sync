
import { Button } from "@/components/ui/button";
import { ArrowLeft, Pencil } from "lucide-react";
import { Collection } from "@/types/collection";
import { useNavigate } from "react-router-dom";

interface CollectionHeaderProps {
  collection: Collection;
  id: string;
}

export const CollectionHeader = ({ collection, id }: CollectionHeaderProps) => {
  const navigate = useNavigate();
  
  return (
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
  );
};
