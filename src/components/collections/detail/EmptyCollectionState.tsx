
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const EmptyCollectionState = () => {
  const navigate = useNavigate();
  
  return (
    <div className="text-center py-12 bg-gray-50 rounded-lg">
      <h2 className="text-xl font-medium mb-2">No Recipes in this Collection</h2>
      <p className="text-gray-600 mb-6">
        Add recipes to this collection to see them here.
      </p>
      <Button onClick={() => navigate("/")}>
        Browse Recipes
      </Button>
    </div>
  );
};
