import { mutation } from "./_generated/server";

// Seed the database with test data
export const seedTestData = mutation({
  handler: async (ctx) => {
    // Clear existing data
    const existingMessages = await ctx.db.query("messages").collect();
    for (const msg of existingMessages) {
      await ctx.db.delete(msg._id);
    }

    const existingTasks = await ctx.db.query("tasks").collect();
    for (const task of existingTasks) {
      await ctx.db.delete(task._id);
    }

    const existingProducts = await ctx.db.query("products").collect();
    for (const product of existingProducts) {
      await ctx.db.delete(product._id);
    }

    const existingSettings = await ctx.db.query("settings").collect();
    for (const setting of existingSettings) {
      await ctx.db.delete(setting._id);
    }

    const existingCategories = await ctx.db.query("categories").collect();
    for (const category of existingCategories) {
      await ctx.db.delete(category._id);
    }

    // Seed messages
    await ctx.db.insert("messages", {
      text: "Welcome to xevex testing!",
      timestamp: Date.now(),
    });

    await ctx.db.insert("messages", {
      text: "This is a test message",
      timestamp: Date.now(),
    });

    // Seed pending tasks
    await ctx.db.insert("tasks", {
      description: "Process invoice #1001",
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      description: "Send notification to user",
      status: "pending",
      createdAt: Date.now(),
    });

    await ctx.db.insert("tasks", {
      description: "Generate monthly report",
      status: "pending",
      createdAt: Date.now(),
    });

    // Seed products
    await ctx.db.insert("products", {
      name: "Premium Widget",
      price: 99.99,
      featured: true,
    });

    await ctx.db.insert("products", {
      name: "Standard Widget",
      price: 49.99,
      featured: false,
    });

    await ctx.db.insert("products", {
      name: "Deluxe Widget",
      price: 149.99,
      featured: true,
    });

    // Seed settings
    await ctx.db.insert("settings", {
      theme: "dark",
      version: "1.0.0",
      maintenanceMode: false,
    });

    // Seed categories
    await ctx.db.insert("categories", {
      name: "Electronics",
      slug: "electronics",
    });

    await ctx.db.insert("categories", {
      name: "Software",
      slug: "software",
    });

    await ctx.db.insert("categories", {
      name: "Services",
      slug: "services",
    });

    return {
      success: true,
      seeded: {
        messages: 2,
        tasks: 3,
        products: 3,
        settings: 1,
        categories: 3,
      },
    };
  },
});
