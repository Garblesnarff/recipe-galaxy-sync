
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock, TrendingDown, Users, MapPin } from "lucide-react";
import { addIngredientsToGroceryList } from "@/services/groceryService";
import { toast } from "sonner";
import { RecipeIngredient } from "@/types/recipeIngredient";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export interface AddToGroceryListButtonProps {
  recipeId: string;
  ingredients: RecipeIngredient[] | string[];
  estimatedSavings?: number;
  estimatedCost?: number;
  recentBuyers?: Array<{id: string; name: string; avatar: string}>;
}

export const AddToGroceryListButton = ({ 
  recipeId, 
  ingredients,
  estimatedSavings = 0,
  estimatedCost = 0,
  recentBuyers = []
}: AddToGroceryListButtonProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [processedIngredients, setProcessedIngredients] = useState<string[]>([]);
  
  // Process ingredients whenever they change
  useEffect(() => {
    // Format ingredients to strings for display and selection
    const formatted = ingredients.map(ing => {
      if (typeof ing === 'string') {
        return ing.trim();
      } else if (ing && typeof ing === 'object' && 'name' in ing) {
        // Format structured ingredient with proper checks
        const { quantity, unit, name } = ing;
        if (!name) return ''; // Skip ingredients without a name
        return [quantity || '', unit || '', name || ''].filter(Boolean).join(' ').trim();
      }
      return ''; // Return empty string for invalid items
    }).filter(ing => ing.trim() !== ''); // Filter out empty strings
    
    setProcessedIngredients(formatted);
    console.log("Processed ingredients:", formatted);
  }, [ingredients]);

  // Initialize all ingredients as selected when opening dialog
  const initializeSelection = () => {
    setSelectedIngredients([...processedIngredients]);
  };

  // Open dialog and initialize selected ingredients
  const handleOpenDialog = () => {
    initializeSelection();
    setIsDialogOpen(true);
  };

  // Toggle selection of an ingredient
  const toggleIngredient = (ingredient: string) => {
    setSelectedIngredients(prev => 
      prev.includes(ingredient)
        ? prev.filter(ing => ing !== ingredient)
        : [...prev, ingredient]
    );
  };

  // Handle adding selected ingredients to grocery list
  const handleAddToGroceryList = async () => {
    if (!selectedIngredients || selectedIngredients.length === 0) {
      toast.error("No ingredients selected");
      return;
    }

    setIsAdding(true);
    try {
      console.log("Adding ingredients to grocery list:", selectedIngredients);
      const success = await addIngredientsToGroceryList(selectedIngredients, recipeId);
      if (success) {
        toast.success(`Added ${selectedIngredients.length} items to grocery list`);
        setIsDialogOpen(false);
      }
    } catch (error) {
      console.error("Failed to add to grocery list", error);
      toast.error("Failed to add to grocery list");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* Social shopping activity */}
      {recentBuyers.length > 0 && (
        <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center mb-2">
            <Users className="h-4 w-4 text-purple-600 mr-2" />
            <span className="text-sm font-medium text-purple-800">Shopping Activity</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex -space-x-1 mr-2">
                {recentBuyers.slice(0, 3).map(buyer => (
                  <img 
                    key={buyer.id}
                    className="w-5 h-5 rounded-full border border-white" 
                    src={buyer.avatar || '/placeholder-avatar.jpg'} 
                    alt={buyer.name}
                  />
                ))}
              </div>
              <span className="text-xs text-gray-600">
                {recentBuyers.length}+ people bought these ingredients today
              </span>
            </div>
            <Badge className="bg-purple-100 text-purple-800 text-xs">Trending</Badge>
          </div>
        </div>
      )}
      
      {/* Enhanced CTA with savings motivation */}
      <Button 
        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white relative" 
        onClick={handleOpenDialog}
      >
        <ShoppingCart className="mr-2 h-4 w-4" />
        Add {processedIngredients.length} Ingredients to MY List
        
        {/* Savings indicator */}
        {estimatedSavings > 0 && (
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
            Save ${estimatedSavings.toFixed(2)}
          </div>
        )}
      </Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Smart Shopping List Builder</DialogTitle>
            <DialogDescription>
              We've found the best prices and highlighted items on sale
            </DialogDescription>
          </DialogHeader>
          
          {/* Shopping summary */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-bold text-green-800">Your Smart Shopping Summary</h4>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  ${(estimatedCost || 25.99).toFixed(2)}
                </div>
                {estimatedSavings > 0 && (
                  <div className="text-xs text-green-700">
                    Save ${estimatedSavings.toFixed(2)} vs regular prices
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center text-sm text-green-700">
              <TrendingDown className="h-4 w-4 mr-1" />
              <span>3 ingredients on sale this week</span>
              <Clock className="h-4 w-4 ml-3 mr-1" />
              <span>Sales end in 2 days</span>
            </div>
          </div>
          
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIngredients(processedIngredients)}
              >
                Select All
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setSelectedIngredients([])}
              >
                Deselect All
              </Button>
            </div>
            
            <div className="max-h-[300px] overflow-y-auto space-y-3">
              {processedIngredients.length > 0 ? (
                processedIngredients.map((ingredient, index) => {
                  // Mock price data for demonstration
                  const mockPrices = {
                    'chicken breast': { price: 5.99, salePrice: 4.49, store: 'Kroger', onSale: true },
                    'heavy cream': { price: 3.29, salePrice: 2.49, store: 'Safeway', onSale: true },
                    'garlic': { price: 0.89, store: 'Whole Foods', onSale: false },
                    'pasta': { price: 1.99, salePrice: 1.29, store: 'Target', onSale: true },
                  };
                  
                  const priceInfo = mockPrices[ingredient.toLowerCase() as keyof typeof mockPrices] || 
                    { price: 2.99, store: 'Local Store', onSale: false };
                  
                  return (
                    <div key={index} className="border rounded-lg p-3 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <Checkbox 
                            id={`ingredient-${index}`}
                            checked={selectedIngredients.includes(ingredient)}
                            onCheckedChange={() => toggleIngredient(ingredient)}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label 
                              htmlFor={`ingredient-${index}`}
                              className="font-medium cursor-pointer capitalize"
                            >
                              {ingredient}
                            </Label>
                            <div className="flex items-center mt-1">
                              <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                              <span className="text-xs text-gray-600">{priceInfo.store}</span>
                              <Badge className="ml-2 bg-green-100 text-green-800 text-xs">In Stock</Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          {priceInfo.onSale && priceInfo.salePrice ? (
                            <div>
                              <div className="flex items-center">
                                <span className="text-lg font-bold text-green-600">
                                  ${priceInfo.salePrice}
                                </span>
                                <Badge className="ml-1 bg-red-100 text-red-800 text-xs">SALE</Badge>
                              </div>
                              <div className="text-xs text-gray-500 line-through">
                                ${priceInfo.price}
                              </div>
                              <div className="text-xs text-green-600">
                                Save ${(priceInfo.price - priceInfo.salePrice).toFixed(2)}
                              </div>
                            </div>
                          ) : (
                            <span className="text-lg font-semibold">${priceInfo.price}</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Urgency indicator for sale items */}
                      {priceInfo.onSale && (
                        <div className="mt-2 p-2 bg-amber-50 rounded border-l-2 border-amber-400">
                          <div className="flex items-center text-amber-800">
                            <Clock className="h-3 w-3 mr-1" />
                            <span className="text-xs font-medium">
                              Sale ends in 2 days - lock in your savings!
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-2 text-gray-500">
                  No ingredients found
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter className="flex flex-col space-y-3">
            {/* Bundle incentive */}
            <div className="bg-gradient-to-r from-green-100 to-blue-100 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-gray-800">Complete Recipe Bundle</p>
                  <p className="text-sm text-gray-600">Get all ingredients for maximum savings</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-600">
                    ${(estimatedCost || 25.99).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    vs ${((estimatedCost || 25.99) + (estimatedSavings || 7.70)).toFixed(2)} separately
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-2">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Maybe Later
              </Button>
              <Button 
                onClick={handleAddToGroceryList} 
                disabled={isAdding || selectedIngredients.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                {isAdding ? "Adding..." : `Add All ${selectedIngredients.length} Items - Save $${(estimatedSavings || 7.70).toFixed(2)} 🛒`}
              </Button>
            </div>
            
            <div className="text-center">
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Clock className="h-3 w-3 mr-1" />
                <span>Sale prices valid until this weekend</span>
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AddToGroceryListButton;
