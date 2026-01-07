/**
 * Meal Plan Recipe Card
 * Component displaying a recipe within a meal plan slot
 */

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Clock, Users, MoreVertical, Trash2, Edit, ExternalLink } from "lucide-react";
import { MealPlanRecipe } from "@/types/mealPlanning";
import { useMealPlanning } from "@/hooks/useMealPlanning";
import { useNavigate } from "react-router-dom";

interface MealPlanRecipeCardProps {
  mealPlanRecipe: MealPlanRecipe;
  onUpdate: () => void;
}

export const MealPlanRecipeCard = ({ mealPlanRecipe, onUpdate }: MealPlanRecipeCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const { removeRecipeFromCurrentPlan, isRemovingRecipe } = useMealPlanning();
  const navigate = useNavigate();

  const handleRemove = async () => {
    try {
      await removeRecipeFromCurrentPlan(mealPlanRecipe.id);
      onUpdate();
    } catch (error) {
      console.error('Error removing recipe from meal plan:', error);
    }
  };

  const handleViewRecipe = () => {
    navigate(`/recipe/${mealPlanRecipe.recipe_id}`);
  };

  const handleEditRecipe = () => {
    navigate(`/edit-recipe/${mealPlanRecipe.recipe_id}`);
  };

  if (!mealPlanRecipe.recipe) {
    return (
      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-sm text-gray-900">Recipe not found</p>
            <p className="text-xs text-gray-500">This recipe may have been deleted</p>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRemove}
            disabled={isRemovingRecipe}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          className="p-3 bg-white border border-gray-200 rounded-lg cursor-pointer hover:shadow-md transition-shadow group"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-gray-900 truncate">
                {mealPlanRecipe.recipe.title}
              </h4>

              <div className="flex items-center gap-3 mt-1">
                {mealPlanRecipe.recipe.prep_time && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Prep: {mealPlanRecipe.recipe.prep_time}</span>
                  </div>
                )}

                {mealPlanRecipe.recipe.cook_time && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock className="h-3 w-3" />
                    <span>Cook: {mealPlanRecipe.recipe.cook_time}</span>
                  </div>
                )}

                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Users className="h-3 w-3" />
                  <span>{mealPlanRecipe.servings} serving{mealPlanRecipe.servings !== 1 ? 's' : ''}</span>
                </div>
              </div>

              {mealPlanRecipe.notes && (
                <p className="text-xs text-blue-600 mt-1 truncate">
                  {mealPlanRecipe.notes}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1 ml-2">
              {isHovered && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreVertical className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={handleViewRecipe} className="gap-2">
                      <ExternalLink className="h-4 w-4" />
                      View Recipe
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleEditRecipe} className="gap-2">
                      <Edit className="h-4 w-4" />
                      Edit Recipe
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleRemove}
                      className="gap-2 text-red-600 focus:text-red-600"
                      disabled={isRemovingRecipe}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mealPlanRecipe.recipe.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Recipe Image */}
          {mealPlanRecipe.recipe.image_url && (
            <div className="w-full h-32 bg-gray-200 rounded-lg overflow-hidden">
              <img
                src={mealPlanRecipe.recipe.image_url}
                alt={mealPlanRecipe.recipe.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Recipe Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {mealPlanRecipe.recipe.prep_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Prep: {mealPlanRecipe.recipe.prep_time}</span>
                </div>
              )}

              {mealPlanRecipe.recipe.cook_time && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  <span>Cook: {mealPlanRecipe.recipe.cook_time}</span>
                </div>
              )}

              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{mealPlanRecipe.servings} serving{mealPlanRecipe.servings !== 1 ? 's' : ''}</span>
              </div>
            </div>

            {mealPlanRecipe.notes && (
              <div>
                <h4 className="font-medium text-sm mb-1">Notes:</h4>
                <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                  {mealPlanRecipe.notes}
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={handleViewRecipe} className="flex-1 gap-2">
              <ExternalLink className="h-4 w-4" />
              View Recipe
            </Button>
            <Button variant="outline" onClick={handleEditRecipe} className="flex-1 gap-2">
              <Edit className="h-4 w-4" />
              Edit Recipe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
