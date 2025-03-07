
interface RecipeInstructionsListProps {
  instructions: string;
}

export const RecipeInstructionsList = ({ instructions }: RecipeInstructionsListProps) => {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Instructions</h2>
      <div className="prose max-w-none">
        {instructions.split("\n").map((instruction, index) => (
          instruction.trim() && (
            <div key={index} className="flex mb-4">
              <div className="flex-shrink-0 mr-4">
                <div className="w-7 h-7 rounded-full bg-recipe-green-light flex items-center justify-center text-sm font-medium text-recipe-green-dark">
                  {index + 1}
                </div>
              </div>
              <p className="text-gray-700">{instruction}</p>
            </div>
          )
        ))}
      </div>
    </div>
  );
};
