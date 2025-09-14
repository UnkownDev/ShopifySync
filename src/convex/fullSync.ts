"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { api } from "./_generated/api";

type SyncResult = {
  success: boolean;
  recordsProcessed: number;
};

type FullSyncResult = {
  success: boolean;
  results: {
    products: number;
    customers: number;
    orders: number;
  };
};

export const fullSync = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }): Promise<FullSyncResult> => {
    try {
      // Run all three syncs in parallel to minimize total duration
      const [productResult, customerResult, orderResult] = await Promise.all([
        ctx.runAction(api.shopifySync.syncProducts, { storeId }),
        ctx.runAction(api.shopifySync.syncCustomers, { storeId }),
        ctx.runAction(api.shopifySync.syncOrders, { storeId }),
      ]);

      await ctx.runMutation(api.stores.updateLastSync, { storeId });

      return {
        success: true,
        results: {
          products: productResult.recordsProcessed,
          customers: customerResult.recordsProcessed,
          orders: orderResult.recordsProcessed,
        },
      };
    } catch (error) {
      console.error("Full sync error:", error);
      throw new Error(`Full sync failed: ${error}`);
    }
  },
});