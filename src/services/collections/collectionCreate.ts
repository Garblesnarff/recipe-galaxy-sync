
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "sonner";

export const createCollection = async (
  collection: Partial<Collection>,
  userId: string
): Promise<string | null> => {
  try {
    const { data, error } = await (supabase
      .from('collections' as any)
      .insert({
        name: collection.name,
        description: collection.description || '',
        cover_image_url: collection.cover_image_url,
        user_id: userId,
      } as any)
      .select('id')
      .single()) as unknown as { data: { id: string }, error: any };

    if (error) throw error;
    toast.success("Collection created successfully");
    return data.id;
  } catch (error) {
    toast.error("Failed to create collection");
    return null;
  }
};
