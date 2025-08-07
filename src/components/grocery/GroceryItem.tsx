
import { Check, Trash, Clock, AlertTriangle, TrendingDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GroceryItem as GroceryItemType } from "@/services/groceryTypes";
import { toggleItemPurchasedStatus, deleteGroceryItem } from "@/services/groceryService";

interface GroceryItemProps {
  item: GroceryItemType;
  onStatusChange: () => void;
  onDelete: () => void;
  salePrice?: number;
  regularPrice?: number;
  store?: string;
  onSale?: boolean;
  stockLevel?: 'high' | 'medium' | 'low';
  saleEndsIn?: string;
  alternatives?: Array<{name: string; price: number; store: string}>;
}

export const GroceryItem = ({ 
  item, 
  onStatusChange, 
  onDelete,
  salePrice,
  regularPrice = 2.99,
  store = 'Local Store',
  onSale = false,
  stockLevel = 'high',
  saleEndsIn,
  alternatives = []
}: GroceryItemProps) => {
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
    <div className="space-y-2">
      {/* Sale ending warning */}
      {onSale && saleEndsIn && (
        <div className="bg-amber-50 border border-amber-200 p-2 rounded">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-amber-600 mr-2" />
            <span className="text-sm text-amber-800 font-medium">
              <strong>{item.item_name}</strong> sale ends {saleEndsIn}! 
              Lock in your ${((regularPrice || 0) - (salePrice || 0)).toFixed(2)} savings now.
            </span>
          </div>
        </div>
      )}
      
      <div className={`p-3 rounded-lg border hover:bg-gray-50 transition-colors ${
        item.is_purchased ? 'bg-gray-50' : onSale ? 'bg-green-50 border-green-200' : 'bg-white'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div 
              className={`checkbox-circle ${item.is_purchased ? 'checked' : ''} cursor-pointer`}
              onClick={handleToggleStatus}
            >
              <Check className={`h-3 w-3 ${item.is_purchased ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-medium ${item.is_purchased ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
                  {item.item_name}
                </p>
                
                {/* Sale badge */}
                {onSale && (
                  <Badge className="bg-red-100 text-red-800 text-xs">SALE</Badge>
                )}
                
                {/* Stock level indicator */}
                {stockLevel === 'low' && (
                  <Badge className="bg-orange-100 text-orange-800 text-xs">Limited Stock</Badge>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-xs text-gray-600">
                {(item.quantity || item.unit) && (
                  <span>
                    {item.quantity && item.quantity}{item.quantity && item.unit ? ' ' : ''}
                    {item.unit && item.unit}
                  </span>
                )}
                
                <div className="flex items-center">
                  <MapPin className="h-3 w-3 mr-1" />
                  <span>{store}</span>
                </div>
                
                {stockLevel && (
                  <Badge className={`text-xs ${
                    stockLevel === 'high' ? 'bg-green-100 text-green-800' :
                    stockLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-orange-100 text-orange-800'
                  }`}>
                    {stockLevel === 'high' ? 'In Stock' : stockLevel === 'medium' ? 'Low Stock' : 'Very Low'}
                  </Badge>
                )}
              </div>
            </div>
          </div>
          
          {/* Price section */}
          <div className="text-right mr-3">
            {onSale && salePrice ? (
              <div>
                <div className="flex items-center">
                  <span className="text-lg font-bold text-green-600">
                    ${salePrice.toFixed(2)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 line-through">
                  ${regularPrice.toFixed(2)}
                </div>
                <div className="text-xs text-green-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  Save ${(regularPrice - salePrice).toFixed(2)}
                </div>
              </div>
            ) : (
              <span className="text-lg font-semibold">${regularPrice.toFixed(2)}</span>
            )}
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
        
        {/* Alternative suggestions */}
        {alternatives.length > 0 && !item.is_purchased && (
          <div className="mt-2 p-2 bg-blue-50 rounded border-l-2 border-blue-400">
            <p className="text-xs text-blue-800 font-medium mb-1">
              💡 Alternative: {alternatives[0].name} for ${alternatives[0].price.toFixed(2)} at {alternatives[0].store}
            </p>
            <Button 
              size="sm" 
              variant="outline" 
              className="text-xs h-6 px-2 border-blue-300 text-blue-700 hover:bg-blue-50"
              onClick={() => {
                // Handle alternative selection
                console.log('Switch to alternative:', alternatives[0]);
              }}
            >
              Switch to This Option
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
