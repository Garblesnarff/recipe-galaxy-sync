
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon } from "lucide-react";
import { validateUrl } from "@/services/recipeService";
import { useState } from "react";

interface RecipeImportProps {
  recipeUrl: string;
  onUrlChange: (url: string) => void;
  onImport: () => void;
  isImporting: boolean;
}

export const RecipeImport = ({
  recipeUrl,
  onUrlChange,
  onImport,
  isImporting
}: RecipeImportProps) => {
  const [urlError, setUrlError] = useState("");

  const handleUrlChange = (value: string) => {
    onUrlChange(value);
    
    if (value && !validateUrl(value)) {
      setUrlError("Please enter a valid URL");
    } else {
      setUrlError("");
    }
  };

  return (
    <div className="mb-6">
      <Label>Import Recipe from URL</Label>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <Input
            type="url"
            placeholder="Enter recipe URL (YouTube or recipe website)"
            value={recipeUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            className={urlError ? "border-red-500" : ""}
          />
          <Button 
            onClick={onImport} 
            disabled={isImporting || !!urlError || !recipeUrl}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            {isImporting ? "Importing..." : "Import"}
          </Button>
        </div>
        {urlError && (
          <span className="text-sm text-red-500">{urlError}</span>
        )}
      </div>
    </div>
  );
};
