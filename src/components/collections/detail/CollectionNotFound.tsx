
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const CollectionNotFound = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-medium mb-2">Collection Not Found</h2>
        <p className="text-gray-600 mb-6">
          The collection you're looking for doesn't exist or has been removed.
        </p>
        <Button onClick={() => navigate("/collections")}>
          Back to Collections
        </Button>
      </div>
    </div>
  );
};
