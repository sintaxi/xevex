# Running Xevex Server-Side

## ✅ Tests Confirm: Xevex Works in Node.js

The library runs identically on both client and server with **no modifications needed**.

## Requirements

### 1. Node.js Version
- **Minimum:** Node.js 16+ (native WebSocket support)
- **Recommended:** Node.js 18+ LTS

Node.js has built-in WebSocket support since v16, which `BaseConvexClient` uses automatically.

### 2. Dependencies
Only the dependencies already in package.json:
```json
{
  "convex": "^1.31.2",
  "zustand": "^5.0.2"
}
```

No additional server-specific packages needed!

### 3. Runtime Environment
Works in any Node.js context:
- ✅ Plain Node.js scripts
- ✅ Express/Fastify/etc servers
- ✅ Background workers
- ✅ Serverless functions (with caveats*)
- ✅ Docker containers
- ✅ Microservices

*Note: Serverless functions may have limitations on long-lived WebSocket connections

## Key Differences from Browser Usage

### Browser
```javascript
// React component
function MyComponent() {
  const data = useStore(state => state.subscribe('items', {}))
  return <div>{data?.map(...)}</div>
}
```

### Server
```javascript
// Background worker
useStore.getState().subscribe('items', {})

// Listen for changes
useStore.subscribe((state) => {
  const items = Object.values(state.queries)[0]
  processItems(items)
})
```

The main difference:
- **Browser:** Use the Zustand hook directly in React components
- **Server:** Use `useStore.getState()` and `useStore.subscribe()` for non-React contexts

## Common Server-Side Use Cases

### 1. Background Worker
```javascript
const { create } = require('xevex')

const useStore = create((set) => ({ processed: 0 }))
useStore.connect('https://your-app.convex.cloud')

// Subscribe to work queue
useStore.getState().subscribe('tasks:pending', {})

// React to changes
useStore.subscribe(async (state) => {
  const tasks = Object.values(state.queries)[0] || []
  for (const task of tasks) {
    await processTask(task)
  }
})
```

### 2. Server-Side Cache
```javascript
const cache = create((set) => ({
  hit: 0,
  miss: 0
}))
cache.connect('https://your-app.convex.cloud')

// Keep cache warm with real-time updates
cache.getState().subscribe('hotData', {})

// Access cached data synchronously
function getData() {
  return Object.values(cache.getState().queries)[0]
}
```

### 3. Real-Time Metrics
```javascript
const metrics = create((set) => ({
  activeUsers: 0,
  requestsPerSecond: 0
}))
metrics.connect('https://your-app.convex.cloud')

metrics.getState().subscribe('metrics:live', {})

// Expose via HTTP endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getState().queries)
})
```

### 4. Webhook Processor
```javascript
const processor = create((set) => ({
  queue: []
}))
processor.connect('https://your-app.convex.cloud')

// Process webhooks and store in Convex
app.post('/webhook', async (req, res) => {
  await processor.getState().mutation('webhooks:process', req.body)
  res.status(200).send('OK')
})
```

## Important Considerations

### 1. Connection Lifecycle
WebSocket connections are **long-lived**:
- Create store once at startup
- Connection stays open for the process lifetime
- Automatically reconnects on network issues

```javascript
// ✅ Good: Connect once
const useStore = create(...)
useStore.connect(convexUrl)

// ❌ Bad: Don't reconnect on every request
app.get('/data', (req, res) => {
  useStore.connect(convexUrl) // NO!
})
```

### 2. Subscription Management
Subscriptions are **persistent**:
- Call `.subscribe()` once for each query you need
- Updates come automatically via WebSocket
- No need to re-subscribe on each use

```javascript
// ✅ Good: Subscribe once at startup
useStore.getState().subscribe('items', {})

// Access current data anytime
const items = Object.values(useStore.getState().queries)[0]
```

### 3. Error Handling
Handle connection errors:

```javascript
try {
  useStore.connect(convexUrl)
} catch (error) {
  console.error('Failed to connect:', error)
  // Implement retry logic
}

// Monitor connection health
useStore.getState().getClient().connectionState()
```

### 4. Graceful Shutdown
Close connections properly:

```javascript
process.on('SIGTERM', () => {
  const client = useStore.getState().getClient()
  client.close()
  process.exit(0)
})
```

### 5. Serverless Limitations
Be aware in serverless contexts:
- WebSocket connections may time out
- Cold starts require reconnection
- Consider HTTP client for one-off requests:

```javascript
// For serverless, might prefer:
const { ConvexHttpClient } = require('convex/browser')
const client = new ConvexHttpClient(convexUrl)
await client.query('items:list', {})
```

## Testing Server-Side

```javascript
// test-server.js
const { create } = require('xevex')

const useStore = create((set) => ({ count: 0 }))

console.log('Store created:', typeof useStore === 'function')
console.log('Has connect:', typeof useStore.connect === 'function')
console.log('State methods:', Object.keys(useStore.getState()))

// With real Convex URL:
useStore.connect(process.env.CONVEX_URL)

// Subscribe and test
useStore.getState().subscribe('test:data', {})
setTimeout(() => {
  console.log('Queries:', useStore.getState().queries)
}, 2000)
```

Run:
```bash
CONVEX_URL=https://your-app.convex.cloud node test-server.js
```

## Performance Notes

- **Memory:** Zustand stores are lightweight (~1KB overhead)
- **CPU:** Minimal - only updates when data changes
- **Network:** Single WebSocket connection, binary protocol
- **Scale:** Can handle thousands of concurrent subscriptions per connection

## Summary

**No changes needed to run xevex server-side!**

Requirements:
1. Node.js 16+ (for native WebSocket)
2. Same dependencies as client-side
3. Use `.getState()` and `.subscribe()` instead of React hooks

The library is truly universal - write once, run anywhere.
