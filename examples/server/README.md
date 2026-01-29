# Server-Side Tests

These are **real integration tests** that verify xevex works correctly in Node.js server environments. They will **fail** if Convex is not properly configured.

## Quick Start

Tests automatically read `CONVEX_URL` from `.env.local` or use `http://127.0.0.1:3210` as default.

```bash
# Build the library first
npm run build

# Run tests (requires Convex running with proper schema)
node examples/server/basic.js
node examples/server/worker.js
node examples/server/cache.js

# Or override with environment variable
CONVEX_URL=https://your-app.convex.cloud node examples/server/basic.js
```

## Prerequisites

**IMPORTANT:** These are integration tests, not graceful demos. They require:

1. **Convex running** at `http://127.0.0.1:6790` or `$CONVEX_URL`
2. **Proper schema** with queries and mutations (see below)
3. **Test data** in your database

To set up:

1. Install and start Convex: `npx convex dev`
2. Add the required schema (see [CONVEX-SCHEMA-EXAMPLE.md](./CONVEX-SCHEMA-EXAMPLE.md))
3. Insert test data (see schema examples for seed scripts)
4. Run the tests

**These tests will exit with error code 1 if:**
- Convex is not running
- Required queries/mutations don't exist
- No data is returned from queries
- Mutations fail
- Any assertion fails

## Tests

### [basic.js](./basic.js)
**Integration test for basic xevex functionality**

Tests:
- ✅ Store creation and initialization
- ✅ Convex connection
- ✅ Real-time subscriptions
- ✅ State updates from subscriptions
- ✅ Mutation execution

**Required schema:**
- Query: `messages:list` (returns array)
- Mutation: `messages:send` (args: `{ text: string }`)

**Timeout:** 5 seconds
**Exit code:** 0 on success, 1 on failure

```bash
node examples/server/basic.js
```

### [worker.js](./worker.js)
**Integration test for background worker pattern**

Tests:
- ✅ Connection and subscription setup
- ✅ Real-time task updates
- ✅ Task processing logic
- ✅ Mutation execution per task
- ✅ Success/failure tracking

**Required schema:**
- Query: `tasks:pending` (returns array of tasks with `_id` or `id`)
- Mutation: `tasks:complete` (args: `{ id: Id<"tasks"> }`)
- **At least one pending task in database**

**Timeout:** 10 seconds
**Exit code:** 0 if all tasks processed, 1 on failure

```bash
node examples/server/worker.js
```

### [cache.js](./cache.js)
**Integration test for server-side caching**

Tests:
- ✅ Multiple concurrent subscriptions
- ✅ Real-time data synchronization
- ✅ Synchronous cache access
- ✅ Hit/miss tracking accuracy
- ✅ Cache state verification

**Required schema (at least ONE):**
- Query: `products:featured` (returns data)
- Query: `settings:app` (returns data)
- Query: `categories:list` (returns data)

**Timeout:** 5 seconds
**Exit code:** 0 on success, 1 on failure

```bash
node examples/server/cache.js
```

## Requirements

- **Node.js 16+** (for native WebSocket support)
- Same dependencies as client-side (convex + zustand)
- No additional server-specific packages needed

## Key Concepts

### Connection Management

Connect once at startup, not per request:

```javascript
const { create } = require('xevex')

const useStore = create((set) => ({ count: 0 }))

// ✅ Good: Connect once
useStore.connect(process.env.CONVEX_URL)

// ❌ Bad: Don't reconnect per request
app.get('/data', (req, res) => {
  useStore.connect(url) // NO!
})
```

### Accessing State

Use `.getState()` instead of React hooks:

```javascript
// Get current state
const state = useStore.getState()

// Subscribe to queries
state.subscribe('items:list', {})

// Run mutations
await state.mutation('items:create', { name: 'New Item' })

// Access query results
const items = Object.values(state.queries)[0]
```

### Listening for Changes

Use Zustand's `.subscribe()` to react to updates:

```javascript
useStore.subscribe((state) => {
  const queries = state.queries
  // Process updated data
  console.log('Data updated:', queries)
})
```

## Common Use Cases

### Background Workers
Process tasks in real-time as they're added to Convex.

```javascript
const worker = create(...)
worker.connect(convexUrl)
worker.getState().subscribe('tasks:pending', {})

worker.subscribe((state) => {
  const tasks = Object.values(state.queries)[0] || []
  tasks.forEach(processTask)
})
```

### Server-Side Cache
Keep frequently accessed data in memory with automatic updates.

```javascript
const cache = create(...)
cache.connect(convexUrl)
cache.getState().subscribe('hotData', {})

// Access synchronously
const data = cache.getState().queries
```

### Real-Time APIs
Build WebSocket or SSE endpoints with live Convex data.

```javascript
const realtime = create(...)
realtime.connect(convexUrl)
realtime.getState().subscribe('metrics:live', {})

app.get('/stream', (req, res) => {
  realtime.subscribe((state) => {
    res.write(`data: ${JSON.stringify(state.queries)}\n\n`)
  })
})
```

### Webhook Processing
Process webhooks and persist to Convex.

```javascript
app.post('/webhook', async (req, res) => {
  const store = useStore.getState()
  await store.mutation('webhooks:process', req.body)
  res.sendStatus(200)
})
```

## Best Practices

1. **Connect once** - Create store at app startup, not per request
2. **Subscribe early** - Set up subscriptions before handling traffic
3. **Handle errors** - WebSocket connections can fail, implement retry logic
4. **Graceful shutdown** - Close connections on SIGTERM/SIGINT
5. **Monitor health** - Check connection state periodically

## Environment Variables

```bash
# Optional - defaults to http://127.0.0.1:6790
CONVEX_URL=https://your-app.convex.cloud

# Optional
NODE_ENV=production
```

## Deployment

Works in any Node.js environment:
- Traditional servers (Express, Fastify, etc.)
- Docker containers
- Kubernetes pods
- Background workers
- Microservices

Note: Serverless functions (Lambda, Cloud Functions) may have WebSocket timeout limitations.

## Further Reading

See [SERVER-REQUIREMENTS.md](./SERVER-REQUIREMENTS.md) for detailed requirements and considerations.
