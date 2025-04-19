
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const deleteCollection = async (id: string): Promise<boolean> => {
  try {
    // Use a more direct type assertion approach
    const { error } = await supabase
      .from('collections')
      .delete()
      .eq('id', id) as any;

    if (error) throw error;
    
    toast.success("Collection deleted successfully");
    return true;
  } catch (error) {
    console.error("Error deleting collection:", error);
    toast.error("Failed to delete collection");
    return false;
  }
};
