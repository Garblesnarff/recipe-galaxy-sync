
import { processImageUrl } from "@/utils/imageUtils";

interface RecipeCardImageProps {
  image?: string | Record<string, any>;
  title: string;
}

export const RecipeCardImage = ({ image, title }: RecipeCardImageProps) => {
  const processedImageUrl = processImageUrl(image);

  return (
    <div className="recipe-image">
      {processedImageUrl ? (
        <img
          src={processedImageUrl}
          alt={title}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-400">
          No image available
        </div>
      )}
    </div>
  );
};
