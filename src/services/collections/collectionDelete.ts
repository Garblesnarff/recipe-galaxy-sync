
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const deleteCollection = async (id: string): Promise<boolean> => {
  try {
    // Cast to any type to bypass TypeScript table checking
    const { error } = await supabase
      .from('collections' as any)
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Collection deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting collection:", error);
    toast.error("Failed to delete collection");
    return false;
  }
};
