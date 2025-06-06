export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      collection_recipes: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          recipe_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          recipe_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_recipes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      grocery_items: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_purchased: boolean
          item_name: string
          quantity: string | null
          recipe_id: string | null
          unit: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean
          item_name: string
          quantity?: string | null
          recipe_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean
          item_name?: string
          quantity?: string | null
          recipe_id?: string | null
          unit?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "grocery_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_mappings: {
        Row: {
          canonical_name: string
          category: string | null
          created_at: string | null
          id: string
          updated_at: string | null
          variant_names: string[] | null
        }
        Insert: {
          canonical_name: string
          category?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          variant_names?: string[] | null
        }
        Update: {
          canonical_name?: string
          category?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
          variant_names?: string[] | null
        }
        Relationships: []
      }
      recipes: {
        Row: {
          categories: string[] | null
          cook_time: string | null
          cooking_method: string | null
          created_at: string | null
          cuisine_type: string | null
          description: string | null
          diet_tags: string[] | null
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: Json | null
          instructions: string | null
          is_favorite: boolean | null
          prep_time: string | null
          rating: number | null
          ratings: Json | null
          recipe_type: string | null
          season_occasion: string[] | null
          servings: number | null
          source_type: string | null
          source_url: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          categories?: string[] | null
          cook_time?: string | null
          cooking_method?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          is_favorite?: boolean | null
          prep_time?: string | null
          rating?: number | null
          ratings?: Json | null
          recipe_type?: string | null
          season_occasion?: string[] | null
          servings?: number | null
          source_type?: string | null
          source_url?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          categories?: string[] | null
          cook_time?: string | null
          cooking_method?: string | null
          created_at?: string | null
          cuisine_type?: string | null
          description?: string | null
          diet_tags?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json | null
          instructions?: string | null
          is_favorite?: boolean | null
          prep_time?: string | null
          rating?: number | null
          ratings?: Json | null
          recipe_type?: string | null
          season_occasion?: string[] | null
          servings?: number | null
          source_type?: string | null
          source_url?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          category: string | null
          created_at: string | null
          discount_percentage: number
          id: string
          image_url: string | null
          item_name: string
          regular_price: string
          sale_ends_at: string | null
          sale_price: string
          store_id: string | null
          upc_code: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          discount_percentage: number
          id?: string
          image_url?: string | null
          item_name: string
          regular_price: string
          sale_ends_at?: string | null
          sale_price: string
          store_id?: string | null
          upc_code?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          discount_percentage?: number
          id?: string
          image_url?: string | null
          item_name?: string
          regular_price?: string
          sale_ends_at?: string | null
          sale_price?: string
          store_id?: string | null
          upc_code?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          location: string | null
          name: string
          scrape_config: Json | null
          scrape_url: string | null
          store_chain: string | null
          updated_at: string | null
          website_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name: string
          scrape_config?: Json | null
          scrape_url?: string | null
          store_chain?: string | null
          updated_at?: string | null
          website_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          name?: string
          scrape_config?: Json | null
          scrape_url?: string | null
          store_chain?: string | null
          updated_at?: string | null
          website_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
