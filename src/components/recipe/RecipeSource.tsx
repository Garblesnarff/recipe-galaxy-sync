
import { ExternalLink } from "lucide-react";

interface RecipeSourceProps {
  sourceUrl?: string;
  sourceType?: string;
}

export const RecipeSource = ({ sourceUrl, sourceType }: RecipeSourceProps) => {
  if (!sourceUrl) return null;
  
  // Format the display URL to be more user-friendly
  const formatDisplayUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  const displayUrl = formatDisplayUrl(sourceUrl);
  const sourceTypeLabel = sourceType === 'youtube' ? 'YouTube Video' : 
                          sourceType === 'webpage' ? 'Recipe Website' : 'Source';

  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">{sourceTypeLabel}</h3>
      <a 
        href={sourceUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="flex items-center text-blue-600 hover:underline break-all group"
      >
        <span>{displayUrl}</span>
        <ExternalLink className="h-4 w-4 ml-1 opacity-70 group-hover:opacity-100" />
      </a>
    </div>
  );
};
