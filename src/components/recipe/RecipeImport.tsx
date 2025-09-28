
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, AlertTriangle, CheckCircle, Clock, Link as LinkIcon, Loader2 } from "lucide-react";
import { validateUrl, getSiteCompatibility, isUnsupportedSite } from "@/services/recipe/recipeUtils";
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
  const [siteCompatibility, setSiteCompatibility] = useState<{category: string, message: string, estimatedTime?: string} | null>(null);

  useEffect(() => {
    // Determine if URL is a YouTube URL and extract domain
    if (recipeUrl) {
      setIsYouTube(recipeUrl.includes('youtube.com') || recipeUrl.includes('youtu.be'));

      // Extract domain for UI hints and compatibility checking
      try {
        const url = new URL(recipeUrl);
        const extractedDomain = url.hostname.replace('www.', '');
        setDomain(extractedDomain);

        // Update site compatibility information
        const compatibility = getSiteCompatibility(extractedDomain);
        setSiteCompatibility({
          category: compatibility.category,
          message: compatibility.message,
          estimatedTime: compatibility.estimatedTime
        });
      } catch {
        setDomain("");
        setSiteCompatibility(null);
      }
    } else {
      setIsYouTube(false);
      setDomain("");
      setSiteCompatibility(null);
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

  // Check if the site is truly unsupported (cannot be scraped at all)
  const trulyUnsupported = domain && isUnsupportedSite(domain);

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
            disabled={isImporting || !!urlError || !recipeUrl || trulyUnsupported}
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
          <EnhancedErrorAlert importError={importError} />
        )}

        {trulyUnsupported && !urlError && !isImporting && !importError && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unsupported Website</AlertTitle>
            <AlertDescription>
              We're sorry, but we cannot automatically import recipes from this website. Please try a different recipe source or add the recipe manually.
            </AlertDescription>
          </Alert>
        )}

        {siteCompatibility && !urlError && !trulyUnsupported && !isImporting && !importError && (
          <SiteCompatibilityMessage compatibility={siteCompatibility} />
        )}

        {isYouTube && !urlError && !trulyUnsupported && (
          <span className="text-sm text-blue-500">
            YouTube video detected! We'll extract recipe details from this video.
          </span>
        )}
      </div>
    </div>
  );
};

// Enhanced error alert with actionable guidance
const EnhancedErrorAlert = ({ importError }: { importError: string }) => {
  const getErrorGuidance = (error: string) => {
    const lowerError = error.toLowerCase();

    if (lowerError.includes('hellofresh') || lowerError.includes('foodnetwork')) {
      return {
        title: "Challenging Website",
        message: "This site uses advanced anti-scraping measures. Try copying the recipe details manually, or try a different recipe source.",
        action: "manual"
      };
    }

    if (lowerError.includes('timeout') || lowerError.includes('fetch')) {
      return {
        title: "Website Unavailable",
        message: "The recipe website is temporarily unavailable. Try again later or find the recipe on a different site.",
        action: "retry"
      };
    }

    if (lowerError.includes('parse') || lowerError.includes('json') || lowerError.includes('content')) {
      return {
        title: "Recipe Format Issue",
        message: "We couldn't extract the recipe from this page format. Try copying the ingredients and instructions manually.",
        action: "manual"
      };
    }

    if (lowerError.includes('blocking') || lowerError.includes('access')) {
      return {
        title: "Access Blocked",
        message: "This website is blocking our recipe extractor. Try entering the recipe details manually instead.",
        action: "manual"
      };
    }

    // Default fallback
    return {
      title: "Import Failed",
      message: `${error} Try copying the recipe details manually, or choose a different recipe source.`,
      action: "manual"
    };
  };

  const guidance = getErrorGuidance(importError);

  return (
    <Alert variant="destructive" className="mt-2">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{guidance.title}</AlertTitle>
      <AlertDescription className="mt-1">
        {guidance.message}
      </AlertDescription>
    </Alert>
  );
};

// Site compatibility message component
const SiteCompatibilityMessage = ({
  compatibility
}: {
  compatibility: { category: string; message: string; estimatedTime?: string }
}) => {
  const getMessageStyle = (category: string) => {
    switch (category) {
      case 'reliable':
        return { variant: 'default' as const, icon: CheckCircle, textColor: 'text-green-700' };
      case 'challenging':
        return { variant: 'default' as const, icon: AlertTriangle, textColor: 'text-yellow-700' };
      default:
        return { variant: 'default' as const, icon: Clock, textColor: 'text-blue-700' };
    }
  };

  const style = getMessageStyle(compatibility.category);
  const IconComponent = style.icon;

  return (
    <Alert variant={style.variant} className="mt-2 border-l-4 border-l-current">
      <IconComponent className={`h-4 w-4 ${style.textColor}`} />
      <AlertDescription className={`text-sm ${style.textColor}`}>
        {compatibility.message}
        {compatibility.estimatedTime && (
          <span className="block mt-1 text-xs opacity-75">
            Estimated time: {compatibility.estimatedTime}
          </span>
        )}
      </AlertDescription>
    </Alert>
  );
};
