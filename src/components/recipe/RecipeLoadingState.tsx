
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

interface RecipeLoadingStateProps {
  isLoading: boolean;
}

export const RecipeLoadingState = ({ isLoading }: RecipeLoadingStateProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container py-8">
          <div className="text-center py-20">Loading recipe...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-8">
        <div className="text-center py-20">Recipe not found</div>
        <Button 
          variant="app" 
          onClick={() => navigate("/")} 
          className="mx-auto mt-4"
        >
          Back to Recipes
        </Button>
      </div>
    </div>
  );
};
