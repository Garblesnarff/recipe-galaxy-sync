
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { SupabaseError } from "@/types/adaptedRecipe";
import { toast } from "sonner";

export const createCollection = async (
  collection: Partial<Collection>,
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('collections')
      .insert({
        name: collection.name,
        description: collection.description || '',
        cover_image_url: collection.cover_image_url,
        user_id: userId,
      })
      .select('id')
      .single() as unknown as { data: { id: string } | null, error: SupabaseError | null };

    if (error) throw error;
    if (!data) throw new Error("No data returned from collection creation");
    toast.success("Collection created successfully");
    return data.id;
  } catch (error) {
    toast.error("Failed to create collection");
    return null;
  }
};
