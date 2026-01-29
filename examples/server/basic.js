#!/usr/bin/env node

/**
 * Example: Using xevex on a Node.js server
 *
 * This test verifies that xevex works correctly in a server-side context.
 * It performs real subscriptions and mutations against a live Convex backend.
 *
 * Prerequisites:
 *   - Convex running at http://127.0.0.1:6790 (or CONVEX_URL)
 *   - Query: messages:list
 *   - Mutation: messages:send (args: { text: string })
 *
 * Usage:
 *   node examples/server/basic.js
 */

const { create } = require('../../dist/cjs/index.js');
const { loadConvexUrl } = require('./_loadEnv.js');

const CONVEX_URL = loadConvexUrl();
const TIMEOUT_MS = 5000;

console.log('=== Xevex Server-Side Test ===\n');
console.log('Connecting to:', CONVEX_URL);
console.log('Timeout:', TIMEOUT_MS + 'ms\n');

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error('❌ FAILED:', message);
    testsFailed++;
    throw new Error(message);
  }
  console.log('✅ PASS:', message);
  testsPassed++;
}

// Create a store
const useStore = create((set, get) => ({
  messagesReceived: 0,

  incrementMessages: () => set(state => ({
    messagesReceived: state.messagesReceived + 1
  }))
}));

// Test 1: Store creation
assert(typeof useStore === 'function', 'Store created');
assert(typeof useStore.connect === 'function', 'Store has connect method');

// Test 2: Initial state
const state = useStore.getState();
assert(typeof state.subscribe === 'function', 'State has subscribe method');
assert(typeof state.mutation === 'function', 'State has mutation method');
assert('queries' in state, 'State has queries property');
assert(state.messagesReceived === 0, 'Initial state is correct');

console.log('');

// Connect to Convex
useStore.connect(CONVEX_URL);
assert(typeof state.getClient === 'function', 'Client accessor available');
const client = state.getClient();
assert(client !== null, 'Client connected');

console.log('');

// Test 3: Subscribe to query
console.log('Setting up subscription to messages:list...');
state.subscribe('messages:list', {});

// Test 4: Wait for data and verify updates
let dataReceived = false;
const unsubscribe = useStore.subscribe((newState) => {
  const queries = Object.values(newState.queries);

  if (queries.length > 0 && !dataReceived) {
    dataReceived = true;

    console.log('\n📊 Data received from subscription');
    queries.forEach((data, index) => {
      const type = Array.isArray(data) ? `array[${data.length}]` : typeof data;
      console.log(`   Query ${index + 1}: ${type}`);
    });

    assert(queries.length > 0, 'Received query data');
    newState.incrementMessages();
  }
});

// Set timeout for test
const timeoutId = setTimeout(() => {
  unsubscribe();

  console.log('\n⏱️  Timeout reached\n');

  // Test 5: Verify data was received
  assert(dataReceived, 'Subscription data received within timeout');
  assert(useStore.getState().messagesReceived > 0, 'State updated from subscription');

  // Test 6: Verify query results are accessible
  const queries = Object.values(useStore.getState().queries);
  assert(queries.length > 0, 'Queries stored in state');

  // Test 7: Test mutation
  console.log('\nTesting mutation...');
  const testMessage = `Test message ${Date.now()}`;

  state.mutation('messages:send', { text: testMessage })
    .then(() => {
      assert(true, 'Mutation executed successfully');

      console.log('\n' + '='.repeat(50));
      console.log(`✅ ALL TESTS PASSED (${testsPassed}/${testsPassed + testsFailed})`);
      console.log('='.repeat(50) + '\n');

      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Mutation failed:', error.message);
      testsFailed++;

      console.log('\n' + '='.repeat(50));
      console.log(`❌ TESTS FAILED (${testsPassed}/${testsPassed + testsFailed})`);
      console.log('='.repeat(50) + '\n');

      process.exit(1);
    });

}, TIMEOUT_MS);

// Handle connection errors
process.on('unhandledRejection', (error) => {
  clearTimeout(timeoutId);
  console.error('\n❌ Unhandled error:', error.message);
  console.log('\nMake sure:');
  console.log('  1. Convex is running at', CONVEX_URL);
  console.log('  2. Query "messages:list" exists');
  console.log('  3. Mutation "messages:send" exists with args { text: string }');
  console.log('\nSee CONVEX-SCHEMA-EXAMPLE.md for schema setup\n');
  process.exit(1);
});
