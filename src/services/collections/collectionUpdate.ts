
import { supabase } from "@/integrations/supabase/client";
import { Collection } from "@/types/collection";
import { toast } from "sonner";

export const updateCollection = async (id: string, updates: Partial<Collection>): Promise<boolean> => {
  try {
    // Use a more direct type assertion approach
    const { error } = await supabase
      .from('collections')
      .update({
        name: updates.name,
        description: updates.description,
        cover_image_url: updates.cover_image_url
      })
      .eq('id', id) as any;

    if (error) throw error;
    
    toast.success("Collection updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating collection:", error);
    toast.error("Failed to update collection");
    return false;
  }
};
