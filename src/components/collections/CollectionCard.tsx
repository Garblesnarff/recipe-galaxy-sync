
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Collection } from "@/types/collection";
import { Book, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

interface CollectionCardProps {
  collection: Collection;
  onEditClick: (collection: Collection) => void;
  onDeleteClick: (collection: Collection) => void;
}

export const CollectionCard = ({ 
  collection, 
  onEditClick, 
  onDeleteClick 
}: CollectionCardProps) => {
  return (
    <Card className="overflow-hidden flex flex-col">
      <Link to={`/collections/${collection.id}`} className="flex-1">
        <div className="relative h-40 bg-gray-100">
          {collection.cover_image_url ? (
            <img 
              src={collection.cover_image_url} 
              alt={collection.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gray-200">
              <Book className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-semibold">{collection.name}</h3>
          {collection.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {collection.description}
            </p>
          )}
          <div className="text-xs text-gray-500 mt-2">
            {collection.recipe_count} {collection.recipe_count === 1 ? 'recipe' : 'recipes'}
          </div>
        </div>
      </Link>
      
      <div className="px-4 pb-3 mt-auto">
        <div className="flex justify-end">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEditClick(collection)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-red-500"
                onClick={() => onDeleteClick(collection)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  );
};
