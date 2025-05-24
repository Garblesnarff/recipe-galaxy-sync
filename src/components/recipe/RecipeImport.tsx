
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Link as LinkIcon, Loader2 } from "lucide-react";
import { validateUrl } from "@/services/recipe";
import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface RecipeImportProps {
  recipeUrl: string;
  onUrlChange: (url: string) => void;
  onImport: () => void;
  isImporting: boolean;
  importError?: string;
}

export const RecipeImport = ({
  recipeUrl,
  onUrlChange,
  onImport,
  isImporting,
  importError
}: RecipeImportProps) => {
  const [urlError, setUrlError] = useState("");
  const [isYouTube, setIsYouTube] = useState(false);
  const [domain, setDomain] = useState<string>("");

  // Define unsupported domains
  const UNSUPPORTED_DOMAINS = ['hellofresh.com', 'foodnetwork.com'];

  useEffect(() => {
    // Determine if URL is a YouTube URL
    if (recipeUrl) {
      setIsYouTube(recipeUrl.includes('youtube.com') || recipeUrl.includes('youtu.be'));
      
      // Extract domain for UI hints
      try {
        const url = new URL(recipeUrl);
        setDomain(url.hostname.replace('www.', ''));
      } catch {
        setDomain("");
      }
    } else {
      setIsYouTube(false);
      setDomain("");
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && recipeUrl && !urlError && !isImporting) {
      e.preventDefault();
      onImport();
    }
  };

  // Check if there's a known site with issues
  const isUnsupportedSite = domain && UNSUPPORTED_DOMAINS.some(unsupportedHost => domain.includes(unsupportedHost));

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
            onKeyDown={handleKeyDown}
            className={urlError ? "border-red-500" : ""}
            disabled={isImporting}
          />
          <Button 
            onClick={onImport} 
            disabled={isImporting || !!urlError || !recipeUrl}
            className="whitespace-nowrap"
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
        
        {importError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Import Failed</AlertTitle>
            <AlertDescription>{importError}</AlertDescription>
          </Alert>
        )}
        
        {isUnsupportedSite && !urlError && !isImporting && !importError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsupported Website</AlertTitle>
            <AlertDescription>
              We're sorry, but we cannot automatically import recipes from this website. Please try a different recipe source or add the recipe manually.
            </AlertDescription>
          </Alert>
        )}
        
        {isYouTube && !urlError && !isUnsupportedSite && (
          <span className="text-sm text-blue-500">
            YouTube video detected! We'll extract recipe details from this video.
          </span>
        )}
      </div>
    </div>
  );
};
