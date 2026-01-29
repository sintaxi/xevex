#!/usr/bin/env node

/**
 * Example: Server-Side Cache with Real-Time Updates
 *
 * This test demonstrates a real-time caching layer using Convex subscriptions.
 * It will fail if the Convex backend is not properly configured.
 *
 * Prerequisites:
 *   - Convex running at http://127.0.0.1:6790 (or CONVEX_URL)
 *   - At least ONE of these queries must exist and return data:
 *     * products:featured
 *     * settings:app
 *     * categories:list
 *
 * Usage:
 *   node examples/server/cache.js
 *
 * This test will:
 *   1. Connect to Convex
 *   2. Subscribe to multiple queries
 *   3. Wait for data to arrive
 *   4. Verify cache hit/miss tracking works
 *   5. Verify data is accessible synchronously
 *   6. Exit with success/failure status
 */

const { create } = require('../../dist/cjs/index.js');
const { loadConvexUrl } = require('./_loadEnv.js');

const CONVEX_URL = loadConvexUrl();
const TIMEOUT_MS = 5000;

console.log('=== Xevex Server-Side Cache Test ===\n');
console.log('Connecting to:', CONVEX_URL);
console.log('Timeout:', TIMEOUT_MS + 'ms\n');

// Create cache store
const useCache = create((set, get) => ({
  hits: 0,
  misses: 0,
  dataReceived: false,

  recordHit: () => set(state => ({ hits: state.hits + 1 })),
  recordMiss: () => set(state => ({ misses: state.misses + 1 })),
  markDataReceived: () => set({ dataReceived: true }),

  getStats: () => {
    const state = get();
    return {
      hits: state.hits,
      misses: state.misses,
      hitRate: state.hits / (state.hits + state.misses) || 0
    };
  }
}));

// Connect to Convex
console.log('[CONNECT] Connecting to Convex...');
useCache.connect(CONVEX_URL);
const state = useCache.getState();
const client = state.getClient();

if (!client) {
  console.error('❌ Failed to create Convex client');
  process.exit(1);
}

console.log('✅ Connected\n');

// Subscribe to multiple queries
const queries = [
  'products:featured',
  'settings:app',
  'categories:list'
];

console.log('[SUBSCRIBE] Setting up subscriptions:');
queries.forEach(queryName => {
  state.subscribe(queryName, {});
  console.log(`  - ${queryName}`);
});
console.log('✅ Subscribed\n');

// Monitor for data
let dataArrived = false;

const unsubscribe = useCache.subscribe((newState) => {
  const queriesData = Object.values(newState.queries);
  const hasData = queriesData.some(data => data !== null && data !== undefined);

  if (hasData && !dataArrived) {
    dataArrived = true;
    newState.markDataReceived();

    console.log('[DATA] Received data from subscriptions:');
    Object.entries(newState.queries).forEach(([token, data]) => {
      const type = Array.isArray(data) ? `array[${data.length}]` : typeof data;
      console.log(`  - ${type}`);
    });
    console.log('');
  }
});

// Get cached data function
function getCachedData(key) {
  const state = useCache.getState();
  const queries = Object.values(state.queries);

  for (const data of queries) {
    if (data !== null && data !== undefined) {
      state.recordHit();
      return data;
    }
  }

  state.recordMiss();
  return null;
}

// Wait for data, then test cache
setTimeout(() => {
  unsubscribe();

  console.log('[TEST] Testing cache functionality\n');

  if (!dataArrived) {
    console.log('='.repeat(50));
    console.error('❌ FAILED: No data received from Convex');
    console.log('='.repeat(50));
    console.log('\nPossible issues:');
    console.log('  1. None of the queries exist in your schema:');
    queries.forEach(q => console.log(`     - ${q}`));
    console.log('  2. Queries exist but return no data');
    console.log('  3. Convex connection failed');
    console.log('\nTo fix:');
    console.log('  1. See CONVEX-SCHEMA-EXAMPLE.md for schema setup');
    console.log('  2. Ensure at least one query returns data');
    console.log('  3. Verify Convex is running at', CONVEX_URL);
    console.log('');
    process.exit(1);
  }

  // Test cache access patterns
  console.log('[TEST] Cache access pattern test:');

  // First access - should be a hit
  const data1 = getCachedData('test');
  if (!data1) {
    console.error('❌ FAILED: Expected cache hit, got miss');
    process.exit(1);
  }
  console.log('  ✅ First access: cache hit');

  // More accesses
  for (let i = 0; i < 4; i++) {
    getCachedData('test');
  }
  console.log('  ✅ Multiple accesses: all cache hits');

  const stats = useCache.getState().getStats();

  console.log('\n[STATS] Cache statistics:');
  console.log(`  Hits: ${stats.hits}`);
  console.log(`  Misses: ${stats.misses}`);
  console.log(`  Hit rate: ${(stats.hitRate * 100).toFixed(1)}%`);

  // Verify stats
  if (stats.hits !== 5 || stats.misses !== 0) {
    console.error('\n❌ FAILED: Expected 5 hits and 0 misses');
    console.error(`   Got ${stats.hits} hits and ${stats.misses} misses`);
    process.exit(1);
  }

  console.log('\n[VERIFY] Cache contents:');
  const finalQueries = Object.entries(useCache.getState().queries);
  if (finalQueries.length === 0) {
    console.error('❌ FAILED: No queries in cache');
    process.exit(1);
  }

  finalQueries.forEach(([token, data]) => {
    const type = Array.isArray(data) ? `array[${data.length}]` : typeof data;
    console.log(`  ✅ ${type} - data available`);
  });

  // Success!
  console.log('\n' + '='.repeat(50));
  console.log('✅ ALL TESTS PASSED');
  console.log('='.repeat(50));
  console.log('\nCache functionality verified:');
  console.log('  ✅ Real-time subscriptions working');
  console.log('  ✅ Data synchronization working');
  console.log('  ✅ Synchronous data access working');
  console.log('  ✅ Hit/miss tracking working');
  console.log('  ✅ 100% cache hit rate achieved');
  console.log('');

  process.exit(0);

}, TIMEOUT_MS);

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  console.log('\nStack:', error.stack);
  process.exit(1);
});

console.log('[WAITING] Waiting for data...\n');
