
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const CollectionLoadingSkeleton = () => {
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b">
        <div className="container py-4 flex items-center">
          <Button
            variant="ghost"
            size="icon"
            className="mr-2"
            onClick={() => navigate("/collections")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <Skeleton className="h-8 w-40" />
        </div>
      </header>
      <div className="container py-6">
        <Skeleton className="h-20 w-full mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};
