import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Query: Get all messages
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("messages").order("desc").collect();
  },
});

// Mutation: Send a message
export const send = mutation({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const messageId = await ctx.db.insert("messages", {
      text: args.text,
      timestamp: Date.now(),
    });
    return messageId;
  },
});
