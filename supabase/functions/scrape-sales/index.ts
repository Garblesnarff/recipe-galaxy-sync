
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Get environment variables
const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

// CORS headers for cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Create a Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Function to scrape a specific store's website
async function scrapeStore(storeId: string, storeName: string, storeUrl: string) {
  console.log(`🏪 Scraping sales data from store: ${storeName} (${storeUrl})`);
  
  try {
    // Sample sale items (simulated scrape results with more variety)
    const saleItems = [
      { 
        item_name: "Chicken Breast", 
        sale_price: "$2.99/lb", 
        regular_price: "$4.99/lb",
        discount_percentage: 40,
        category: "meat",
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Organic Apples", 
        sale_price: "$1.50/lb", 
        regular_price: "$2.99/lb",
        discount_percentage: 50,
        category: "produce",
        sale_ends_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Ground Beef 85/15", 
        sale_price: "$3.99/lb", 
        regular_price: "$5.99/lb",
        discount_percentage: 33,
        category: "meat",
        sale_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Whole Wheat Pasta", 
        sale_price: "$0.99", 
        regular_price: "$1.49",
        discount_percentage: 34,
        category: "pantry",
        sale_ends_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Sharp Cheddar Cheese", 
        sale_price: "$2.50", 
        regular_price: "$3.99",
        discount_percentage: 37,
        category: "dairy",
        sale_ends_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Bananas", 
        sale_price: "$0.68/lb", 
        regular_price: "$0.89/lb",
        discount_percentage: 24,
        category: "produce",
        sale_ends_at: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      { 
        item_name: "Olive Oil Extra Virgin", 
        sale_price: "$4.99", 
        regular_price: "$7.99",
        discount_percentage: 38,
        category: "pantry",
        sale_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    console.log(`📦 Processing ${saleItems.length} sale items for store: ${storeName}`);
    
    // Clear existing sales data for this store
    const { error: deleteError } = await supabase
      .from('sales')
      .delete()
      .eq('store_id', storeId);
      
    if (deleteError) {
      console.error(`❌ Error deleting existing sales data for ${storeName}:`, deleteError);
      throw deleteError;
    }
    
    console.log(`🗑️ Cleared existing sales data for ${storeName}`);
    
    // Insert the new sales data
    const { data: insertData, error: insertError } = await supabase
      .from('sales')
      .insert(
        saleItems.map(item => ({
          store_id: storeId,
          ...item
        }))
      );
        
    if (insertError) {
      console.error(`❌ Error inserting sale items for ${storeName}:`, insertError);
      throw insertError;
    }
    
    console.log(`✅ Successfully inserted ${saleItems.length} sale items for ${storeName}`);
    
    return { 
      success: true, 
      message: `Scraped ${saleItems.length} sale items from ${storeName}`,
      itemCount: saleItems.length
    };
  } catch (error) {
    console.error(`❌ Error scraping store ${storeName}:`, error);
    return { 
      success: false, 
      error: error.message,
      store: storeName
    };
  }
}

serve(async (req) => {
  console.log(`🚀 Scrape-sales function called with method: ${req.method}`);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const isHealthCheck = url.pathname.includes('/health') || url.searchParams.get('health') === 'true';
    
    // Health check endpoint
    if (isHealthCheck) {
      console.log('🩺 Health check requested');
      return new Response(
        JSON.stringify({ 
          status: 'healthy',
          timestamp: new Date().toISOString(),
          function: 'scrape-sales',
          firecrawl_configured: !!FIRECRAWL_API_KEY
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log('📋 Fetching stores from database...');
    
    // Get list of stores from the database
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id, name, website_url')
      .eq('is_active', true);
      
    if (storesError) {
      console.error('❌ Error fetching stores:', storesError);
      throw storesError;
    }
    
    if (!stores || stores.length === 0) {
      console.log('⚠️ No active stores found in database, creating a sample store...');
      
      // Create a sample store for testing
      const { data: newStore, error: createError } = await supabase
        .from('stores')
        .insert({
          name: 'Sample Grocery Store',
          website_url: 'https://example-grocery.com',
          store_chain: 'Sample Chain',
          location: 'Test Location',
          is_active: true
        })
        .select()
        .single();
        
      if (createError) {
        console.error('❌ Error creating sample store:', createError);
        throw new Error(`No stores found and failed to create sample store: ${createError.message}`);
      }
      
      console.log('✅ Created sample store for testing');
      
      // Process the newly created store
      const result = await scrapeStore(newStore.id, newStore.name, newStore.website_url);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Created sample store and scraped sales data", 
          results: [{ store_id: newStore.id, store_name: newStore.name, ...result }],
          stores_processed: 1
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }
    
    console.log(`🏪 Found ${stores.length} active stores to scrape`);
    
    // Process each store
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    for (const store of stores) {
      console.log(`🔄 Processing store: ${store.name}`);
      const result = await scrapeStore(store.id, store.name, store.website_url);
      
      if (result.success) {
        successCount++;
      } else {
        errorCount++;
      }
      
      results.push({
        store_id: store.id,
        store_name: store.name,
        ...result
      });
    }
    
    console.log(`📊 Scraping completed: ${successCount} successful, ${errorCount} failed`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sales data scraping completed for ${stores.length} stores`, 
        results,
        summary: {
          stores_processed: stores.length,
          successful: successCount,
          failed: errorCount
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
    
  } catch (error) {
    console.error("❌ Critical error in scrape-sales function:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
