
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "sonner";

export const createCollection = async (collection: Partial<Collection>): Promise<string | null> => {
  try {
    // Using 'any' type assertion to bypass TypeScript's table checking
    // since our collections table exists in the database but not in the TypeScript definitions
    const { data, error } = await (supabase
      .from('collections') as any)
      .insert({
        name: collection.name,
        description: collection.description || '',
        cover_image_url: collection.cover_image_url
      })
      .select('id')
      .single();

    if (error) throw error;
    
    toast.success("Collection created successfully");
    return data.id;
  } catch (error) {
    console.error("Error creating collection:", error);
    toast.error("Failed to create collection");
    return null;
  }
};
