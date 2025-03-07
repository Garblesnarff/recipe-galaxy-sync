
export interface GroceryItem {
  id: string;
  user_id?: string;
  recipe_id?: string;
  item_name: string;
  quantity?: string;
  unit?: string;
  category?: string;
  is_purchased: boolean;
  created_at: string;
}
