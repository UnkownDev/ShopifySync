import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

// default user roles. can add / remove based on the project as needed
export const ROLES = {
  ADMIN: "admin",
  USER: "user",
  MEMBER: "member",
} as const;

export const roleValidator = v.union(
  v.literal(ROLES.ADMIN),
  v.literal(ROLES.USER),
  v.literal(ROLES.MEMBER),
);
export type Role = Infer<typeof roleValidator>;

const schema = defineSchema(
  {
    // default auth tables using convex auth.
    ...authTables, // do not remove or modify

    // the users table is the default users table that is brought in by the authTables
    users: defineTable({
      name: v.optional(v.string()), // name of the user. do not remove
      image: v.optional(v.string()), // image of the user. do not remove
      email: v.optional(v.string()), // email of the user. do not remove
      emailVerificationTime: v.optional(v.number()), // email verification time. do not remove
      isAnonymous: v.optional(v.boolean()), // is the user anonymous. do not remove

      role: v.optional(roleValidator), // role of the user. do not remove
    }).index("email", ["email"]), // index for the email. do not remove or modify

    // Multi-tenant Shopify stores
    stores: defineTable({
      name: v.string(),
      shopifyDomain: v.string(), // e.g., "mystore.myshopify.com"
      shopifyAccessToken: v.optional(v.string()),
      ownerId: v.id("users"),
      isActive: v.boolean(),
      currency: v.optional(v.string()),
      timezone: v.optional(v.string()),
      lastSyncAt: v.optional(v.number()),
    })
      .index("by_owner", ["ownerId"])
      .index("by_domain", ["shopifyDomain"]),

    // Shopify customers data
    customers: defineTable({
      storeId: v.id("stores"),
      shopifyCustomerId: v.string(),
      email: v.optional(v.string()),
      firstName: v.optional(v.string()),
      lastName: v.optional(v.string()),
      phone: v.optional(v.string()),
      totalSpent: v.number(),
      ordersCount: v.number(),
      state: v.optional(v.string()), // enabled, disabled, invited, declined
      tags: v.optional(v.array(v.string())),
      acceptsMarketing: v.optional(v.boolean()),
      shopifyCreatedAt: v.optional(v.string()),
      shopifyUpdatedAt: v.optional(v.string()),
    })
      .index("by_store", ["storeId"])
      .index("by_store_and_shopify_id", ["storeId", "shopifyCustomerId"])
      .index("by_store_and_email", ["storeId", "email"]),

    // Shopify products data
    products: defineTable({
      storeId: v.id("stores"),
      shopifyProductId: v.string(),
      title: v.string(),
      handle: v.optional(v.string()),
      productType: v.optional(v.string()),
      vendor: v.optional(v.string()),
      status: v.optional(v.string()), // active, archived, draft
      tags: v.optional(v.array(v.string())),
      price: v.optional(v.number()),
      compareAtPrice: v.optional(v.number()),
      inventoryQuantity: v.optional(v.number()),
      shopifyCreatedAt: v.optional(v.string()),
      shopifyUpdatedAt: v.optional(v.string()),
    })
      .index("by_store", ["storeId"])
      .index("by_store_and_shopify_id", ["storeId", "shopifyProductId"]),

    // Shopify orders data
    orders: defineTable({
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
      financialStatus: v.optional(v.string()), // pending, authorized, partially_paid, paid, etc.
      fulfillmentStatus: v.optional(v.string()), // fulfilled, partial, restocked, etc.
      tags: v.optional(v.array(v.string())),
      orderDate: v.string(),
      shopifyCreatedAt: v.optional(v.string()),
      shopifyUpdatedAt: v.optional(v.string()),
    })
      .index("by_store", ["storeId"])
      .index("by_store_and_date", ["storeId", "orderDate"])
      .index("by_store_and_customer", ["storeId", "customerId"])
      .index("by_store_and_shopify_id", ["storeId", "shopifyOrderId"]),

    // Order line items
    orderLineItems: defineTable({
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
    })
      .index("by_store", ["storeId"])
      .index("by_order", ["orderId"])
      .index("by_store_and_product", ["storeId", "productId"]),

    // Custom events (bonus feature)
    events: defineTable({
      storeId: v.id("stores"),
      customerId: v.optional(v.id("customers")),
      eventType: v.string(), // cart_abandoned, checkout_started, product_viewed, etc.
      eventData: v.optional(v.object({
        productId: v.optional(v.string()),
        cartValue: v.optional(v.number()),
        checkoutToken: v.optional(v.string()),
        additionalData: v.optional(v.string()), // JSON string for flexible data
      })),
      eventDate: v.string(),
      shopifyCreatedAt: v.optional(v.string()),
    })
      .index("by_store", ["storeId"])
      .index("by_store_and_type", ["storeId", "eventType"])
      .index("by_store_and_date", ["storeId", "eventDate"])
      .index("by_store_and_customer", ["storeId", "customerId"]),

    // Sync logs for tracking data ingestion
    syncLogs: defineTable({
      storeId: v.id("stores"),
      syncType: v.string(), // customers, orders, products, events
      status: v.string(), // success, error, in_progress
      recordsProcessed: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      startedAt: v.number(),
      completedAt: v.optional(v.number()),
    })
      .index("by_store", ["storeId"])
      .index("by_store_and_type", ["storeId", "syncType"])
      .index("by_status", ["status"]),
  },
  {
    schemaValidation: false,
  },
);

export default schema;