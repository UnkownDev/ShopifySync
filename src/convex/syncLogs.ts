import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get sync logs for a store
export const getSyncLogs = query({
  args: { 
    storeId: v.id("stores"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { storeId, limit = 20 }) => {
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
      .query("syncLogs")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .order("desc")
      .take(limit);
  },
});

// Internal mutation to create sync log
export const createSyncLog = internalMutation({
  args: {
    storeId: v.id("stores"),
    syncType: v.string(),
    status: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("syncLogs", {
      ...args,
      startedAt: Date.now(),
    });
  },
});

// Internal mutation to complete sync log
export const completeSyncLog = internalMutation({
  args: {
    syncLogId: v.id("syncLogs"),
    status: v.string(),
    recordsProcessed: v.optional(v.number()),
    errorMessage: v.optional(v.string()),
  },
  handler: async (ctx, { syncLogId, ...updates }) => {
    await ctx.db.patch(syncLogId, {
      ...updates,
      completedAt: Date.now(),
    });
  },
});
