
ALTER TABLE recipes 
ADD COLUMN recipe_type TEXT 
CHECK (recipe_type IN ('manual', 'webpage', 'youtube')) 
DEFAULT 'manual';
