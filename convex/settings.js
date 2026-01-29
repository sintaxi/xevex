import { query } from "./_generated/server";

// Query: Get app settings
export const app = query({
  handler: async (ctx) => {
    return await ctx.db.query("settings").first();
  },
});
