/**
 * Nutrition Service
 * Service for calculating and tracking nutritional information
 */

import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  IngredientNutrition,
  RecipeNutrition,
  NutritionSummary,
  ParsedIngredient,
  NutritionCalculation
} from "@/types/nutrition";

type IngredientNutritionRow = Tables<"ingredient_nutrition">;
type IngredientNutritionInsert = TablesInsert<"ingredient_nutrition">;
type RecipeNutritionRow = Tables<"recipe_nutrition">;
type RecipeNutritionInsert = TablesInsert<"recipe_nutrition">;

export interface NutritionCalculationResult {
  total_nutrition: NutritionSummary;
  calculations: NutritionCalculation[];
  coverage_percentage: number; // How much of the recipe we could calculate
}

/**
 * Gets ingredient nutrition data by name
 */
export const getIngredientNutrition = async (
  name: string
): Promise<IngredientNutrition | null> => {
  // Try exact match first
  let { data, error } = await supabase
    .from("ingredient_nutrition")
    .select("*")
    .ilike("name", name)
    .eq("is_public", true)
    .limit(1);

  if (error) {
    console.error('Error fetching ingredient nutrition:', error);
    return null;
  }

  if (data && data.length > 0) {
    return data[0];
  }

  // Try partial match if no exact match
  const { data: partialData, error: partialError } = await supabase
    .from("ingredient_nutrition")
    .select("*")
    .ilike("name", `%${name}%`)
    .eq("is_public", true)
    .limit(1);

  if (partialError) {
    console.error('Error fetching partial ingredient nutrition:', partialError);
    return null;
  }

  return partialData && partialData.length > 0 ? partialData[0] : null;
};

/**
 * Adds custom ingredient nutrition data
 */
export const addIngredientNutrition = async (
  userId: string,
  nutrition: Omit<IngredientNutritionInsert, 'created_by' | 'is_public'>
): Promise<IngredientNutrition> => {
  const nutritionData: IngredientNutritionInsert = {
    ...nutrition,
    created_by: userId,
    is_public: false,
  };

  const { data, error } = await supabase
    .from("ingredient_nutrition")
    .insert(nutritionData)
    .select()
    .single();

  if (error) {
    console.error('Error adding ingredient nutrition:', error);
    throw new Error(`Failed to add ingredient nutrition: ${error.message}`);
  }

  return data;
};

/**
 * Calculates nutrition for a single ingredient
 */
export const calculateIngredientNutrition = async (
  ingredientText: string,
  quantity: number = 1
): Promise<NutritionCalculation | null> => {
  const parsed = parseIngredientFromText(ingredientText);

  if (!parsed.name) {
    return null;
  }

  const nutrition = await getIngredientNutrition(parsed.name);

  if (!nutrition) {
    return null;
  }

  // Calculate nutrition based on serving size
  const servingRatio = quantity / (nutrition.serving_size_grams || 100);
  const confidence = calculateConfidence(parsed.name, nutrition.name);

  const scaledNutrition: NutritionSummary = {
    calories: (nutrition.calories_per_100g || 0) * servingRatio,
    protein: (nutrition.protein_per_100g || 0) * servingRatio,
    carbohydrates: (nutrition.carbs_per_100g || 0) * servingRatio,
    fat: (nutrition.fat_per_100g || 0) * servingRatio,
    fiber: (nutrition.fiber_per_100g || 0) * servingRatio,
    sugar: (nutrition.sugar_per_100g || 0) * servingRatio,
    sodium: (nutrition.sodium_per_100g || 0) * servingRatio,
  };

  return {
    ingredient: parsed,
    nutrition,
    scaled_nutrition: scaledNutrition,
    confidence,
  };
};

/**
 * Calculates total nutrition for a recipe
 */
export const calculateRecipeNutrition = async (
  ingredients: string[],
  servings: number = 1
): Promise<NutritionCalculationResult> => {
  const calculations: NutritionCalculation[] = [];
  let totalNutrition: NutritionSummary = {
    calories: 0,
    protein: 0,
    carbohydrates: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
  };

  let successfulCalculations = 0;

  for (const ingredient of ingredients) {
    const calculation = await calculateIngredientNutrition(ingredient);

    if (calculation) {
      calculations.push(calculation);
      totalNutrition.calories += calculation.scaled_nutrition.calories;
      totalNutrition.protein += calculation.scaled_nutrition.protein;
      totalNutrition.carbohydrates += calculation.scaled_nutrition.carbohydrates;
      totalNutrition.fat += calculation.scaled_nutrition.fat;
      totalNutrition.fiber += calculation.scaled_nutrition.fiber;
      totalNutrition.sugar += calculation.scaled_nutrition.sugar;
      totalNutrition.sodium += calculation.scaled_nutrition.sodium;
      successfulCalculations++;
    }
  }

  // Calculate per-serving nutrition
  const perServingNutrition: NutritionSummary = {
    calories: totalNutrition.calories / servings,
    protein: totalNutrition.protein / servings,
    carbohydrates: totalNutrition.carbohydrates / servings,
    fat: totalNutrition.fat / servings,
    fiber: totalNutrition.fiber / servings,
    sugar: totalNutrition.sugar / servings,
    sodium: totalNutrition.sodium / servings,
  };

  const coveragePercentage = ingredients.length > 0
    ? (successfulCalculations / ingredients.length) * 100
    : 0;

  return {
    total_nutrition: totalNutrition,
    calculations,
    coverage_percentage: coveragePercentage,
  };
};

/**
 * Saves calculated nutrition for a recipe
 */
export const saveRecipeNutrition = async (
  recipeId: string,
  versionNumber: number,
  nutrition: NutritionSummary,
  servings: number
): Promise<RecipeNutrition> => {
  const nutritionData: RecipeNutritionInsert = {
    recipe_id: recipeId,
    version_number: versionNumber,
    servings,
    calories_per_serving: nutrition.calories,
    protein_per_serving: nutrition.protein,
    carbs_per_serving: nutrition.carbohydrates,
    fat_per_serving: nutrition.fat,
    fiber_per_serving: nutrition.fiber,
    sugar_per_serving: nutrition.sugar,
    sodium_per_serving: nutrition.sodium,
  };

  const { data, error } = await supabase
    .from("recipe_nutrition")
    .upsert(nutritionData)
    .select()
    .single();

  if (error) {
    console.error('Error saving recipe nutrition:', error);
    throw new Error(`Failed to save recipe nutrition: ${error.message}`);
  }

  return data;
};

/**
 * Gets nutrition data for a recipe
 */
export const getRecipeNutrition = async (
  recipeId: string,
  versionNumber: number = 1
): Promise<RecipeNutrition | null> => {
  const { data, error } = await supabase
    .from("recipe_nutrition")
    .select("*")
    .eq("recipe_id", recipeId)
    .eq("version_number", versionNumber)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    console.error('Error fetching recipe nutrition:', error);
    return null;
  }

  return data;
};

/**
 * Parses ingredient from text (similar to recipe scaling service)
 */
const parseIngredientFromText = (ingredientText: string): ParsedIngredient => {
  const text = ingredientText.trim();

  // Simple pattern matching for amount and ingredient name
  const match = text.match(/^([\d\s/¼½¾⅓⅔⅛⅜⅝⅞]+)\s*(.+)$/);

  if (match) {
    const [, amountStr, name] = match;
    return {
      name: name.trim(),
      amount: parseFraction(amountStr),
      unit: '', // Simplified - unit parsing could be enhanced
    };
  }

  return {
    name: text,
    amount: 1,
    unit: '',
  };
};

/**
 * Parses fractional amounts
 */
const parseFraction = (amountText: string): number => {
  const fractionMap: { [key: string]: number } = {
    '¼': 0.25, '½': 0.5, '¾': 0.75,
    '⅓': 1/3, '⅔': 2/3,
    '⅛': 0.125, '⅜': 0.375, '⅝': 0.625, '⅞': 0.875,
  };

  // Handle mixed fractions like "1 1/2"
  const mixedMatch = amountText.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixedMatch) {
    const [, whole, numerator, denominator] = mixedMatch;
    return parseInt(whole) + parseInt(numerator) / parseInt(denominator);
  }

  // Handle simple fractions like "1/2"
  const simpleMatch = amountText.match(/^(\d+)\/(\d+)$/);
  if (simpleMatch) {
    const [, numerator, denominator] = simpleMatch;
    return parseInt(numerator) / parseInt(denominator);
  }

  // Handle unicode fractions
  for (const [unicode, decimal] of Object.entries(fractionMap)) {
    if (amountText.includes(unicode)) {
      return parseFloat(amountText.replace(unicode, '')) + decimal;
    }
  }

  // Handle whole numbers
  const numMatch = amountText.match(/^(\d+)$/);
  if (numMatch) {
    return parseInt(numMatch[1]);
  }

  return 1;
};

/**
 * Calculates confidence in ingredient name matching
 */
const calculateConfidence = (inputName: string, dbName: string): number => {
  const input = inputName.toLowerCase().trim();
  const db = dbName.toLowerCase().trim();

  // Exact match gets highest confidence
  if (input === db) {
    return 1.0;
  }

  // Check if one contains the other
  if (input.includes(db) || db.includes(input)) {
    return 0.8;
  }

  // Check for word overlap
  const inputWords = input.split(/\s+/);
  const dbWords = db.split(/\s+/);
  const commonWords = inputWords.filter(word =>
    dbWords.some(dbWord => dbWord.includes(word) || word.includes(dbWord))
  );

  if (commonWords.length > 0) {
    return 0.6;
  }

  return 0.3; // Low confidence for no obvious matches
};

/**
 * Gets common ingredients for nutrition lookup
 */
export const getCommonIngredients = async (
  searchTerm?: string
): Promise<IngredientNutrition[]> => {
  let query = supabase
    .from("ingredient_nutrition")
    .select("*")
    .eq("is_public", true)
    .order("name");

  if (searchTerm) {
    query = query.ilike("name", `%${searchTerm}%`);
  }

  const { data, error } = await query.limit(50);

  if (error) {
    console.error('Error fetching common ingredients:', error);
    throw new Error(`Failed to fetch ingredients: ${error.message}`);
  }

  return data || [];
};

/**
 * Formats nutrition summary for display
 */
export const formatNutritionSummary = (
  nutrition: NutritionSummary,
  servings: number = 1
): string => {
  const perServing = {
    calories: nutrition.calories / servings,
    protein: nutrition.protein / servings,
    carbohydrates: nutrition.carbohydrates / servings,
    fat: nutrition.fat / servings,
    fiber: nutrition.fiber / servings,
    sugar: nutrition.sugar / servings,
    sodium: nutrition.sodium / servings,
  };

  return `Per serving: ${Math.round(perServing.calories)} cal, ${Math.round(perServing.protein)}g protein, ${Math.round(perServing.carbohydrates)}g carbs, ${Math.round(perServing.fat)}g fat`;
};
