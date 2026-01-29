#!/usr/bin/env node

/**
 * Example: Background Worker using Xevex
 *
 * This test demonstrates a real background worker that processes tasks
 * from Convex in real-time. It will fail if the Convex backend is not
 * properly configured.
 *
 * Prerequisites:
 *   - Convex running at http://127.0.0.1:6790 (or CONVEX_URL)
 *   - Query: tasks:pending (returns array of tasks with id/status)
 *   - Mutation: tasks:complete (args: { id: Id<"tasks"> })
 *   - At least one pending task in the database
 *
 * Usage:
 *   node examples/server/worker.js
 *
 * This worker will:
 *   1. Connect to Convex
 *   2. Subscribe to tasks:pending
 *   3. Wait for tasks to arrive
 *   4. Process each task
 *   5. Mark them as complete via mutation
 *   6. Exit after processing all tasks
 */

const { create } = require('../../dist/cjs/index.js');
const { loadConvexUrl } = require('./_loadEnv.js');

const CONVEX_URL = loadConvexUrl();
const TIMEOUT_MS = 10000; // 10 seconds to receive tasks

console.log('=== Xevex Background Worker Test ===\n');
console.log('Connecting to:', CONVEX_URL);
console.log('Timeout:', TIMEOUT_MS + 'ms\n');

// Create worker store
const useWorkerStore = create((set, get) => ({
  status: 'initializing',
  processed: 0,
  errors: 0,

  setStatus: (status) => {
    console.log(`[STATUS] ${status}`);
    set({ status });
  },

  incrementProcessed: () => set(state => ({
    processed: state.processed + 1
  })),

  incrementErrors: () => set(state => ({
    errors: state.errors + 1
  }))
}));

// Connect to Convex
console.log('[CONNECT] Connecting to Convex...');
useWorkerStore.connect(CONVEX_URL);
const state = useWorkerStore.getState();
const client = state.getClient();

if (!client) {
  console.error('❌ Failed to create Convex client');
  process.exit(1);
}

console.log('✅ Connected\n');

// Subscribe to pending tasks
console.log('[SUBSCRIBE] Subscribing to tasks:pending...');
state.subscribe('tasks:pending', {});
console.log('✅ Subscribed\n');

state.setStatus('waiting');

let tasksProcessed = false;

// Listen for tasks
const unsubscribe = useWorkerStore.subscribe(async (newState) => {
  if (newState.status !== 'waiting') return;

  const queries = Object.values(newState.queries);
  const tasks = queries.find(q => Array.isArray(q));

  if (!tasks || tasks.length === 0) {
    return;
  }

  // Found tasks!
  console.log(`[TASKS] Received ${tasks.length} task(s)\n`);
  tasksProcessed = true;

  newState.setStatus('processing');

  // Process each task
  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const taskId = task._id || task.id;

    if (!taskId) {
      console.error(`❌ Task ${i} missing id/id field:`, task);
      newState.incrementErrors();
      continue;
    }

    console.log(`[PROCESS] Task ${i + 1}/${tasks.length}: ${taskId}`);

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 200));

    // Mark complete
    try {
      await newState.mutation('tasks:complete', { id: taskId });
      console.log(`✅ Completed: ${taskId}`);
      newState.incrementProcessed();
    } catch (error) {
      console.error(`❌ Failed to complete task ${taskId}:`, error.message);
      newState.incrementErrors();
    }
  }

  // Done processing
  newState.setStatus('complete');

  // Get fresh state after all updates
  const finalState = useWorkerStore.getState();
  const stats = {
    processed: finalState.processed,
    errors: finalState.errors,
    total: tasks.length
  };

  console.log('\n' + '='.repeat(50));
  console.log('WORKER COMPLETE');
  console.log('='.repeat(50));
  console.log(`Processed: ${stats.processed}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Success rate: ${((stats.processed / stats.total) * 100).toFixed(1)}%`);
  console.log('='.repeat(50) + '\n');

  unsubscribe();

  if (stats.errors === 0) {
    console.log('✅ All tasks processed successfully\n');
    process.exit(0);
  } else {
    console.log('❌ Some tasks failed\n');
    process.exit(1);
  }
});

// Timeout if no tasks received
setTimeout(() => {
  unsubscribe();

  if (!tasksProcessed) {
    console.log('\n' + '='.repeat(50));
    console.error('❌ TIMEOUT: No tasks received');
    console.log('='.repeat(50));
    console.log('\nPossible issues:');
    console.log('  1. Query "tasks:pending" does not exist');
    console.log('  2. No pending tasks in the database');
    console.log('  3. Convex connection failed');
    console.log('\nTo fix:');
    console.log('  1. See CONVEX-SCHEMA-EXAMPLE.md for schema setup');
    console.log('  2. Add a pending task to your database');
    console.log('  3. Verify Convex is running at', CONVEX_URL);
    console.log('');
    process.exit(1);
  }
}, TIMEOUT_MS);

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('\n❌ Unhandled error:', error.message);
  console.log('\nStack:', error.stack);
  process.exit(1);
});

console.log('[WAITING] Listening for tasks...\n');
