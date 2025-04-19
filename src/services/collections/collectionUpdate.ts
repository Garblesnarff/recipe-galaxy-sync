
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "sonner";

export const updateCollection = async (id: string, updates: Partial<Collection>): Promise<boolean> => {
  try {
    // Cast both the table name and the data being updated
    const { error } = await (supabase
      .from('collections' as any)
      .update({
        name: updates.name,
        description: updates.description,
        cover_image_url: updates.cover_image_url
      } as any)
      .eq('id', id)) as unknown as { error: any };

    if (error) throw error;
    
    toast.success("Collection updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating collection:", error);
    toast.error("Failed to update collection");
    return false;
  }
};
