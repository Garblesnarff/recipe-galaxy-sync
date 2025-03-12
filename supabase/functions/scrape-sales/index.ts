
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get the Firecrawl API key from environment variables
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') ?? '';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Function to scrape a specific store's website
async function scrapeStore(storeId: string, storeUrl: string) {
  console.log(`Scraping sales data from store: ${storeUrl}`);
  
  if (!FIRECRAWL_API_KEY) {
    throw new Error("FIRECRAWL_API_KEY is not set");
  }
  
  try {
    // Here we would use Firecrawl API to scrape the store website
    // For now, let's simulate the scraping with sample data
    
    // In a real implementation, we would:
    // 1. Use Firecrawl to get the HTML of the store's sale/weekly ad page
    // 2. Parse the HTML to extract sale items
    // 3. Process and normalize the data

    // Sample sale items (simulated scrape results)
    const saleItems = [
      { 
        item_name: "Chicken Breast", 
        sale_price: "$2.99/lb", 
        regular_price: "$4.99/lb",
        discount_percentage: 40,
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Organic Apples", 
        sale_price: "$1.50/lb", 
        regular_price: "$2.99/lb",
        discount_percentage: 50,
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Ground Beef", 
        sale_price: "$3.99/lb", 
        regular_price: "$5.99/lb",
        discount_percentage: 33,
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Pasta", 
        sale_price: "$0.99", 
        regular_price: "$1.49",
        discount_percentage: 34,
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Cheese", 
        sale_price: "$2.50", 
        regular_price: "$3.99",
        discount_percentage: 37,
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    // Clear existing sales data for this store
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('store_id', storeId);
      
    if (deleteError) {
      console.error("Error deleting existing sales data:", deleteError);
      throw deleteError;
    }
    
    // Insert the new sales data
    for (const item of saleItems) {
      const { error: insertError } = await supabase
        .from('sales')
        .insert({
          store_id: storeId,
          ...item
        });
        
      if (insertError) {
        console.error("Error inserting sale item:", insertError);
      }
    }
    
    return { success: true, message: `Scraped ${saleItems.length} sale items from ${storeUrl}` };
  } catch (error) {
    console.error(`Error scraping store ${storeUrl}:`, error);
    return { success: false, error: error.message };
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    // Get list of stores from the database
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, website_url');
      
    if (storesError) {
      throw storesError;
    }
    
    if (!stores || stores.length === 0) {
      throw new Error("No stores found in the database");
    }
    
    console.log(`Found ${stores.length} stores to scrape`);
    
    // Process each store
    const results = [];
    for (const store of stores) {
      const result = await scrapeStore(store.id, store.website_url);
      results.push({
        store_id: store.id,
        store_name: store.name,
        ...result
      });
    }
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Sales data scraping completed", 
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error in scrape-sales function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
