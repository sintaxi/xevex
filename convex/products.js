import { query } from "./_generated/server";

// Query: Get featured products
export const featured = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("products")
      .filter((q) => q.eq(q.field("featured"), true))
      .collect();
  },
});
