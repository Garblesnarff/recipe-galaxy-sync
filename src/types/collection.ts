
export interface Collection {
  id: string;
  name: string;
  description?: string;
  cover_image_url?: string;
  created_at: string;
  updated_at: string;
  recipe_count?: number;
}

export interface CollectionRecipe {
  collection_id: string;
  recipe_id: string;
}
