import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { Menu, Plus, Search, ShoppingCart, BookHeart, Settings, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback, useRef } from "react";
import debounce from "lodash/debounce";
const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const {
    data: recipes,
    isLoading
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

  // Debounced search handler
  const debouncedSearch = useCallback(debounce((value: string) => {
    setSearchQuery(value);
  }, 300), []);
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Function to create ripple effect
  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;

    // Remove any existing ripple
    const ripple = button.querySelector('.ripple');
    if (ripple) {
      ripple.remove();
    }

    // Create new ripple element
    const circle = document.createElement('span');
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Position the ripple based on click location
    const rect = button.getBoundingClientRect();
    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${event.clientX - rect.left - radius}px`;
    circle.style.top = `${event.clientY - rect.top - radius}px`;
    circle.classList.add('ripple');

    // Add the ripple to the button
    button.appendChild(circle);

    // Clean up the ripple element after animation completes
    setTimeout(() => {
      if (circle && circle.parentElement) {
        circle.remove();
      }
    }, 600);
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
            <Button variant="app" className="rounded-full" onClick={() => navigate("/add-recipe")}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-6 animate-fade-in">
        {isLoading ? <div className="text-center text-gray-500 py-10">Loading recipes...</div> : recipes?.length === 0 ? <div className="text-center text-gray-500 py-10">
            <p className="mb-4">No recipes found</p>
            <Button variant="app" onClick={() => navigate("/add-recipe")}>Add Your First Recipe</Button>
          </div> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recipes?.map(recipe => <RecipeCard key={recipe.id} id={recipe.id} title={recipe.title} description={recipe.description} image={recipe.image_url} rating={recipe.rating || 0} cookTime={recipe.cook_time} difficulty={recipe.difficulty} />)}
          </div>}
      </main>

      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 px-4 shadow-lg">
        <div className="flex justify-around max-w-lg mx-auto">
          <button className="action-button active" onClick={e => {
          createRipple(e);
          navigate("/");
        }}>
            <Utensils className="h-6 w-6 mb-1" />
            <span>Recipes</span>
          </button>
          <button onClick={e => {
          createRipple(e);
          navigate("/grocery-list");
        }} className="action-button rounded-none">
            <ShoppingCart className="h-6 w-6 mb-1" />
            <span>Groceries</span>
          </button>
          <button className="action-button" onClick={e => {
          createRipple(e);
        }}>
            <BookHeart className="h-6 w-6 mb-1" />
            <span>Favorites</span>
          </button>
          <button className="action-button" onClick={e => {
          createRipple(e);
        }}>
            <Settings className="h-6 w-6 mb-1" />
            <span>Settings</span>
          </button>
        </div>
      </footer>

      <Button variant="app" size="fab" className="fixed bottom-20 right-4 z-10" onClick={() => navigate("/add-recipe")}>
        <Plus className="h-6 w-6" />
      </Button>
    </div>;
};
export default Index;