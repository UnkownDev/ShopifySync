import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get products for a store
export const getProducts = query({
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
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .order("desc")
      .paginate(paginationOpts);
  },
});

// Upsert product
export const upsertProduct = mutation({
  args: {
    storeId: v.id("stores"),
    shopifyProductId: v.string(),
    title: v.string(),
    handle: v.optional(v.string()),
    productType: v.optional(v.string()),
    vendor: v.optional(v.string()),
    status: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    price: v.optional(v.number()),
    compareAtPrice: v.optional(v.number()),
    inventoryQuantity: v.optional(v.number()),
    shopifyCreatedAt: v.optional(v.string()),
    shopifyUpdatedAt: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingProduct = await ctx.db
      .query("products")
      .withIndex("by_store_and_shopify_id", (q) =>
        q.eq("storeId", args.storeId).eq("shopifyProductId", args.shopifyProductId)
      )
      .first();

    if (existingProduct) {
      await ctx.db.patch(existingProduct._id, {
        title: args.title,
        handle: args.handle,
        productType: args.productType,
        vendor: args.vendor,
        status: args.status,
        tags: args.tags,
        price: args.price,
        compareAtPrice: args.compareAtPrice,
        inventoryQuantity: args.inventoryQuantity,
        shopifyUpdatedAt: args.shopifyUpdatedAt,
      });
      return existingProduct._id;
    } else {
      return await ctx.db.insert("products", args);
    }
  },
});

// Get product statistics
export const getProductStats = query({
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

    const products = await ctx.db
      .query("products")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const totalProducts = products.length;
    const activeProducts = products.filter(p => p.status === "active").length;
    const totalInventory = products.reduce((sum, product) => 
      sum + (product.inventoryQuantity || 0), 0
    );

    return {
      totalProducts,
      activeProducts,
      totalInventory,
    };
  },
});
