
import { Json } from "@/integrations/supabase/types";

export interface SaleItem {
  id: string;
  store_id: string;
  store_name?: string;
  item_name: string;
  sale_price: string;
  regular_price: string;
  discount_percentage: number;
  sale_ends_at: string;
  stores?: {
    name: string;
  };
}

export interface IngredientSale {
  ingredient: string;
  sales: SaleItem[];
}

export interface IngredientMatch {
  ingredient: string;
  matches: {
    canonical: string;
    variants: string[];
    matchType: 'direct' | 'canonical' | 'variant';
  }[];
}
