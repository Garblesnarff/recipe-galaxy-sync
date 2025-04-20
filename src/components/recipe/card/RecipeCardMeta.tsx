
interface RecipeCardMetaProps {
  cookTime?: string;
  difficulty?: string;
  tags?: string[];
}

export const RecipeCardMeta = ({ cookTime, difficulty, tags = [] }: RecipeCardMetaProps) => {
  return (
    <>
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {tags.map((tag, index) => (
            <span 
              key={index} 
              className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      
      {(cookTime || difficulty) && (
        <div className="flex gap-3 mt-3 text-xs text-gray-500">
          {cookTime && <span>{cookTime}</span>}
          {difficulty && <span>{difficulty}</span>}
        </div>
      )}
    </>
  );
};
