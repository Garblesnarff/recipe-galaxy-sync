
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface RecipeImageProps {
  imageUrl?: string | Record<string, any>;
  alt?: string;
  onImageChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  imagePreview?: string | null;
}

export const RecipeImage = ({
  imageUrl,
  alt,
  onImageChange,
  imagePreview
}: RecipeImageProps) => {
  // Process the image URL - could be a string or a complex object
  const getProcessedImageUrl = (): string | undefined => {
    if (!imageUrl) return undefined;
    
    if (typeof imageUrl === 'string') {
      try {
        const parsedUrl = JSON.parse(imageUrl);
        if (parsedUrl && typeof parsedUrl === 'object' && 'url' in parsedUrl) {
          return parsedUrl.url;
        }
      } catch (e) {
        // If parsing fails, just use the string as-is
        return imageUrl;
      }
      return imageUrl;
    } 
    
    // Handle object with URL property
    if (typeof imageUrl === 'object' && !Array.isArray(imageUrl)) {
      if ('url' in imageUrl && imageUrl.url) {
        return imageUrl.url;
      }
    }
    
    // Handle nested arrays
    if (Array.isArray(imageUrl) && imageUrl.length > 0) {
      const firstItem = imageUrl[0];
      if (typeof firstItem === 'string') {
        return firstItem;
      } else if (firstItem && typeof firstItem === 'object' && 'url' in firstItem) {
        return firstItem.url;
      }
    }
    
    return undefined;
  };
  
  const processedImageUrl = getProcessedImageUrl();
  
  // If we're in edit mode (with onImageChange)
  if (onImageChange) {
    return (
      <div>
        <Label htmlFor="image">Recipe Image</Label>
        <div className="mt-2 space-y-4">
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={onImageChange}
            className="hidden"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('image')?.click()}
            className="w-full"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload Image
          </Button>
          {(imagePreview || processedImageUrl) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imagePreview || processedImageUrl}
                alt="Recipe preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>
      </div>
    );
  }
  
  // View mode (just displaying the image)
  if (!processedImageUrl) return null;
  
  return (
    <div className="mb-6 rounded-lg overflow-hidden">
      <img 
        src={processedImageUrl} 
        alt={alt || "Recipe image"} 
        className="w-full object-cover"
      />
    </div>
  );
};
