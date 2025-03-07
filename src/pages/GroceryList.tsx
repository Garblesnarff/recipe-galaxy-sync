
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGroceryList, clearPurchasedItems, clearAllItems, addToGroceryList } from "@/services/groceryService";
import { GroceryItem } from "@/components/grocery/GroceryItem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, ArrowLeft, Trash, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GroceryList = () => {
  const navigate = useNavigate();
  const [newItem, setNewItem] = useState("");

  const {
    data: groceryItems = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["groceryList"],
    queryFn: getGroceryList,
  });

  const handleToggleStatus = () => {
    refetch();
  };

  const handleDelete = () => {
    refetch();
  };

  const handleClearPurchased = async () => {
    const success = await clearPurchasedItems();
    if (success) {
      refetch();
    }
  };

  const handleClearAll = async () => {
    const success = await clearAllItems();
    if (success) {
      refetch();
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;

    const success = await addToGroceryList({
      item_name: newItem.trim(),
    });

    if (success) {
      setNewItem("");
      refetch();
    }
  };

  const purchasedItems = groceryItems.filter(item => item.is_purchased);
  const unpurchasedItems = groceryItems.filter(item => !item.is_purchased);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-20">Loading grocery list...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">Grocery List</h1>
        </div>
      </header>

      <div className="container py-6">
        <div className="bg-white rounded-xl p-4 shadow-sm mb-4">
          <form onSubmit={handleAddItem} className="flex gap-2">
            <Input
              placeholder="Add new item..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" variant="app">
              <Plus className="h-4 w-4 mr-1" /> Add
            </Button>
          </form>
        </div>

        {groceryItems.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-sm text-center">
            <ShoppingCart className="h-12 w-12 mx-auto text-gray-300 mb-3" />
            <h2 className="text-lg font-medium text-gray-700 mb-1">Your grocery list is empty</h2>
            <p className="text-gray-500 mb-4">Add items manually or from recipes</p>
            <Button variant="outline" onClick={() => navigate("/")}>
              Browse Recipes
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {unpurchasedItems.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Items to Buy ({unpurchasedItems.length})</h2>
                </div>
                <div className="space-y-2">
                  {unpurchasedItems.map((item) => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      onStatusChange={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {purchasedItems.length > 0 && (
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="font-semibold text-lg">Purchased Items ({purchasedItems.length})</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500"
                    onClick={handleClearPurchased}
                  >
                    <Trash className="h-4 w-4 mr-1" /> Clear Purchased
                  </Button>
                </div>
                <div className="space-y-2">
                  {purchasedItems.map((item) => (
                    <GroceryItem
                      key={item.id}
                      item={item}
                      onStatusChange={handleToggleStatus}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {groceryItems.length > 0 && (
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  className="text-red-500 border-red-200"
                  onClick={handleClearAll}
                >
                  <Trash className="h-4 w-4 mr-1" /> Clear All Items
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default GroceryList;
