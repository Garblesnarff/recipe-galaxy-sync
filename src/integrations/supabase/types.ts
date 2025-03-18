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
          collection_id: string | null
          created_at: string
          id: string
          recipe_id: string | null
        }
        Insert: {
          collection_id?: string | null
          created_at?: string
          id?: string
          recipe_id?: string | null
        }
        Update: {
          collection_id?: string | null
          created_at?: string
          id?: string
          recipe_id?: string | null
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
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          created_at: string
          id: string
          updated_at: string
          variant_names: string[]
        }
        Insert: {
          canonical_name: string
          category?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          variant_names?: string[]
        }
        Update: {
          canonical_name?: string
          category?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          variant_names?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          dietary_preferences: string[] | null
          display_name: string | null
          favorite_cuisines: string[] | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          display_name?: string | null
          favorite_cuisines?: string[] | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          dietary_preferences?: string[] | null
          display_name?: string | null
          favorite_cuisines?: string[] | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          categories: string[] | null
          cook_time: string | null
          cooking_method: string | null
          created_at: string
          cuisine_type: string | null
          description: string
          diet_tags: string[] | null
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: string
          is_favorite: boolean | null
          prep_time: string | null
          rating: number | null
          ratings: Json | null
          recipe_type: string | null
          season_occasion: string[] | null
          servings: number | null
          source_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          categories?: string[] | null
          cook_time?: string | null
          cooking_method?: string | null
          created_at?: string
          cuisine_type?: string | null
          description: string
          diet_tags?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions: string
          is_favorite?: boolean | null
          prep_time?: string | null
          rating?: number | null
          ratings?: Json | null
          recipe_type?: string | null
          season_occasion?: string[] | null
          servings?: number | null
          source_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          categories?: string[] | null
          cook_time?: string | null
          cooking_method?: string | null
          created_at?: string
          cuisine_type?: string | null
          description?: string
          diet_tags?: string[] | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: string
          is_favorite?: boolean | null
          prep_time?: string | null
          rating?: number | null
          ratings?: Json | null
          recipe_type?: string | null
          season_occasion?: string[] | null
          servings?: number | null
          source_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      sales: {
        Row: {
          created_at: string
          discount_percentage: number | null
          id: string
          item_name: string
          regular_price: string | null
          sale_ends_at: string | null
          sale_price: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          item_name: string
          regular_price?: string | null
          sale_ends_at?: string | null
          sale_price?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_percentage?: number | null
          id?: string
          item_name?: string
          regular_price?: string | null
          sale_ends_at?: string | null
          sale_price?: string | null
          store_id?: string
          updated_at?: string
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
          created_at: string
          id: string
          name: string
          scraper_config: Json | null
          updated_at: string
          website_url: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          scraper_config?: Json | null
          updated_at?: string
          website_url: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          scraper_config?: Json | null
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      video_processing: {
        Row: {
          created_at: string
          error: string | null
          id: string
          metadata: Json | null
          owner_id: string | null
          status: string
          updated_at: string
          video_url: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string | null
          status?: string
          updated_at?: string
          video_url: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          metadata?: Json | null
          owner_id?: string | null
          status?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_recipe_organization_fields: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
