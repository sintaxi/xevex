# xevex

> A library for building headless Convex applications using Zustand

Xevex combines the power of [Convex](https://convex.dev) real-time backend with [Zustand](https://github.com/pmndrs/zustand)'s simple state management. Build reactive applications with minimal boilerplate.

## Features

- Zustand-style API for familiar developer experience
- Explicit connection management
- Real-time query subscriptions
- Mutations support
- Works with both ESM and CommonJS
- **Universal:** Works in browser and Node.js server environments
- TypeScript-friendly

## Installation

```bash
npm install xevex
```

## Quick Start

```javascript
import { create } from 'xevex'

// Create a store (just like Zustand)
const useStore = create((set, get) => ({
  count: 0,
  increment: () => set(state => ({ count: state.count + 1 }))
}))

// Explicitly connect to Convex
useStore.connect('https://your-app.convex.cloud')

// Use in your React components
function Messages() {
  const messages = useStore(state =>
    state.subscribe('messages:list', {})
  )

  return (
    <div>
      {messages?.map(msg => <div key={msg._id}>{msg.text}</div>)}
    </div>
  )
}
```

## API

### `create(initializer)`

Creates a Zustand store with Convex integration built-in.

**Parameters:**
- `initializer` - Function or object that defines your store state and actions (same as Zustand)

**Returns:** A Zustand store hook with Convex methods available

```javascript
const useStore = create((set, get) => ({
  // Your custom state
  user: null,
  setUser: (user) => set({ user })
}))
```

### `useStore.connect(convexUrl)`

Explicitly connects the store to a Convex backend.

**Parameters:**
- `convexUrl` - Your Convex deployment URL

**Returns:** The store (for chaining)

```javascript
useStore.connect('https://your-app.convex.cloud')
```

### `state.subscribe(name, args, placeholder)`

Subscribes to a Convex query with real-time updates.

**Parameters:**
- `name` - Query name (e.g., 'messages:list')
- `args` - Query arguments object (optional, defaults to `{}`)
- `placeholder` - Value returned while loading (optional, defaults to `null`)

**Returns:** Selector function for use with the store hook

```javascript
// In a component
const messages = useStore(state =>
  state.subscribe('messages:list', { limit: 10 }, [])
)
```

### `state.mutation(name, args)`

Executes a Convex mutation.

**Parameters:**
- `name` - Mutation name (e.g., 'messages:send')
- `args` - Mutation arguments object (optional, defaults to `{}`)

**Returns:** Promise that resolves when mutation completes

```javascript
// In a component or action
const sendMessage = async (text) => {
  const store = useStore.getState()
  await store.mutation('messages:send', { text })
}
```

### `state.getClient()`

Returns the underlying Convex BaseConvexClient for advanced usage.

**Returns:** BaseConvexClient instance

```javascript
const client = useStore.getState().getClient()
```

## Advanced Usage

### Custom Slice

For advanced users who want more control, use `createBaseConvexSlice` directly:

```javascript
import { create } from 'zustand'
import { createBaseConvexSlice } from 'xevex'

const useStore = create((set, get) => ({
  ...createBaseConvexSlice()(set, get),
  // Your custom state
  count: 0
}))

useStore.getState().connect('https://your-app.convex.cloud')
```

## Example: Todo App

```javascript
import { create } from 'xevex'

const useStore = create((set, get) => ({
  // Local state
  filter: 'all',
  setFilter: (filter) => set({ filter }),

  // Actions that use mutations
  addTodo: async (text) => {
    const state = get()
    await state.mutation('todos:add', { text })
  },

  toggleTodo: async (id) => {
    const state = get()
    await state.mutation('todos:toggle', { id })
  }
}))

// Connect to Convex
useStore.connect('https://your-app.convex.cloud')

// Use in components
function TodoList() {
  const todos = useStore(state =>
    state.subscribe('todos:list', {})
  )
  const filter = useStore(state => state.filter)
  const addTodo = useStore(state => state.addTodo)

  const filteredTodos = todos?.filter(todo => {
    if (filter === 'active') return !todo.completed
    if (filter === 'completed') return todo.completed
    return true
  })

  return (
    <div>
      {filteredTodos?.map(todo => (
        <TodoItem key={todo._id} todo={todo} />
      ))}
    </div>
  )
}
```

## Server-Side Usage

Xevex works identically on Node.js servers with **no modifications needed**. Perfect for:
- Background workers processing real-time data
- Server-side caching with automatic updates
- Microservices needing live data
- Webhook processors

```javascript
const { create } = require('xevex')

const useStore = create((set) => ({ processed: 0 }))
useStore.connect('https://your-app.convex.cloud')

// Subscribe to real-time updates
useStore.getState().subscribe('tasks:pending', {})

// React to changes
useStore.subscribe((state) => {
  const tasks = Object.values(state.queries)[0] || []
  tasks.forEach(processTask)
})
```

**Requirements:**
- Node.js 16+ (native WebSocket support)
- Same dependencies as client-side

See [examples/server](./examples/server) for complete working examples and [SERVER-REQUIREMENTS.md](./examples/server/SERVER-REQUIREMENTS.md) for detailed documentation.

## Testing

Xevex includes comprehensive integration tests that verify real-world functionality:

```bash
# Start Convex backend (terminal 1)
npm run convex:dev

# Seed database and run tests (terminal 2)
npm run convex:seed
npm run test:integration
```

The tests verify:
- ✅ Real-time subscriptions
- ✅ Data synchronization
- ✅ Mutations
- ✅ Background workers
- ✅ Server-side caching

See [TESTING.md](./TESTING.md) for detailed testing documentation.

## License

ISC