
import { Route, Routes } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import RecipeDetail from "@/pages/RecipeDetail";
import AddRecipe from "@/pages/AddRecipe";
import GroceryList from "@/pages/GroceryList";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Toaster } from "@/components/ui/sonner";
import EditRecipe from "@/pages/EditRecipe";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/add-recipe" element={<AddRecipe />} />
        <Route path="/edit-recipe/:id" element={<EditRecipe />} />
        <Route path="/grocery-list" element={<GroceryList />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <BottomNavigation />
      <Toaster />
    </>
  );
}

export default App;
