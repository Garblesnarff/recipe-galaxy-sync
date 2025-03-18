
export interface IngredientClassification {
  id: string;
  ingredient_name: string;
  contains_gluten: boolean;
  contains_dairy: boolean;
  contains_eggs: boolean;
  contains_nuts: boolean;
  contains_soy: boolean;
  contains_meat: boolean;
  is_animal_product: boolean;
}

export interface IngredientSubstitution {
  id: string;
  original_ingredient: string;
  substitute_ingredient: string;
  dietary_restriction: string;
  substitution_context: string | null;
  substitution_ratio: number;
  notes: string | null;
}

export type DietaryRestriction = 
  | 'gluten-free'
  | 'dairy-free'
  | 'egg-free'
  | 'nut-free'
  | 'soy-free'
  | 'vegetarian'
  | 'vegan';

export interface IngredientWithWarnings {
  text: string;
  warnings: {
    restriction: DietaryRestriction;
    ingredient: string;
  }[];
  substitutions: IngredientSubstitution[];
}
