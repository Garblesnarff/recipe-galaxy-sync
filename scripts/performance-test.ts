/**
 * Performance Testing Script for Recipe Galaxy Sync
 *
 * This script measures performance metrics for recipe loading operations
 * to establish a baseline before optimization.
 *
 * Usage:
 *   npx tsx scripts/performance-test.ts
 *
 * Prerequisites:
 *   npm install --save-dev tsx @types/node
 */

import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Test configurations
const TEST_SIZES = [10, 20, 50, 100, 200];
const RECIPES_PER_PAGE = 20;

interface PerformanceMetrics {
  testSize: number;
  operation: string;
  duration: number;
  queryCount: number;
  dataSize: number;
  memoryUsed: number;
}

/**
 * Measure memory usage in MB
 */
function getMemoryUsage(): number {
  const used = process.memoryUsage();
  return Math.round(used.heapUsed / 1024 / 1024 * 100) / 100;
}

/**
 * Test 1: Basic recipe loading (current paginated approach)
 */
async function testPaginatedRecipeLoading(limit: number): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  let queryCount = 0;
  const allRecipes = [];

  // Simulate pagination
  const pageCount = Math.ceil(limit / RECIPES_PER_PAGE);

  for (let page = 0; page < pageCount; page++) {
    const start = page * RECIPES_PER_PAGE;
    const end = start + RECIPES_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .range(start, end)
      .order('created_at', { ascending: false });

    queryCount++;

    if (error) {
      console.error('Error fetching recipes:', error);
      break;
    }

    if (data) {
      allRecipes.push(...data);
    }

    // Break if we got fewer results than requested
    if (!data || data.length < RECIPES_PER_PAGE) {
      break;
    }
  }

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  return {
    testSize: limit,
    operation: 'Paginated Recipe Loading',
    duration: Math.round(endTime - startTime),
    queryCount,
    dataSize: allRecipes.length,
    memoryUsed: Math.round((endMemory - startMemory) * 100) / 100,
  };
}

/**
 * Test 2: Recipe loading with N+1 sales queries (current approach)
 */
async function testRecipeLoadingWithSales(limit: number): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  let queryCount = 0;

  // First, fetch recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, ingredients')
    .limit(limit)
    .order('created_at', { ascending: false });

  queryCount++;

  if (recipesError || !recipes) {
    console.error('Error fetching recipes:', recipesError);
    return {
      testSize: limit,
      operation: 'Recipe Loading with Sales (N+1)',
      duration: 0,
      queryCount: 0,
      dataSize: 0,
      memoryUsed: 0,
    };
  }

  // Simulate N+1 pattern: For each recipe, fetch sales data
  for (const recipe of recipes) {
    // Query 1: Get recipe ingredients (already have it, but in real app it's a separate query)
    queryCount++;

    // Query 2: Get all sales data
    const { data: salesData } = await supabase
      .from('sales' as any)
      .select(`
        id,
        store_id,
        item_name,
        sale_price,
        regular_price,
        discount_percentage,
        sale_ends_at,
        stores (
          name
        )
      `) as any;

    queryCount++;

    // Query 3: Get ingredient mappings
    const { data: mappingsData } = await supabase
      .from('ingredient_mappings' as any)
      .select('canonical_name, variant_names') as any;

    queryCount++;
  }

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  return {
    testSize: limit,
    operation: 'Recipe Loading with Sales (N+1)',
    duration: Math.round(endTime - startTime),
    queryCount,
    dataSize: recipes.length,
    memoryUsed: Math.round((endMemory - startMemory) * 100) / 100,
  };
}

/**
 * Test 3: Optimized approach - batch load sales data
 */
async function testOptimizedRecipeLoadingWithSales(limit: number): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  let queryCount = 0;

  // Fetch recipes
  const { data: recipes, error: recipesError } = await supabase
    .from('recipes')
    .select('id, ingredients')
    .limit(limit)
    .order('created_at', { ascending: false });

  queryCount++;

  if (recipesError || !recipes) {
    console.error('Error fetching recipes:', recipesError);
    return {
      testSize: limit,
      operation: 'Optimized Recipe Loading with Sales',
      duration: 0,
      queryCount: 0,
      dataSize: 0,
      memoryUsed: 0,
    };
  }

  // Fetch sales data ONCE for all recipes
  const { data: salesData } = await supabase
    .from('sales' as any)
    .select(`
      id,
      store_id,
      item_name,
      sale_price,
      regular_price,
      discount_percentage,
      sale_ends_at,
      stores (
        name
      )
    `) as any;

  queryCount++;

  // Fetch ingredient mappings ONCE
  const { data: mappingsData } = await supabase
    .from('ingredient_mappings' as any)
    .select('canonical_name, variant_names') as any;

  queryCount++;

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  return {
    testSize: limit,
    operation: 'Optimized Recipe Loading with Sales',
    duration: Math.round(endTime - startTime),
    queryCount,
    dataSize: recipes.length,
    memoryUsed: Math.round((endMemory - startMemory) * 100) / 100,
  };
}

/**
 * Test 4: Filter change performance
 */
async function testFilterChange(): Promise<PerformanceMetrics> {
  const startTime = performance.now();
  const startMemory = getMemoryUsage();

  let queryCount = 0;

  // Simulate multiple filter changes
  const filters = [
    { categories: ['Dinner'], cuisine_type: null },
    { categories: ['Dinner'], cuisine_type: 'Italian' },
    { categories: ['Breakfast'], cuisine_type: null },
    { categories: [], cuisine_type: 'Mexican' },
  ];

  for (const filter of filters) {
    let query = supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .range(0, RECIPES_PER_PAGE - 1);

    if (filter.categories.length > 0) {
      query = query.contains('categories', filter.categories);
    }

    if (filter.cuisine_type) {
      query = query.eq('cuisine_type', filter.cuisine_type);
    }

    await query;
    queryCount++;
  }

  const endTime = performance.now();
  const endMemory = getMemoryUsage();

  return {
    testSize: filters.length,
    operation: 'Filter Changes',
    duration: Math.round(endTime - startTime),
    queryCount,
    dataSize: filters.length,
    memoryUsed: Math.round((endMemory - startMemory) * 100) / 100,
  };
}

/**
 * Format results as a table
 */
function formatResults(metrics: PerformanceMetrics[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('PERFORMANCE TEST RESULTS');
  console.log('='.repeat(100));
  console.log(
    '\n' +
    '| Test Size | Operation                              | Duration (ms) | Queries | Data Items | Memory (MB) |'
  );
  console.log('|-----------|----------------------------------------|---------------|---------|------------|-------------|');

  metrics.forEach(m => {
    console.log(
      `| ${String(m.testSize).padEnd(9)} | ${m.operation.padEnd(38)} | ${String(m.duration).padEnd(13)} | ${String(m.queryCount).padEnd(7)} | ${String(m.dataSize).padEnd(10)} | ${String(m.memoryUsed).padEnd(11)} |`
    );
  });

  console.log('\n' + '='.repeat(100));
}

/**
 * Calculate performance improvements
 */
function calculateImprovements(results: PerformanceMetrics[]): void {
  const n1Results = results.filter(r => r.operation === 'Recipe Loading with Sales (N+1)');
  const optimizedResults = results.filter(r => r.operation === 'Optimized Recipe Loading with Sales');

  if (n1Results.length === 0 || optimizedResults.length === 0) {
    return;
  }

  console.log('\n' + '='.repeat(100));
  console.log('POTENTIAL IMPROVEMENTS (N+1 vs Optimized)');
  console.log('='.repeat(100));
  console.log('\n| Test Size | Time Saved (ms) | Time Saved (%) | Queries Reduced | Query Reduction (%) |');
  console.log('|-----------|-----------------|----------------|-----------------|---------------------|');

  for (let i = 0; i < Math.min(n1Results.length, optimizedResults.length); i++) {
    const n1 = n1Results[i];
    const opt = optimizedResults[i];

    const timeSaved = n1.duration - opt.duration;
    const timeSavedPercent = Math.round((timeSaved / n1.duration) * 100);
    const queriesReduced = n1.queryCount - opt.queryCount;
    const queriesReducedPercent = Math.round((queriesReduced / n1.queryCount) * 100);

    console.log(
      `| ${String(n1.testSize).padEnd(9)} | ${String(timeSaved).padEnd(15)} | ${String(timeSavedPercent).padEnd(14)} | ${String(queriesReduced).padEnd(15)} | ${String(queriesReducedPercent).padEnd(19)} |`
    );
  }

  console.log('\n' + '='.repeat(100));
}

/**
 * Main test runner
 */
async function runPerformanceTests(): Promise<void> {
  console.log('🚀 Starting Recipe Galaxy Performance Tests...\n');
  console.log(`Testing with Supabase at: ${SUPABASE_URL}\n`);

  const allResults: PerformanceMetrics[] = [];

  // Test 1: Paginated loading
  console.log('📊 Test 1: Paginated Recipe Loading (Current Implementation)');
  for (const size of TEST_SIZES) {
    try {
      console.log(`  Testing with ${size} recipes...`);
      const result = await testPaginatedRecipeLoading(size);
      allResults.push(result);
    } catch (error) {
      console.error(`  ❌ Error testing ${size} recipes:`, error);
    }
  }

  // Test 2: N+1 pattern with sales (only test smaller sizes to avoid long runs)
  console.log('\n📊 Test 2: Recipe Loading with Sales Data (N+1 Pattern)');
  const n1TestSizes = [10, 20]; // Limited to avoid excessive API calls
  for (const size of n1TestSizes) {
    try {
      console.log(`  Testing with ${size} recipes...`);
      const result = await testRecipeLoadingWithSales(size);
      allResults.push(result);
    } catch (error) {
      console.error(`  ❌ Error testing ${size} recipes:`, error);
    }
  }

  // Test 3: Optimized approach
  console.log('\n📊 Test 3: Optimized Recipe Loading with Sales Data (Batched)');
  for (const size of n1TestSizes) {
    try {
      console.log(`  Testing with ${size} recipes...`);
      const result = await testOptimizedRecipeLoadingWithSales(size);
      allResults.push(result);
    } catch (error) {
      console.error(`  ❌ Error testing ${size} recipes:`, error);
    }
  }

  // Test 4: Filter changes
  console.log('\n📊 Test 4: Filter Change Performance');
  try {
    const result = await testFilterChange();
    allResults.push(result);
  } catch (error) {
    console.error('  ❌ Error testing filter changes:', error);
  }

  // Display results
  formatResults(allResults);
  calculateImprovements(allResults);

  console.log('\n✅ Performance testing complete!\n');
  console.log('📝 Key Findings:');
  console.log('   - N+1 pattern creates 3 queries per recipe card');
  console.log('   - Optimizing to batch queries can save 90%+ of queries');
  console.log('   - Current page size of 20 is within recommended range (10-20)');
  console.log('   - Filter changes trigger new queries (expected with React Query)');
  console.log('\n📄 See docs/PERFORMANCE_BASELINE.md for detailed analysis\n');
}

// Run the tests
runPerformanceTests()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
