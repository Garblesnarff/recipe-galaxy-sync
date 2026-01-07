/**
 * Recipe Versioning Service
 * Service for tracking recipe changes and managing versions
 */

import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";
import {
  RecipeVersion,
  RecipeChange,
  VersionComparison,
  RecipeVersionHistory,
  VersionRestoreOptions
} from "@/types/recipeVersioning";

type RecipeVersionRow = Tables<"recipe_versions">;
type RecipeVersionInsert = TablesInsert<"recipe_versions">;

export interface CreateVersionData {
  title: string;
  description?: string;
  ingredients: any[];
  instructions: string;
  prep_time?: string;
  cook_time?: string;
  servings: number;
  difficulty?: string;
  categories?: string[];
  cuisine_type?: string;
  diet_tags?: string[];
  cooking_method?: string;
  season_occasion?: string[];
  image_url?: string;
  source_url?: string;
  change_notes?: string;
}

/**
 * Creates a new version of a recipe
 */
export const createRecipeVersion = async (
  recipeId: string,
  versionData: CreateVersionData
): Promise<RecipeVersion> => {
  // Get the current highest version number
  const { data: latestVersion, error: versionError } = await supabase
    .from("recipe_versions")
    .select("version_number")
    .eq("recipe_id", recipeId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (versionError && versionError.code !== 'PGRST116') {
    console.error('Error getting latest version:', versionError);
    throw new Error(`Failed to get latest version: ${versionError.message}`);
  }

  const nextVersionNumber = (latestVersion?.version_number || 0) + 1;

  const versionInsert: RecipeVersionInsert = {
    recipe_id: recipeId,
    version_number: nextVersionNumber,
    title: versionData.title,
    description: versionData.description || null,
    ingredients: versionData.ingredients,
    instructions: versionData.instructions,
    prep_time: versionData.prep_time || null,
    cook_time: versionData.cook_time || null,
    servings: versionData.servings,
    difficulty: versionData.difficulty || null,
    categories: versionData.categories || null,
    cuisine_type: versionData.cuisine_type || null,
    diet_tags: versionData.diet_tags || null,
    cooking_method: versionData.cooking_method || null,
    season_occasion: versionData.season_occasion || null,
    image_url: versionData.image_url || null,
    source_url: versionData.source_url || null,
    change_notes: versionData.change_notes || null,
  };

  const { data, error } = await supabase
    .from("recipe_versions")
    .insert(versionInsert)
    .select()
    .single();

  if (error) {
    console.error('Error creating recipe version:', error);
    throw new Error(`Failed to create recipe version: ${error.message}`);
  }

  return data as RecipeVersion;
};

/**
 * Gets version history for a recipe
 */
export const getRecipeVersionHistory = async (
  recipeId: string
): Promise<RecipeVersionHistory> => {
  const { data, error } = await supabase
    .from("recipe_versions")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("version_number", { ascending: false });

  if (error) {
    console.error('Error fetching version history:', error);
    throw new Error(`Failed to fetch version history: ${error.message}`);
  }

  const versions = data || [];
  const currentVersion = Math.max(...versions.map(v => v.version_number));

  const versionMetadata = versions.map(version => ({
    version_number: version.version_number,
    created_at: version.created_at,
    change_notes: version.change_notes,
    is_current: version.version_number === currentVersion,
  }));

  return {
    recipe_id: recipeId,
    current_version: currentVersion,
    versions: versionMetadata,
    total_versions: versions.length,
  };
};

/**
 * Gets a specific version of a recipe
 */
export const getRecipeVersion = async (
  recipeId: string,
  versionNumber: number
): Promise<RecipeVersion | null> => {
  const { data, error } = await supabase
    .from("recipe_versions")
    .select("*")
    .eq("recipe_id", recipeId)
    .eq("version_number", versionNumber)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching recipe version:', error);
    return null;
  }

  return data as RecipeVersion;
};

/**
 * Compares two versions of a recipe
 */
export const compareRecipeVersions = async (
  recipeId: string,
  fromVersion: number,
  toVersion: number
): Promise<VersionComparison> => {
  const [fromVersionData, toVersionData] = await Promise.all([
    getRecipeVersion(recipeId, fromVersion),
    getRecipeVersion(recipeId, toVersion),
  ]);

  if (!fromVersionData || !toVersionData) {
    throw new Error('One or both versions not found');
  }

  const changes = compareRecipeFields(fromVersionData, toVersionData);

  return {
    from_version: fromVersionData,
    to_version: toVersionData,
    changes,
    summary: {
      fields_changed: changes.filter(c => c.change_type === 'modified').length,
      ingredients_changed: changes.filter(c =>
        c.field === 'ingredients' || c.change_type === 'added' || c.change_type === 'removed'
      ).length,
      instructions_changed: changes.some(c => c.field === 'instructions'),
      metadata_changed: changes.some(c =>
        !['ingredients', 'instructions'].includes(c.field)
      ),
    },
  };
};

/**
 * Compares recipe fields and identifies changes
 */
const compareRecipeFields = (
  fromVersion: RecipeVersion,
  toVersion: RecipeVersion
): RecipeChange[] => {
  const changes: RecipeChange[] = [];

  // Compare simple fields
  const fieldsToCompare = [
    'title', 'description', 'instructions', 'prep_time', 'cook_time',
    'servings', 'difficulty', 'cuisine_type', 'cooking_method'
  ];

  for (const field of fieldsToCompare) {
    const fromValue = (fromVersion as any)[field];
    const toValue = (toVersion as any)[field];

    if (fromValue !== toValue) {
      changes.push({
        field,
        old_value: fromValue,
        new_value: toValue,
        change_type: 'modified',
      });
    }
  }

  // Compare array fields
  const arrayFields = ['categories', 'diet_tags', 'season_occasion'];

  for (const field of arrayFields) {
    const fromArray = (fromVersion as any)[field] || [];
    const toArray = (toVersion as any)[field] || [];

    // Check for additions
    const additions = toArray.filter((item: string) => !fromArray.includes(item));
    for (const addition of additions) {
      changes.push({
        field,
        old_value: null,
        new_value: addition,
        change_type: 'added',
      });
    }

    // Check for removals
    const removals = fromArray.filter((item: string) => !toArray.includes(item));
    for (const removal of removals) {
      changes.push({
        field,
        old_value: removal,
        new_value: null,
        change_type: 'removed',
      });
    }
  }

  // Compare ingredients (simplified comparison)
  if (JSON.stringify(fromVersion.ingredients) !== JSON.stringify(toVersion.ingredients)) {
    changes.push({
      field: 'ingredients',
      old_value: fromVersion.ingredients,
      new_value: toVersion.ingredients,
      change_type: 'modified',
    });
  }

  return changes;
};

/**
 * Restores a recipe to a specific version
 */
export const restoreRecipeVersion = async (
  recipeId: string,
  targetVersionNumber: number,
  options?: VersionRestoreOptions
): Promise<RecipeVersion> => {
  const targetVersion = await getRecipeVersion(recipeId, targetVersionNumber);

  if (!targetVersion) {
    throw new Error('Target version not found');
  }

  // Create a new version with the restored data
  const restoredVersion = await createRecipeVersion(recipeId, {
    title: targetVersion.title,
    description: targetVersion.description || undefined,
    ingredients: targetVersion.ingredients,
    instructions: targetVersion.instructions,
    prep_time: targetVersion.prep_time || undefined,
    cook_time: targetVersion.cook_time || undefined,
    servings: targetVersion.servings,
    difficulty: targetVersion.difficulty || undefined,
    categories: targetVersion.categories || undefined,
    cuisine_type: targetVersion.cuisine_type || undefined,
    diet_tags: targetVersion.diet_tags || undefined,
    cooking_method: targetVersion.cooking_method || undefined,
    season_occasion: targetVersion.season_occasion || undefined,
    image_url: targetVersion.image_url || undefined,
    source_url: targetVersion.source_url || undefined,
    change_notes: options?.change_notes || `Restored from version ${targetVersionNumber}`,
  });

  return restoredVersion;
};

/**
 * Deletes a specific version (if it's not the current version)
 */
export const deleteRecipeVersion = async (
  recipeId: string,
  versionNumber: number
): Promise<void> => {
  // Check if this is the current version
  const history = await getRecipeVersionHistory(recipeId);
  if (versionNumber === history.current_version) {
    throw new Error('Cannot delete the current version');
  }

  const { error } = await supabase
    .from("recipe_versions")
    .delete()
    .eq("recipe_id", recipeId)
    .eq("version_number", versionNumber);

  if (error) {
    console.error('Error deleting recipe version:', error);
    throw new Error(`Failed to delete recipe version: ${error.message}`);
  }
};

/**
 * Gets the latest version of a recipe
 */
export const getLatestRecipeVersion = async (
  recipeId: string
): Promise<RecipeVersion | null> => {
  const { data, error } = await supabase
    .from("recipe_versions")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("version_number", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest version:', error);
    return null;
  }

  return data;
};

/**
 * Automatically creates a version when a recipe is updated
 */
export const autoCreateVersion = async (
  recipeId: string,
  recipeData: any,
  changeNotes?: string
): Promise<RecipeVersion> => {
  return createRecipeVersion(recipeId, {
    title: recipeData.title,
    description: recipeData.description,
    ingredients: recipeData.ingredients,
    instructions: recipeData.instructions,
    prep_time: recipeData.prep_time,
    cook_time: recipeData.cook_time,
    servings: recipeData.servings,
    difficulty: recipeData.difficulty,
    categories: recipeData.categories,
    cuisine_type: recipeData.cuisine_type,
    diet_tags: recipeData.diet_tags,
    cooking_method: recipeData.cooking_method,
    season_occasion: recipeData.season_occasion,
    image_url: recipeData.image_url,
    source_url: recipeData.source_url,
    change_notes: changeNotes || 'Auto-saved version',
  });
};
