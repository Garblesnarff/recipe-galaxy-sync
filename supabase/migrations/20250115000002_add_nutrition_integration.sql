-- Create nutrition integration tables

-- Workout Recipes Table - Links recipes to workouts for meal timing
CREATE TABLE workout_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  meal_timing TEXT CHECK (meal_timing IN ('pre_workout', 'post_workout', 'recovery')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  UNIQUE(workout_id, recipe_id, meal_timing)
);

-- Meal Plans Table - User's meal plans
CREATE TABLE meal_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  total_calories INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Meal Plan Recipes Table - Recipes in a meal plan
CREATE TABLE meal_plan_recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_plan_id UUID REFERENCES meal_plans(id) ON DELETE CASCADE NOT NULL,
  recipe_id UUID REFERENCES recipes(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL CHECK (day_number >= 1 AND day_number <= 7),
  meal_type TEXT CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create indexes for better query performance
CREATE INDEX idx_workout_recipes_workout_id ON workout_recipes(workout_id);
CREATE INDEX idx_workout_recipes_recipe_id ON workout_recipes(recipe_id);
CREATE INDEX idx_workout_recipes_meal_timing ON workout_recipes(meal_timing);

CREATE INDEX idx_meal_plans_user_id ON meal_plans(user_id);
CREATE INDEX idx_meal_plans_created_at ON meal_plans(created_at);

CREATE INDEX idx_meal_plan_recipes_plan_id ON meal_plan_recipes(meal_plan_id);
CREATE INDEX idx_meal_plan_recipes_recipe_id ON meal_plan_recipes(recipe_id);
CREATE INDEX idx_meal_plan_recipes_day_number ON meal_plan_recipes(day_number);
CREATE INDEX idx_meal_plan_recipes_meal_type ON meal_plan_recipes(meal_type);

-- Enable Row Level Security
ALTER TABLE workout_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_plan_recipes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workout_recipes
CREATE POLICY "Users can view recipe links for their workouts"
  ON workout_recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_recipes.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can link recipes to their workouts"
  ON workout_recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_recipes.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipe links in their workouts"
  ON workout_recipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_recipes.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipe links from their workouts"
  ON workout_recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM workouts
      WHERE workouts.id = workout_recipes.workout_id
      AND workouts.user_id = auth.uid()
    )
  );

-- RLS Policies for meal_plans
CREATE POLICY "Users can view their own meal plans"
  ON meal_plans FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own meal plans"
  ON meal_plans FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own meal plans"
  ON meal_plans FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own meal plans"
  ON meal_plans FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for meal_plan_recipes
CREATE POLICY "Users can view recipes in their meal plans"
  ON meal_plan_recipes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add recipes to their meal plans"
  ON meal_plan_recipes FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update recipes in their meal plans"
  ON meal_plan_recipes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete recipes from their meal plans"
  ON meal_plan_recipes FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM meal_plans
      WHERE meal_plans.id = meal_plan_recipes.meal_plan_id
      AND meal_plans.user_id = auth.uid()
    )
  );
