
import { useState } from "react";
import { CheckCircle, Circle } from "lucide-react";

interface RecipeInstructionsListProps {
  instructions: string;
}

// Helper function to generate stable keys from instruction content
const generateStepKey = (instruction: string, index: number): string => {
  // Use first 50 chars of instruction + index for uniqueness
  // Replace spaces and special chars to create a valid key
  const cleanText = instruction.slice(0, 50).replace(/[^a-zA-Z0-9]/g, '-');
  return `step-${cleanText}-${index}`;
};

export const RecipeInstructionsList = ({ instructions }: RecipeInstructionsListProps) => {
  const [completedSteps, setCompletedSteps] = useState<{[key: string]: boolean}>({});

  const toggleStep = (stepKey: string) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepKey]: !prev[stepKey]
    }));
  };

  const instructionSteps = instructions.split("\n")
    .filter(instruction => instruction.trim())
    .map(instruction => instruction.trim());

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3">Instructions</h2>
      <div className="prose max-w-none">
        {instructionSteps.map((instruction, index) => {
          const stepKey = generateStepKey(instruction, index);
          return (
            <div key={stepKey} className="flex mb-6 last:mb-0">
              <button
                onClick={() => toggleStep(stepKey)}
                className="flex-shrink-0 mr-4 mt-1"
                role="checkbox"
                aria-checked={completedSteps[stepKey] || false}
                aria-label={`Mark step ${index + 1} as complete`}
              >
                {completedSteps[stepKey] ? (
                  <CheckCircle className="w-7 h-7 text-recipe-green" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-recipe-green-light flex items-center justify-center text-sm font-medium text-recipe-green-dark">
                    {index + 1}
                  </div>
                )}
              </button>
              <div className={`${completedSteps[stepKey] ? 'text-gray-500' : 'text-gray-700'}`}>
                <p className={completedSteps[stepKey] ? 'line-through opacity-70' : ''}>
                  {instruction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
