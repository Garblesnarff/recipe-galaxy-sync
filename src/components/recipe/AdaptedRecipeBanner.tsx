
import { Button } from "@/components/ui/button";
import { DietaryRestriction } from "@/types/dietary";
import { AlertCircle, ArrowLeft } from "lucide-react";

interface AdaptedRecipeBannerProps {
  adaptedFor: DietaryRestriction[];
  onReset: () => void;
}

export const AdaptedRecipeBanner = ({ adaptedFor, onReset }: AdaptedRecipeBannerProps) => {
  if (!adaptedFor || adaptedFor.length === 0) return null;
  
  return (
    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 mb-4 flex items-center justify-between">
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-indigo-600 mr-2" />
        <span className="text-indigo-700">
          <span className="font-medium">Adapted recipe</span> for {adaptedFor.join(', ')}
        </span>
      </div>
      <Button variant="ghost" size="sm" onClick={onReset} className="text-indigo-700">
        <ArrowLeft className="h-4 w-4 mr-1" />
        Original recipe
      </Button>
    </div>
  );
};
