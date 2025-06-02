
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Check if the scrape-sales function is healthy and deployed
 */
export const checkSalesScrapingHealth = async (): Promise<boolean> => {
  try {
    console.log('🩺 Checking scrape-sales function health...');
    
    const { data, error } = await supabase.functions.invoke("scrape-sales", {
      body: { health: true }
    });
    
    if (error) {
      console.error("❌ Health check failed:", error);
      toast.error("Sales scraping service is not available");
      return false;
    }
    
    if (data?.status === 'healthy') {
      console.log('✅ Sales scraping service is healthy');
      toast.success("Sales scraping service is running");
      return true;
    } else {
      console.warn("⚠️ Unexpected health check response:", data);
      toast.warning("Sales scraping service responded unexpectedly");
      return false;
    }
  } catch (error) {
    console.error("❌ Error checking sales scraping health:", error);
    toast.error("Failed to check sales scraping service");
    return false;
  }
};

/**
 * Trigger a manual scrape of sales data
 */
export const triggerSalesScrape = async (): Promise<boolean> => {
  try {
    console.log('🚀 Triggering sales scrape...');
    
    const { data, error } = await supabase.functions.invoke("scrape-sales");
    
    if (error) {
      console.error("❌ Error triggering sales scrape:", error);
      toast.error(`Failed to update sales data: ${error.message}`);
      return false;
    }
    
    if (data?.success) {
      const summary = data.summary;
      if (summary) {
        toast.success(`Sales data updated! Processed ${summary.stores_processed} stores (${summary.successful} successful, ${summary.failed} failed)`);
      } else {
        toast.success("Sales data updated successfully");
      }
      console.log('✅ Sales scrape completed:', data);
      return true;
    } else {
      const errorMsg = data?.error || "Unknown error occurred";
      toast.error(`Failed to update sales data: ${errorMsg}`);
      console.error("❌ Sales scrape failed:", data);
      return false;
    }
  } catch (error) {
    console.error("❌ Error in triggerSalesScrape:", error);
    toast.error("An error occurred while updating sales data");
    return false;
  }
};
