
export interface Collection {
  id: string;
  name: string;
  description?: string | null;
  cover_image_url?: string | null;
  created_at: string;
  updated_at: string;
  recipe_count?: number;
}

export interface CollectionRecipe {
  id: string;
  collection_id: string;
  recipe_id: string;
  created_at: string;
}
