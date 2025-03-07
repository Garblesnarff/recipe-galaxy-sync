
import { Check, Trash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GroceryItem as GroceryItemType } from "@/services/groceryService";
import { toggleItemPurchasedStatus, deleteGroceryItem } from "@/services/groceryService";

interface GroceryItemProps {
  item: GroceryItemType;
  onStatusChange: () => void;
  onDelete: () => void;
}

export const GroceryItem = ({ item, onStatusChange, onDelete }: GroceryItemProps) => {
  const handleToggleStatus = async () => {
    const success = await toggleItemPurchasedStatus(item.id, item.is_purchased);
    if (success) {
      onStatusChange();
    }
  };

  const handleDelete = async () => {
    const success = await deleteGroceryItem(item.id);
    if (success) {
      onDelete();
    }
  };

  return (
    <div className={`flex items-center justify-between p-3 rounded-lg border ${item.is_purchased ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-center gap-3 flex-1">
        <div 
          className={`checkbox-circle ${item.is_purchased ? 'checked' : ''}`}
          onClick={handleToggleStatus}
        >
          <Check className={`h-3 w-3 ${item.is_purchased ? 'opacity-100' : 'opacity-0'}`} />
        </div>
        
        <div className="flex-1">
          <p className={`font-medium ${item.is_purchased ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
            {item.item_name}
          </p>
          
          {(item.quantity || item.unit) && (
            <p className="text-sm text-gray-500">
              {item.quantity && item.quantity}{item.quantity && item.unit ? ' ' : ''}
              {item.unit && item.unit}
            </p>
          )}
        </div>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-gray-400 hover:text-red-500"
        onClick={handleDelete}
      >
        <Trash className="h-4 w-4" />
      </Button>
    </div>
  );
};
