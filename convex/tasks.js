import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get pending tasks
export const pending = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    return await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("status"), "pending"))
      .order("desc")
      .take(limit);
  },
});

// Mutation: Mark task as complete
export const complete = mutation({
  args: {
    id: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      status: "completed",
      completedAt: Date.now(),
    });
  },
});

// Mutation: Create a new task
export const create = mutation({
  args: {
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", {
      description: args.description,
      status: "pending",
      createdAt: Date.now(),
    });
    return taskId;
  },
});
