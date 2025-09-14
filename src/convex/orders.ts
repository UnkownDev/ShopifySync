import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get orders for a store with date filtering
export const getOrders = query({
  args: {
    storeId: v.id("stores"),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    paginationOpts: v.object({
      numItems: v.number(),
      cursor: v.union(v.string(), v.null()),
    }),
  },
  handler: async (ctx, { storeId, startDate, endDate, paginationOpts }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    let query = ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("storeId", storeId));

    if (startDate && endDate) {
      query = ctx.db
        .query("orders")
        .withIndex("by_store_and_date", (q) =>
          q.eq("storeId", storeId).gte("orderDate", startDate).lte("orderDate", endDate)
        );
    }

    return await query.order("desc").paginate(paginationOpts);
  },
});

// Get orders by date range for charts
export const getOrdersByDateRange = query({
  args: {
    storeId: v.id("stores"),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, { storeId, startDate, endDate }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store_and_date", (q) =>
        q.eq("storeId", storeId).gte("orderDate", startDate).lte("orderDate", endDate)
      )
      .collect();

    // Group orders by date
    const ordersByDate = orders.reduce((acc, order) => {
      const date = order.orderDate.split('T')[0]; // Get just the date part
      if (!acc[date]) {
        acc[date] = { date, count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += order.totalPrice;
      return acc;
    }, {} as Record<string, { date: string; count: number; revenue: number }>);

    return Object.values(ordersByDate).sort((a, b) => a.date.localeCompare(b.date));
  },
});

// Upsert order
export const upsertOrder = mutation({
  args: {
    storeId: v.id("stores"),
    shopifyOrderId: v.string(),
    orderNumber: v.optional(v.string()),
    customerId: v.optional(v.id("customers")),
    customerEmail: v.optional(v.string()),
    totalPrice: v.number(),
    subtotalPrice: v.optional(v.number()),
    totalTax: v.optional(v.number()),
    totalDiscounts: v.optional(v.number()),
    currency: v.string(),
    financialStatus: v.optional(v.string()),
    fulfillmentStatus: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    orderDate: v.string(),
    shopifyCreatedAt: v.optional(v.string()),
    shopifyUpdatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingOrder = await ctx.db
      .query("orders")
      .withIndex("by_store_and_shopify_id", (q) =>
        q.eq("storeId", args.storeId).eq("shopifyOrderId", args.shopifyOrderId)
      )
      .first();

    if (existingOrder) {
      await ctx.db.patch(existingOrder._id, {
        orderNumber: args.orderNumber,
        customerId: args.customerId,
        customerEmail: args.customerEmail,
        totalPrice: args.totalPrice,
        subtotalPrice: args.subtotalPrice,
        totalTax: args.totalTax,
        totalDiscounts: args.totalDiscounts,
        currency: args.currency,
        financialStatus: args.financialStatus,
        fulfillmentStatus: args.fulfillmentStatus,
        tags: args.tags,
        orderDate: args.orderDate,
        shopifyUpdatedAt: args.shopifyUpdatedAt,
      });
      return existingOrder._id;
    } else {
      return await ctx.db.insert("orders", args);
    }
  },
});

// Get order statistics
export const getOrderStats = query({
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

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get recent orders (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = orders.filter(order => 
      new Date(order.orderDate) >= thirtyDaysAgo
    );

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      recentOrdersCount: recentOrders.length,
      recentRevenue: recentOrders.reduce((sum, order) => sum + order.totalPrice, 0),
    };
  },
});
