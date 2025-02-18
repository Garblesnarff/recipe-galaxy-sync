
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useState, useCallback } from "react";
import debounce from "lodash/debounce";

const Index = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: recipes, isLoading } = useQuery({
    queryKey: ["recipes", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(
          `title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`
        );
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b">
        <div className="container py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Kitchen Sync</h1>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search recipes..."
                className="pl-10"
                onChange={handleSearch}
              />
            </div>
            <Button 
              className="bg-recipe-sage hover:bg-recipe-sage/90"
              onClick={() => navigate("/add-recipe")}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading recipes...</div>
        ) : recipes?.length === 0 ? (
          <div className="text-center text-gray-500">
            <p className="mb-4">No recipes found</p>
            <Button onClick={() => navigate("/add-recipe")}>Add Your First Recipe</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes?.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                description={recipe.description}
                image={recipe.image_url}
                rating={recipe.rating || 0}
                cookTime={recipe.cook_time}
                difficulty={recipe.difficulty}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
