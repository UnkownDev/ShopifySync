"use node";

import { v } from "convex/values";
import { action } from "./_generated/server";
import { internal, api } from "./_generated/api";
import type { Id } from "./_generated/dataModel";

// Helper: process items with limited concurrency for speed without overload
async function processInBatches<T>(
  items: Array<T>,
  handler: (item: T, index: number) => Promise<void>,
  concurrency = 10
) {
  let i = 0;
  const workers: Array<Promise<void>> = [];
  while (i < items.length) {
    const slice = items.slice(i, i + concurrency);
    workers.push(
      (async () => {
        await Promise.all(slice.map((item, idx) => handler(item, i + idx)));
      })()
    );
    i += concurrency;
  }
  await Promise.all(workers);
}

// Mock Shopify API data - In production, this would call actual Shopify APIs
const generateMockShopifyData = (storeId: string) => {
  // Reduce counts to keep preview sync fast
  const customers = Array.from({ length: 20 }, (_, i) => ({
    id: `customer_${i + 1}`,
    email: `customer${i + 1}@example.com`,
    first_name: `Customer`,
    last_name: `${i + 1}`,
    phone: `+1555${String(i + 1).padStart(7, '0')}`,
    total_spent: Math.floor(Math.random() * 5000) + 100,
    orders_count: Math.floor(Math.random() * 20) + 1,
    state: "enabled",
    tags: ["vip", "newsletter"].slice(0, Math.floor(Math.random() * 3)),
    accepts_marketing: Math.random() > 0.5,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const products = Array.from({ length: 15 }, (_, i) => ({
    id: `product_${i + 1}`,
    title: `Product ${i + 1}`,
    handle: `product-${i + 1}`,
    product_type: ["Electronics", "Clothing", "Home", "Books"][Math.floor(Math.random() * 4)],
    vendor: ["Brand A", "Brand B", "Brand C"][Math.floor(Math.random() * 3)],
    status: "active",
    tags: ["featured", "sale", "new"].slice(0, Math.floor(Math.random() * 4)),
    variants: [{
      price: (Math.random() * 200 + 10).toFixed(2),
      compare_at_price: (Math.random() * 300 + 50).toFixed(2),
      inventory_quantity: Math.floor(Math.random() * 100),
    }],
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }));

  const orders = Array.from({ length: 40 }, (_, i) => {
    const orderDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000);
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const totalPrice = Math.floor(Math.random() * 500) + 20;
    
    return {
      id: `order_${i + 1}`,
      order_number: `#${1000 + i}`,
      customer: {
        id: customer.id,
        email: customer.email,
      },
      email: customer.email,
      total_price: totalPrice.toString(),
      subtotal_price: (totalPrice * 0.9).toString(),
      total_tax: (totalPrice * 0.1).toString(),
      total_discounts: "0.00",
      currency: "USD",
      financial_status: ["paid", "pending", "authorized"][Math.floor(Math.random() * 3)],
      fulfillment_status: ["fulfilled", "partial", null][Math.floor(Math.random() * 3)],
      tags: ["priority", "gift"].slice(0, Math.floor(Math.random() * 3)),
      created_at: orderDate.toISOString(),
      updated_at: orderDate.toISOString(),
      line_items: [{
        product_id: products[Math.floor(Math.random() * products.length)].id,
        variant_id: `variant_${i + 1}`,
        title: `Product ${Math.floor(Math.random() * 30) + 1}`,
        quantity: Math.floor(Math.random() * 3) + 1,
        price: (totalPrice / 2).toString(),
        total_discount: "0.00",
        sku: `SKU-${i + 1}`,
      }],
    };
  });

  return { customers, products, orders };
};

// Sync customers from Shopify
export const syncCustomers = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    try {
      // Start sync log
      const syncLogId = await ctx.runMutation(internal.syncLogs.createSyncLog, {
        storeId,
        syncType: "customers",
        status: "in_progress",
      });

      const { customers } = generateMockShopifyData(storeId);
      
      let processedCount = 0;

      // Process in parallel batches
      await processInBatches(customers, async (customer) => {
        await ctx.runMutation(api.customers.upsertCustomer, {
          storeId,
          shopifyCustomerId: customer.id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
          phone: customer.phone,
          totalSpent: customer.total_spent,
          ordersCount: customer.orders_count,
          state: customer.state,
          tags: customer.tags,
          acceptsMarketing: customer.accepts_marketing,
          shopifyCreatedAt: customer.created_at,
          shopifyUpdatedAt: customer.updated_at,
        });
        processedCount++;
      });

      // Complete sync log
      await ctx.runMutation(internal.syncLogs.completeSyncLog, {
        syncLogId,
        status: "success",
        recordsProcessed: processedCount,
      });

      return { success: true, recordsProcessed: processedCount };
    } catch (error) {
      console.error("Customer sync error:", error);
      throw new Error(`Failed to sync customers: ${error}`);
    }
  },
});

// Sync products from Shopify
export const syncProducts = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    try {
      const syncLogId = await ctx.runMutation(internal.syncLogs.createSyncLog, {
        storeId,
        syncType: "products",
        status: "in_progress",
      });

      const { products } = generateMockShopifyData(storeId);
      let processedCount = 0;

      await processInBatches(products, async (product) => {
        const variant = product.variants[0];
        await ctx.runMutation(api.products.upsertProduct, {
          storeId,
          shopifyProductId: product.id,
          title: product.title,
          handle: product.handle,
          productType: product.product_type,
          vendor: product.vendor,
          status: product.status,
          tags: product.tags,
          price: parseFloat(variant.price),
          compareAtPrice: parseFloat(variant.compare_at_price),
          inventoryQuantity: variant.inventory_quantity,
          shopifyCreatedAt: product.created_at,
          shopifyUpdatedAt: product.updated_at,
        });
        processedCount++;
      });

      await ctx.runMutation(internal.syncLogs.completeSyncLog, {
        syncLogId,
        status: "success",
        recordsProcessed: processedCount,
      });

      return { success: true, recordsProcessed: processedCount };
    } catch (error) {
      console.error("Product sync error:", error);
      throw new Error(`Failed to sync products: ${error}`);
    }
  },
});

// Sync orders from Shopify
export const syncOrders = action({
  args: { storeId: v.id("stores") },
  handler: async (ctx, { storeId }) => {
    try {
      const syncLogId = await ctx.runMutation(internal.syncLogs.createSyncLog, {
        storeId,
        syncType: "orders",
        status: "in_progress",
      });

      const { orders } = generateMockShopifyData(storeId);
      let processedCount = 0;

      await processInBatches(orders, async (order) => {
        // Find or create customer
        let customerId: Id<"customers"> | undefined = undefined;
        if (order.customer?.id) {
          const customer = await ctx.runQuery(api.customers.getCustomerByShopifyId, {
            storeId,
            shopifyCustomerId: order.customer.id,
          });
          customerId = customer?._id ?? undefined;
        }

        const orderId = await ctx.runMutation(api.orders.upsertOrder, {
          storeId,
          shopifyOrderId: order.id,
          orderNumber: order.order_number,
          customerId,
          customerEmail: order.email,
          totalPrice: parseFloat(order.total_price),
          subtotalPrice: parseFloat(order.subtotal_price),
          totalTax: parseFloat(order.total_tax),
          totalDiscounts: parseFloat(order.total_discounts),
          currency: order.currency,
          financialStatus: order.financial_status,
          fulfillmentStatus: order.fulfillment_status ?? undefined,
          tags: order.tags,
          orderDate: order.created_at,
          shopifyCreatedAt: order.created_at,
          shopifyUpdatedAt: order.updated_at,
        });

        // Sync line items (usually small; keep sequential)
        for (const lineItem of order.line_items) {
          await ctx.runMutation(internal.orderLineItems.upsertLineItem, {
            storeId,
            orderId,
            shopifyProductId: lineItem.product_id,
            shopifyVariantId: lineItem.variant_id,
            title: lineItem.title,
            quantity: lineItem.quantity,
            price: parseFloat(lineItem.price),
            totalDiscount: parseFloat(lineItem.total_discount),
            sku: lineItem.sku,
          });
        }

        processedCount++;
      });

      await ctx.runMutation(internal.syncLogs.completeSyncLog, {
        syncLogId,
        status: "success",
        recordsProcessed: processedCount,
      });

      return { success: true, recordsProcessed: processedCount };
    } catch (error) {
      console.error("Order sync error:", error);
      throw new Error(`Failed to sync orders: ${error}`);
    }
  },
});

/* fullSync moved to src/convex/fullSync.ts */