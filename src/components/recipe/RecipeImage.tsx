
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload } from "lucide-react";

interface RecipeImageProps {
  imageUrl?: string;
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
          {(imagePreview || imageUrl) && (
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
              <img
                src={imagePreview || imageUrl}
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
  if (!imageUrl) return null;
  
  return (
    <div className="mb-6 rounded-lg overflow-hidden">
      <img 
        src={imageUrl} 
        alt={alt || "Recipe image"} 
        className="w-full object-cover"
      />
    </div>
  );
};
