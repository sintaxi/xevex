# Example Convex Schema for Server Examples

This document shows example Convex schema files that work with the server examples.

## For basic.js

### convex/messages.js

```javascript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").collect();
  },
});

export const send = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      text: args.text,
      timestamp: Date.now(),
    });
  },
});
```

Usage in basic.js:
```javascript
// Subscribe
state.subscribe('messages:list', {})

// Mutation
await state.mutation('messages:send', { text: 'Hello!' })
```

## For worker.js

### convex/tasks.js

```javascript
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const pending = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .take(args.limit || 10);
  },
});

export const complete = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});
```

Usage in worker.js:
```javascript
// Subscribe
state.subscribe('tasks:pending', { limit: 10 })

// Mutation
await state.mutation('tasks:complete', { id: task._id })
```

## For cache.js

### convex/products.js

```javascript
import { query } from "./_generated/server";

export const featured = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("featured"), true))
      .collect();
  },
});
```

### convex/settings.js

```javascript
import { query } from "./_generated/server";

export const app = query({
  handler: async (ctx) => {
    return await ctx.db.query("settings").first();
  },
});
```

### convex/categories.js

```javascript
import { query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});
```

Usage in cache.js:
```javascript
// Subscribe to multiple queries
state.subscribe('products:featured', {})
state.subscribe('settings:app', {})
state.subscribe('categories:list', {})
```

## Setting Up Convex

1. Install Convex:
   ```bash
   npm install convex
   ```

2. Initialize Convex:
   ```bash
   npx convex dev
   ```

3. Create the schema files above in your `convex/` directory

4. Convex will automatically:
   - Generate TypeScript types
   - Set up the local dev server at `http://127.0.0.1:6790`
   - Create the database tables as you insert data

5. Run the examples:
   ```bash
   node examples/server/basic.js
   ```

## Quick Test Data

Insert some test data via Convex dashboard or a mutation:

```javascript
// convex/seed.js
import { mutation } from "./_generated/server";

export const seedData = mutation({
  handler: async (ctx) => {
    // Messages
    await ctx.db.insert("messages", { text: "Hello World", timestamp: Date.now() });

    // Tasks
    await ctx.db.insert("tasks", { status: "pending", description: "Test task" });

    // Products
    await ctx.db.insert("products", { name: "Product 1", featured: true });

    // Settings
    await ctx.db.insert("settings", { theme: "dark", version: "1.0" });

    // Categories
    await ctx.db.insert("categories", { name: "Category 1" });
  },
});
```

Run: `npx convex run seed:seedData` in your Convex project.

## Notes

- The examples use the format `module:function` for query/mutation names
- Convex automatically maps this to your file structure
- Examples will work with any query that returns data - adjust names as needed
