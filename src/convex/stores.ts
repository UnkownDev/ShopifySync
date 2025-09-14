import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";
import { internalQuery } from "./_generated/server";

// Get all stores for the current user
export const getUserStores = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.eq("ownerId", user._id))
      .collect();
  },
});

// Get a specific store by ID (with ownership check)
export const getStore = query({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    return store;
  },
});

// Create a new store
export const createStore = mutation({
  args: {
    name: v.string(),
    shopifyDomain: v.string(),
    shopifyAccessToken: v.optional(v.string()),
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Check if store with this domain already exists for this user
    const existingStore = await ctx.db
      .query("stores")
      .withIndex("by_domain", (q) => q.eq("shopifyDomain", args.shopifyDomain))
      .first();

    if (existingStore && existingStore.ownerId === user._id) {
      throw new Error("Store with this domain already exists");
    }

    return await ctx.db.insert("stores", {
      name: args.name,
      shopifyDomain: args.shopifyDomain,
      shopifyAccessToken: args.shopifyAccessToken,
      ownerId: user._id,
      isActive: true,
      currency: args.currency || "USD",
      timezone: args.timezone || "UTC",
    });
  },
});

// Update store settings
export const updateStore = mutation({
  args: {
    storeId: v.id("stores"),
    name: v.optional(v.string()),
    shopifyAccessToken: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    currency: v.optional(v.string()),
    timezone: v.optional(v.string()),
  },
  handler: async (ctx, { storeId, ...updates }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    await ctx.db.patch(storeId, updates);
    return await ctx.db.get(storeId);
  },
});

// Delete a store
export const deleteStore = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    await ctx.db.delete(storeId);
    return { success: true };
  },
});

// Update last sync time
export const updateLastSync = mutation({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    await ctx.db.patch(storeId, {
      lastSyncAt: Date.now(),
    });
  },
});

// Add internal query: get store by domain (for webhooks)
export const getStoreByDomain = internalQuery({
  args: { shopifyDomain: v.string() },
  handler: async (ctx, { shopifyDomain }) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_domain", (q) => q.eq("shopifyDomain", shopifyDomain))
      .first();
  },
});

// Add internal query: list all active stores (for crons)
export const listActiveStores = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("stores")
      .withIndex("by_owner", (q) => q.gt("ownerId", null as any)) // index use just to avoid full scan; we'll filter isActive below
      .collect()
      .then((rows) => rows.filter((s) => s.isActive));
  },
});