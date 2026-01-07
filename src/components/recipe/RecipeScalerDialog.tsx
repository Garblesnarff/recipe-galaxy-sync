/**
 * Recipe Scaler Dialog
 * Dialog component for scaling recipe ingredients
 */

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Scale, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { scaleRecipe, ScalingOptions } from "@/services/recipeScalingService";

interface RecipeScalerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeTitle: string;
  originalIngredients: string[];
  originalServings: number;
  onScaled?: (scaledIngredients: string[], newServings: number) => void;
}

export const RecipeScalerDialog = ({
  isOpen,
  onClose,
  recipeId,
  recipeTitle,
  originalIngredients,
  originalServings,
  onScaled,
}: RecipeScalerDialogProps) => {
  const [targetServings, setTargetServings] = useState(originalServings.toString());
  const [isScaling, setIsScaling] = useState(false);
  const [scaledIngredients, setScaledIngredients] = useState<string[]>([]);
  const [scalingWarnings, setScalingWarnings] = useState<string[]>([]);

  const handleScaleRecipe = async () => {
    const servings = parseInt(targetServings);

    if (!servings || servings <= 0) {
      toast.error("Please enter a valid number of servings");
      return;
    }

    if (servings === originalServings) {
      toast.info("Recipe is already scaled to this serving size");
      return;
    }

    setIsScaling(true);

    try {
      const options: ScalingOptions = {
        targetServings: servings,
        roundToNearest: 0.25, // Round to nearest quarter
      };

      const result = await scaleRecipe(
        originalIngredients,
        originalServings,
        servings,
        options
      );

      setScaledIngredients(result.scaled_ingredients.map(si => si.scaled));
      setScalingWarnings(result.warnings || []);

      if (onScaled) {
        onScaled(result.scaled_ingredients.map(si => si.scaled), servings);
      }

      toast.success(`Recipe scaled to ${servings} servings!`);
    } catch (error) {
      console.error('Error scaling recipe:', error);
      toast.error("Failed to scale recipe. Please try again.");
    } finally {
      setIsScaling(false);
    }
  };

  const handleReset = () => {
    setTargetServings(originalServings.toString());
    setScaledIngredients([]);
    setScalingWarnings([]);
  };

  const scaleFactor = parseInt(targetServings) / originalServings;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Scale Recipe: {recipeTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Scaling Controls */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Serving Size</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="original-servings">Original Servings</Label>
                  <Input
                    id="original-servings"
                    value={originalServings}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="target-servings">Target Servings</Label>
                  <Input
                    id="target-servings"
                    type="number"
                    min="1"
                    value={targetServings}
                    onChange={(e) => setTargetServings(e.target.value)}
                    placeholder="Enter servings"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  Scale Factor: {scaleFactor.toFixed(2)}x
                </Badge>
                <Badge variant="secondary">
                  {Math.round(scaleFactor * 100)}% of original
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleScaleRecipe}
                  disabled={isScaling || !targetServings}
                  className="flex-1"
                >
                  {isScaling ? "Scaling..." : "Scale Recipe"}
                </Button>
                <Button variant="outline" onClick={handleReset}>
                  Reset
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Warnings */}
          {scalingWarnings.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  Scaling Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1">
                  {scalingWarnings.map((warning, index) => (
                    <li key={index} className="text-sm text-amber-700 flex items-start gap-2">
                      <span className="text-amber-500 mt-0.5">•</span>
                      {warning}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Scaled Ingredients Preview */}
          {scaledIngredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  Scaled Ingredients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {scaledIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-muted rounded"
                    >
                      <span className="font-mono text-sm">{ingredient}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    💡 Tip: Use the scaled ingredients for your cooking. You can copy these to your grocery list or print them.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Original vs Scaled Comparison */}
          {scaledIngredients.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Original ({originalServings} servings)</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {originalIngredients.slice(0, 5).map((ingredient, index) => (
                        <div key={index} className="text-sm text-muted-foreground">
                          {ingredient}
                        </div>
                      ))}
                      {originalIngredients.length > 5 && (
                        <div className="text-sm text-muted-foreground">
                          ... and {originalIngredients.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Scaled ({targetServings} servings)</h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {scaledIngredients.slice(0, 5).map((ingredient, index) => (
                        <div key={index} className="text-sm font-medium">
                          {ingredient}
                        </div>
                      ))}
                      {scaledIngredients.length > 5 && (
                        <div className="text-sm font-medium">
                          ... and {scaledIngredients.length - 5} more
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
