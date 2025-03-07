
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link as LinkIcon, Loader2 } from "lucide-react";
import { validateUrl } from "@/services/recipeService";
import { useState, useEffect } from "react";

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
  const [isYouTube, setIsYouTube] = useState(false);

  useEffect(() => {
    // Determine if URL is a YouTube URL
    if (recipeUrl) {
      setIsYouTube(recipeUrl.includes('youtube.com') || recipeUrl.includes('youtu.be'));
    } else {
      setIsYouTube(false);
    }
  }, [recipeUrl]);

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
            disabled={isImporting}
          />
          <Button 
            onClick={onImport} 
            disabled={isImporting || !!urlError || !recipeUrl}
          >
            {isImporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <LinkIcon className="mr-2 h-4 w-4" />
                Import
              </>
            )}
          </Button>
        </div>
        {urlError && (
          <span className="text-sm text-red-500">{urlError}</span>
        )}
        {isYouTube && !urlError && (
          <span className="text-sm text-blue-500">
            YouTube video detected! We'll extract recipe details from this video.
          </span>
        )}
      </div>
    </div>
  );
};
