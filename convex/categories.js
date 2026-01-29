import { query } from "./_generated/server";

// Query: Get all categories
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("categories").collect();
  },
});
