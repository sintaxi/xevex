# Testing Xevex

This document explains how to run the xevex integration tests.

## Quick Start

```bash
# Terminal 1: Start Convex backend
npm run convex:dev

# Terminal 2: Seed database and run tests
npm run convex:seed
npm run test:integration
```

**Note:** Tests automatically detect the Convex URL from `.env.local` (created by `npm run convex:dev`). No manual configuration needed!

## Prerequisites

- Node.js 16+
- Convex account (free, created automatically on first run)

## Detailed Setup

### 1. Start Convex Backend

```bash
npm run convex:dev
```

On first run, this will:
- Prompt you to log in or create a Convex account
- Create a new Convex project
- Start the local dev server at http://127.0.0.1:6790

**Keep this terminal running.**

### 2. Seed Test Data

In a new terminal:

```bash
npm run convex:seed
```

This populates the database with:
- 2 messages
- 3 pending tasks
- 3 products (2 featured)
- 1 settings object
- 3 categories

### 3. Run Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Or run individual tests
npm run test:integration:basic    # Basic functionality
npm run test:integration:worker   # Background worker
npm run test:integration:cache    # Server-side cache
```

## Test Results

### Expected Output

All tests should pass with exit code 0:

#### basic.js
```
=== Xevex Server-Side Test ===

✅ PASS: Store created
✅ PASS: Store has connect method
✅ PASS: State has subscribe method
✅ PASS: State has mutation method
✅ PASS: State has queries property
✅ PASS: Initial state is correct
✅ PASS: Client accessor available
✅ PASS: Client connected

Setting up subscription to messages:list...

📊 Data received from subscription
   Query 1: array[2]

✅ PASS: Subscription data received within timeout
✅ PASS: State updated from subscription
✅ PASS: Queries stored in state

Testing mutation...
✅ PASS: Mutation executed successfully

==================================================
✅ ALL TESTS PASSED (11/11)
==================================================
```

#### worker.js
```
=== Xevex Background Worker Test ===

[CONNECT] Connecting to Convex...
✅ Connected

[SUBSCRIBE] Subscribing to tasks:pending...
✅ Subscribed

[STATUS] waiting
[WAITING] Listening for tasks...

[TASKS] Received 3 task(s)

[STATUS] processing
[PROCESS] Task 1/3: [task-id-1]
✅ Completed: [task-id-1]
[PROCESS] Task 2/3: [task-id-2]
✅ Completed: [task-id-2]
[PROCESS] Task 3/3: [task-id-3]
✅ Completed: [task-id-3]

[STATUS] complete

==================================================
WORKER COMPLETE
==================================================
Processed: 3
Errors: 0
Success rate: 100.0%
==================================================

✅ All tasks processed successfully
```

#### cache.js
```
=== Xevex Server-Side Cache Test ===

[CONNECT] Connecting to Convex...
✅ Connected

[SUBSCRIBE] Setting up subscriptions:
  - products:featured
  - settings:app
  - categories:list
✅ Subscribed

[WAITING] Waiting for data...

[DATA] Received data from subscriptions:
  - array[2]
  - object
  - array[3]

[TEST] Testing cache functionality

[TEST] Cache access pattern test:
  ✅ First access: cache hit
  ✅ Multiple accesses: all cache hits

[STATS] Cache statistics:
  Hits: 5
  Misses: 0
  Hit rate: 100.0%

[VERIFY] Cache contents:
  ✅ array[2] - data available
  ✅ object - data available
  ✅ array[3] - data available

==================================================
✅ ALL TESTS PASSED
==================================================

Cache functionality verified:
  ✅ Real-time subscriptions working
  ✅ Data synchronization working
  ✅ Synchronous data access working
  ✅ Hit/miss tracking working
  ✅ 100% cache hit rate achieved
```

## What Each Test Verifies

### basic.js
Tests core xevex functionality:
- Store creation and initialization
- Convex connection establishment
- Real-time query subscriptions
- State updates from live data
- Mutation execution

### worker.js
Tests background worker pattern:
- Long-lived WebSocket connection
- Real-time task updates
- Task processing logic
- Concurrent mutation execution
- Error tracking and reporting

### cache.js
Tests server-side caching:
- Multiple concurrent subscriptions
- Real-time data synchronization
- Synchronous cache access patterns
- Hit/miss tracking accuracy
- Cache state management

## Resetting Test Data

To reset the database between test runs:

```bash
npm run convex:seed
```

This clears all data and re-seeds fresh test data.

## Troubleshooting

### Tests fail with "No data received"

**Issue:** Convex is not running or not seeded

**Fix:**
```bash
# Terminal 1
npm run convex:dev

# Terminal 2
npm run convex:seed
npm run test:integration
```

### Tests fail with "Connection refused"

**Issue:** Convex dev server is not running

**Fix:** Start Convex in a separate terminal:
```bash
npm run convex:dev
```

### Tests fail with "Query not found"

**Issue:** Convex functions not deployed

**Fix:** Restart the Convex dev server:
```bash
# Ctrl+C to stop, then:
npm run convex:dev
```

### All tasks show as completed

**Issue:** Worker test was already run

**Fix:** Re-seed the database:
```bash
npm run convex:seed
npm run test:integration:worker
```

## CI/CD Integration

All tests return proper exit codes:
- **0** = All tests passed
- **1** = One or more tests failed

Example GitHub Actions workflow:

```yaml
name: Integration Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - run: npm install

      # Start Convex in background
      - run: npm run convex:dev &
      - run: sleep 5  # Wait for Convex to start

      # Seed and test
      - run: npm run convex:seed
      - run: npm run test:integration
```

## Development Workflow

When developing xevex:

1. **Start Convex** (once, keep running):
   ```bash
   npm run convex:dev
   ```

2. **Make changes** to lib/

3. **Rebuild and test**:
   ```bash
   npm run build
   npm run test:integration
   ```

4. **Re-seed if needed**:
   ```bash
   npm run convex:seed
   ```

## Additional Resources

- [Convex Backend README](./convex/README.md) - Detailed Convex setup
- [Server Examples README](./examples/server/README.md) - Test documentation
- [Convex Schema Examples](./examples/server/CONVEX-SCHEMA-EXAMPLE.md) - Schema reference

## Files

```
xevex/
├── convex/                     # Convex backend
│   ├── messages.js            # Messages query/mutation
│   ├── tasks.js               # Tasks queries/mutations
│   ├── products.js            # Products query
│   ├── settings.js            # Settings query
│   ├── categories.js          # Categories query
│   └── seed.js                # Seed script
├── examples/server/           # Integration tests
│   ├── basic.js              # Basic functionality test
│   ├── worker.js             # Worker pattern test
│   └── cache.js              # Cache pattern test
└── convex.json               # Convex configuration
```
