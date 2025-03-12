
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { BottomNavigation } from "@/components/BottomNavigation";
import { triggerSalesScrape } from "@/services/salesService";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [isScrapingSales, setIsScrapingSales] = useState(false);
  
  const {
    data: recipes,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ["recipes", searchQuery],
    queryFn: async () => {
      let query = supabase.from("recipes").select("*").order("created_at", {
        ascending: false
      });
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }
      const {
        data,
        error
      } = await query;
      if (error) throw error;
      return data;
    }
  });

  const debouncedSearch = useCallback(debounce((value: string) => {
    setSearchQuery(value);
  }, 300), []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  const handleRefreshSales = async () => {
    setIsScrapingSales(true);
    try {
      const success = await triggerSalesScrape();
      if (success) {
        // Refresh the recipe cards to show updated sale indicators
        refetch();
      }
    } catch (error) {
      console.error("Error refreshing sales data:", error);
      toast.error("Failed to refresh sales data");
    } finally {
      setIsScrapingSales(false);
    }
  };

  return <div className="min-h-screen bg-background">
      <header className="bg-recipe-green-light border-b sticky top-0 z-10">
        <div className="container py-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">KitchenSync</h1>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
          <div className="flex items-center gap-2 md:w-auto w-full">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Search recipes..." className="pl-10 rounded-full" onChange={handleSearch} />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="md:flex hidden"
              onClick={handleRefreshSales} 
              disabled={isScrapingSales}
            >
              <RefreshCw className={`h-4 w-4 ${isScrapingSales ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="app" className="rounded-full" onClick={() => navigate("/add-recipe")}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 animate-fade-in">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your Recipes</h2>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex md:hidden items-center gap-2"
            onClick={handleRefreshSales}
            disabled={isScrapingSales}
          >
            <RefreshCw className={`h-4 w-4 ${isScrapingSales ? 'animate-spin' : ''}`} />
            {isScrapingSales ? 'Updating Sales...' : 'Update Sales'}
          </Button>
        </div>
        
        {isLoading ? <div className="text-center text-gray-500 py-10">Loading recipes...</div> : recipes?.length === 0 ? <div className="text-center text-gray-500 py-10">
            <p className="mb-4">No recipes found</p>
            <Button variant="app" onClick={() => navigate("/add-recipe")}>Add Your First Recipe</Button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map(recipe => <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} description={recipe.description} image={recipe.image_url} rating={recipe.rating || 0} cookTime={recipe.cook_time} difficulty={recipe.difficulty} />)}
          </div>}
      </main>

      <BottomNavigation />

      <Button variant="app" size="fab" className="fixed bottom-20 right-4 z-10" onClick={() => navigate("/add-recipe")}>
        <Plus className="h-6 w-6" />
      </Button>
    </div>;
};

export default Index;
