
interface RecipeCardImageProps {
  image?: string;
  title: string;
}

export const RecipeCardImage = ({ image, title }: RecipeCardImageProps) => {
  return (
    <div className="recipe-image">
      {image ? (
        <img
          src={image}
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
