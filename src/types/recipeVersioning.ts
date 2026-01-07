/**
 * Recipe Versioning Types
 * Types for recipe version tracking and management
 */

export interface RecipeVersion {
  id: string;
  recipe_id: string;
  version_number: number;
  title: string;
  description?: string;
  ingredients: any[]; // JSONB in database
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
  created_at: string;
  change_notes?: string;
}

export interface RecipeChange {
  field: string;
  old_value: any;
  new_value: any;
  change_type: 'added' | 'removed' | 'modified' | 'reordered';
}

export interface VersionComparison {
  from_version: RecipeVersion;
  to_version: RecipeVersion;
  changes: RecipeChange[];
  summary: {
    fields_changed: number;
    ingredients_changed: number;
    instructions_changed: boolean;
    metadata_changed: boolean;
  };
}

export interface UnitConversion {
  id: string;
  from_unit: string;
  to_unit: string;
  conversion_factor: number;
  ingredient_category?: string;
  created_by?: string;
  is_public: boolean;
  created_at: string;
}

export interface ScaledIngredient {
  original: string;
  scaled: string;
  amount: number;
  unit: string;
  conversion_applied?: {
    from_unit: string;
    to_unit: string;
    factor: number;
  };
}

export interface RecipeScaling {
  original_servings: number;
  target_servings: number;
  scale_factor: number;
  scaled_ingredients: ScaledIngredient[];
  warnings?: string[];
}

export interface VersionMetadata {
  version_number: number;
  created_at: string;
  change_notes?: string;
  author?: string;
  is_current: boolean;
  changes_count?: number;
}

export interface RecipeVersionHistory {
  recipe_id: string;
  current_version: number;
  versions: VersionMetadata[];
  total_versions: number;
}

export interface VersionRestoreOptions {
  create_new_version?: boolean;
  change_notes?: string;
  target_version_number?: number;
}
