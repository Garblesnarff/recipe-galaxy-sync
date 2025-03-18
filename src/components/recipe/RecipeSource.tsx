
interface RecipeSourceProps {
  sourceUrl?: string;
}

export const RecipeSource = ({ sourceUrl }: RecipeSourceProps) => {
  if (!sourceUrl) return null;
  
  return (
    <div className="mb-6">
      <h3 className="text-lg font-medium mb-2">Source</h3>
      <a 
        href={sourceUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline break-all"
      >
        {sourceUrl}
      </a>
    </div>
  );
};
