
import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

interface RecipeInstructionsListProps {
  instructions: string;
}

export const RecipeInstructionsList = ({ instructions }: RecipeInstructionsListProps) => {
  const [completedSteps, setCompletedSteps] = useState<{[key: number]: boolean}>({});
  
  const toggleStep = (index: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };
  
  const instructionSteps = instructions.split("\n")
    .filter(instruction => instruction.trim())
    .map(instruction => instruction.trim());

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Instructions</h2>
      <div className="prose max-w-none">
        {instructionSteps.map((instruction, index) => (
          <div key={index} className="flex mb-6 last:mb-0">
            <button
              onClick={() => toggleStep(index)}
              className="flex-shrink-0 mr-4 mt-1"
            >
              {completedSteps[index] ? (
                <CheckCircle className="w-7 h-7 text-recipe-green" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-recipe-green-light flex items-center justify-center text-sm font-medium text-recipe-green-dark">
                  {index + 1}
                </div>
              )}
            </button>
            <div className={`${completedSteps[index] ? 'text-gray-500' : 'text-gray-700'}`}>
              <p className={completedSteps[index] ? 'line-through opacity-70' : ''}>
                {instruction}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
