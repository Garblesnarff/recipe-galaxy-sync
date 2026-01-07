-- Create recipe versioning and nutrition tables
-- Migration: 002_create_recipe_versioning_nutrition

-- Recipe versions table for tracking changes over time
CREATE TABLE recipe_versions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL,
  instructions TEXT,
  prep_time TEXT,
  cook_time TEXT,
  servings INTEGER DEFAULT 1,
  difficulty TEXT,
  categories TEXT[],
  cuisine_type TEXT,
  diet_tags TEXT[],
  cooking_method TEXT,
  season_occasion TEXT[],
  image_url TEXT,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  change_notes TEXT,
  UNIQUE(recipe_id, version_number)
);

-- Ingredient nutrition table for manual nutrition data entry
CREATE TABLE ingredient_nutrition (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT, -- e.g., 'vegetable', 'protein', 'grain'
  serving_size_grams DECIMAL(8,2) DEFAULT 100,
  calories_per_100g DECIMAL(8,2),
  protein_per_100g DECIMAL(8,2),
  carbs_per_100g DECIMAL(8,2),
  fat_per_100g DECIMAL(8,2),
  fiber_per_100g DECIMAL(8,2),
  sugar_per_100g DECIMAL(8,2),
  sodium_per_100g DECIMAL(8,2),
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Recipe nutrition table for calculated nutritional info
CREATE TABLE recipe_nutrition (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE,
  version_number INTEGER DEFAULT 1,
  servings INTEGER DEFAULT 1,
  calories_per_serving DECIMAL(8,2),
  protein_per_serving DECIMAL(8,2),
  carbs_per_serving DECIMAL(8,2),
  fat_per_serving DECIMAL(8,2),
  fiber_per_serving DECIMAL(8,2),
  sugar_per_serving DECIMAL(8,2),
  sodium_per_serving DECIMAL(8,2),
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(recipe_id, version_number)
);

-- Unit conversions table for manual conversion factors
CREATE TABLE unit_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_unit TEXT NOT NULL,
  to_unit TEXT NOT NULL,
  conversion_factor DECIMAL(12,6) NOT NULL,
  ingredient_category TEXT, -- NULL means general conversion
  created_by UUID REFERENCES auth.users(id),
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(from_unit, to_unit, ingredient_category)
);

-- Create indexes
CREATE INDEX idx_recipe_versions_recipe_id ON recipe_versions(recipe_id);
CREATE INDEX idx_recipe_versions_created_at ON recipe_versions(created_at);
CREATE INDEX idx_ingredient_nutrition_name ON ingredient_nutrition(name);
CREATE INDEX idx_ingredient_nutrition_category ON ingredient_nutrition(category);
CREATE INDEX idx_recipe_nutrition_recipe_id ON recipe_nutrition(recipe_id);
CREATE INDEX idx_unit_conversions_from_to ON unit_conversions(from_unit, to_unit);

-- Enable RLS
ALTER TABLE recipe_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_nutrition ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own recipe versions" ON recipe_versions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_versions.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage nutrition data they created" ON ingredient_nutrition
  FOR ALL USING (
    auth.uid() = created_by OR is_public = true
  );

CREATE POLICY "Users can view recipe nutrition for their recipes" ON recipe_nutrition
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM recipes
      WHERE recipes.id = recipe_nutrition.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage their unit conversions" ON unit_conversions
  FOR ALL USING (
    auth.uid() = created_by OR is_public = true
  );

-- Insert some common unit conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor, is_public) VALUES
  ('cup', 'ml', 236.588, true),
  ('cup', 'grams', 120.0, true), -- approximate for water
  ('tablespoon', 'ml', 14.787, true),
  ('teaspoon', 'ml', 4.929, true),
  ('pound', 'grams', 453.592, true),
  ('ounce', 'grams', 28.35, true),
  ('inch', 'cm', 2.54, true);

-- Insert common ingredient nutrition data
INSERT INTO ingredient_nutrition (name, category, serving_size_grams, calories_per_100g, protein_per_100g, carbs_per_100g, fat_per_100g, fiber_per_100g, is_public) VALUES
  ('Chicken Breast', 'protein', 100, 165, 31, 0, 3.6, 0, true),
  ('Brown Rice', 'grain', 100, 111, 2.6, 23, 0.9, 1.8, true),
  ('Broccoli', 'vegetable', 100, 34, 2.8, 7, 0.4, 2.6, true),
  ('Olive Oil', 'fat', 100, 884, 0, 0, 100, 0, true),
  ('Eggs', 'protein', 100, 155, 13, 1.1, 11, 0, true),
  ('Salmon', 'protein', 100, 208, 20, 0, 13, 0, true),
  ('Quinoa', 'grain', 100, 368, 14, 64, 6, 7, true),
  ('Spinach', 'vegetable', 100, 23, 2.9, 3.6, 0.4, 2.2, true),
  ('Almonds', 'nut', 100, 579, 21, 22, 50, 13, true),
  ('Greek Yogurt', 'dairy', 100, 59, 10, 3.6, 0.4, 0, true);

-- Trigger to automatically update updated_at
CREATE TRIGGER update_ingredient_nutrition_updated_at
  BEFORE UPDATE ON ingredient_nutrition
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
