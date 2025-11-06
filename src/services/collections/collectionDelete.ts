
import { supabase } from "@/integrations/supabase/client";
import { SupabaseError } from "@/types/adaptedRecipe";
import { toast } from "sonner";

export const deleteCollection = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id) as unknown as { error: SupabaseError | null };

    if (error) throw error;

    toast.success("Collection deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting collection:", error);
    toast.error("Failed to delete collection");
    return false;
  }
};
