import { cronJobs } from "convex/server";
import { internal, api } from "./_generated/api";
import { internalAction } from "./_generated/server";

const crons = cronJobs();

// Internal action to sync all active stores
export const runAllStoreSyncs = internalAction({
  args: {},
  handler: async (ctx) => {
    const stores = await ctx.runQuery(internal.stores.listActiveStores, {});
    for (const s of stores) {
      try {
        await ctx.runAction(api.fullSync.fullSync, { storeId: s._id });
      } catch (err) {
        console.error("Cron sync failed for store", s._id, err);
      }
    }
  },
});

// Run every 30 minutes
crons.interval("sync active stores", { minutes: 30 }, internal.crons.runAllStoreSyncs, {});

export default crons;
