import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get line items for an order
export const getOrderLineItems = query({
  args: { orderId: v.id("orders") },
  handler: async (ctx, { orderId }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Get the order to verify store ownership
    const order = await ctx.db.get(orderId);
    if (!order) {
      throw new Error("Order not found");
    }

    const store = await ctx.db.get(order.storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Access denied");
    }

    return await ctx.db
      .query("orderLineItems")
      .withIndex("by_order", (q) => q.eq("orderId", orderId))
      .collect();
  },
});

// Internal mutation to upsert line item
export const upsertLineItem = internalMutation({
  args: {
    storeId: v.id("stores"),
    orderId: v.id("orders"),
    productId: v.optional(v.id("products")),
    shopifyProductId: v.optional(v.string()),
    shopifyVariantId: v.optional(v.string()),
    title: v.string(),
    quantity: v.number(),
    price: v.number(),
    totalDiscount: v.optional(v.number()),
    sku: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Try to find existing line item by order and product
    const existingItem = await ctx.db
      .query("orderLineItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.orderId))
      .filter((q) => q.eq(q.field("shopifyProductId"), args.shopifyProductId))
      .first();

    if (existingItem) {
      await ctx.db.patch(existingItem._id, {
        title: args.title,
        quantity: args.quantity,
        price: args.price,
        totalDiscount: args.totalDiscount,
        sku: args.sku,
      });
      return existingItem._id;
    } else {
      return await ctx.db.insert("orderLineItems", args);
    }
  },
});
