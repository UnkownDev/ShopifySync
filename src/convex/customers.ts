import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get customers for a store with pagination
export const getCustomers = query({
  args: {
    storeId: v.id("stores"),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { storeId, paginationOpts }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    return await ctx.db
      .query("customers")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .order("desc")
      .paginate(paginationOpts);
  },
});

// Get top customers by spend
export const getTopCustomers = query({
  args: { storeId: v.id("stores"), limit: v.optional(v.number()) },
  handler: async (ctx, { storeId, limit = 5 }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    return customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, limit);
  },
});

// Upsert customer (create or update)
export const upsertCustomer = mutation({
  args: {
    storeId: v.id("stores"),
    shopifyCustomerId: v.string(),
    email: v.optional(v.string()),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    totalSpent: v.number(),
    ordersCount: v.number(),
    state: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    acceptsMarketing: v.optional(v.boolean()),
    shopifyCreatedAt: v.optional(v.string()),
    shopifyUpdatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingCustomer = await ctx.db
      .query("customers")
      .withIndex("by_store_and_shopify_id", (q) =>
        q.eq("storeId", args.storeId).eq("shopifyCustomerId", args.shopifyCustomerId)
      )
      .first();

    if (existingCustomer) {
      await ctx.db.patch(existingCustomer._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        phone: args.phone,
        totalSpent: args.totalSpent,
        ordersCount: args.ordersCount,
        state: args.state,
        tags: args.tags,
        acceptsMarketing: args.acceptsMarketing,
        shopifyUpdatedAt: args.shopifyUpdatedAt,
      });
      return existingCustomer._id;
    } else {
      return await ctx.db.insert("customers", args);
    }
  },
});

// Get customer stats
export const getCustomerStats = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    const customers = await ctx.db
      .query("customers")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const totalCustomers = customers.length;
    const totalSpent = customers.reduce((sum, customer) => sum + customer.totalSpent, 0);
    const averageSpent = totalCustomers > 0 ? totalSpent / totalCustomers : 0;

    return {
      totalCustomers,
      totalSpent,
      averageSpent,
    };
  },
});

// Internal query to get customer by Shopify ID
export const getCustomerByShopifyId = query({
  args: {
    storeId: v.id("stores"),
    shopifyCustomerId: v.string(),
  },
  handler: async (ctx, { storeId, shopifyCustomerId }) => {
    return await ctx.db
      .query("customers")
      .withIndex("by_store_and_shopify_id", (q) =>
        q.eq("storeId", storeId).eq("shopifyCustomerId", shopifyCustomerId)
      )
      .first();
  },
});