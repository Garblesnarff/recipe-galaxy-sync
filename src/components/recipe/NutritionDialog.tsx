/**
 * Nutrition Dialog
 * Dialog component for displaying and calculating recipe nutrition
 */

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Apple, Calculator, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  calculateRecipeNutrition,
  formatNutritionSummary,
  NutritionCalculationResult
} from "@/services/nutritionService";
import { NutritionSummary } from "@/types/nutrition";

interface NutritionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  ingredients: string[];
  servings?: number;
}

export const NutritionDialog = ({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  ingredients,
  servings = 1,
}: NutritionDialogProps) => {
  const [nutritionResult, setNutritionResult] = useState<NutritionCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [hasCalculated, setHasCalculated] = useState(false);

  // Calculate nutrition when dialog opens
  useEffect(() => {
    if (isOpen && ingredients.length > 0 && !hasCalculated) {
      handleCalculateNutrition();
    }
  }, [isOpen, ingredients, hasCalculated]);

  const handleCalculateNutrition = async () => {
    if (ingredients.length === 0) {
      toast.error("No ingredients available for nutrition calculation");
      return;
    }

    setIsCalculating(true);

    try {
      const result = await calculateRecipeNutrition(ingredients, servings);
      setNutritionResult(result);
      setHasCalculated(true);

      if (result.coverage_percentage < 50) {
        toast.warning(`Only ${Math.round(result.coverage_percentage)}% of ingredients could be analyzed for nutrition`);
      } else {
        toast.success("Nutrition calculated successfully!");
      }
    } catch (error) {
      console.error('Error calculating nutrition:', error);
      toast.error("Failed to calculate nutrition. Please try again.");
    } finally {
      setIsCalculating(false);
    }
  };

  const getNutritionColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (percentage: number): string => {
    if (percentage >= 80) return "bg-green-500";
    if (percentage >= 60) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Apple className="h-5 w-5" />
            Nutrition Information: {recipeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Calculation Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {isCalculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Calculating nutrition...</span>
                    </>
                  ) : hasCalculated ? (
                    <>
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Nutrition calculated</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <span>Ready to calculate</span>
                    </>
                  )}
                </div>
                <Button
                  onClick={handleCalculateNutrition}
                  disabled={isCalculating || ingredients.length === 0}
                  size="sm"
                >
                    Calculate
                  </Button>
              </div>

              {nutritionResult && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Coverage</span>
                    <span className={getNutritionColor(nutritionResult.coverage_percentage)}>
                      {Math.round(nutritionResult.coverage_percentage)}%
                    </span>
                  </div>
                  <Progress
                    value={nutritionResult.coverage_percentage}
                    className="h-2"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Nutrition Summary */}
          {nutritionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Per Serving Nutrition</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Based on {servings} serving{servings !== 1 ? 's' : ''}
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(nutritionResult.total_nutrition.calories / servings)}
                    </div>
                    <div className="text-sm text-muted-foreground">Calories</div>
                  </div>

                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(nutritionResult.total_nutrition.protein / servings)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Protein</div>
                  </div>

                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {Math.round(nutritionResult.total_nutrition.carbohydrates / servings)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Carbs</div>
                  </div>

                  <div className="text-center p-3 bg-muted rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round(nutritionResult.total_nutrition.fat / servings)}g
                    </div>
                    <div className="text-sm text-muted-foreground">Fat</div>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">Fiber</div>
                    <div className="text-lg">{Math.round(nutritionResult.total_nutrition.fiber / servings)}g</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Sugar</div>
                    <div className="text-lg">{Math.round(nutritionResult.total_nutrition.sugar / servings)}g</div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-sm font-medium">Sodium</div>
                    <div className="text-lg">{Math.round(nutritionResult.total_nutrition.sodium / servings)}mg</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ingredient Analysis */}
          {nutritionResult && nutritionResult.calculations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Ingredient Analysis</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {nutritionResult.calculations.length} of {ingredients.length} ingredients analyzed
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {nutritionResult.calculations.map((calc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{calc.ingredient.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {Math.round(calc.scaled_nutrition.calories)} cal •
                          {Math.round(calc.scaled_nutrition.protein)}g protein •
                          {Math.round(calc.scaled_nutrition.carbohydrates)}g carbs
                        </div>
                      </div>
                      <Badge
                        variant={calc.confidence >= 0.8 ? "default" : calc.confidence >= 0.6 ? "secondary" : "outline"}
                        className="ml-2"
                      >
                        {Math.round(calc.confidence * 100)}% match
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Unanalyzed Ingredients */}
          {nutritionResult && nutritionResult.calculations.length < ingredients.length && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  Unanalyzed Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {ingredients
                    .filter(ing => !nutritionResult.calculations.some(calc =>
                      calc.ingredient.name.toLowerCase() === ing.toLowerCase()
                    ))
                    .map((ingredient, index) => (
                      <div key={index} className="flex items-center gap-2 p-2 bg-amber-50 rounded">
                        <span className="text-amber-600">•</span>
                        <span className="text-sm">{ingredient}</span>
                      </div>
                    ))}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  💡 Add these ingredients to the nutrition database for more accurate calculations
                </p>
              </CardContent>
            </Card>
          )}

          {/* Nutrition Tips */}
          {nutritionResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Nutrition Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  {nutritionResult.total_nutrition.protein / servings > 20 && (
                    <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>High protein meal - great for muscle maintenance</span>
                    </div>
                  )}

                  {nutritionResult.total_nutrition.fiber / servings > 5 && (
                    <div className="flex items-start gap-2 p-2 bg-green-50 rounded">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                      <span>Good source of fiber - supports digestive health</span>
                    </div>
                  )}

                  {nutritionResult.total_nutrition.calories / servings < 300 && (
                    <div className="flex items-start gap-2 p-2 bg-blue-50 rounded">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <span>Lower calorie option - suitable for light meals</span>
                    </div>
                  )}

                  {nutritionResult.coverage_percentage < 70 && (
                    <div className="flex items-start gap-2 p-2 bg-amber-50 rounded">
                      <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                      <span>Some ingredients couldn't be analyzed - consider adding them to the nutrition database</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
