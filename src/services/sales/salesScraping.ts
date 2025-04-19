
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Trigger a manual scrape of sales data
 */
export const triggerSalesScrape = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("scrape-sales");
    
    if (error) {
      console.error("Error triggering sales scrape:", error);
      toast.error("Failed to update sales data");
      return false;
    }
    
    if (data?.success) {
      toast.success("Sales data updated successfully");
      return true;
    } else {
      toast.error("Failed to update sales data: " + (data?.error || "Unknown error"));
      return false;
    }
  } catch (error) {
    console.error("Error in triggerSalesScrape:", error);
    toast.error("An error occurred while updating sales data");
    return false;
  }
};
