
import { RecipeCard } from "@/components/RecipeCard";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const mockRecipes = [
  {
    title: "Classic Margherita Pizza",
    description: "Fresh basil, mozzarella, and tomato sauce on a crispy crust",
    rating: 4,
    cookTime: "30 mins",
    difficulty: "Easy",
  },
  {
    title: "Creamy Mushroom Risotto",
    description: "Arborio rice slowly cooked with mushrooms and parmesan",
    rating: 5,
    cookTime: "45 mins",
    difficulty: "Medium",
  },
  {
    title: "Thai Green Curry",
    description: "Aromatic coconut curry with vegetables and your choice of protein",
    rating: 4,
    cookTime: "40 mins",
    difficulty: "Medium",
  },
];

const Index = () => {
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
              />
            </div>
            <Button className="bg-recipe-sage hover:bg-recipe-sage/90">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Recipe
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockRecipes.map((recipe, index) => (
            <RecipeCard key={index} {...recipe} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
