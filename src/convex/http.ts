import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { httpAction } from "./_generated/server";
import { internal, api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

http.route({
  path: "/webhooks/shopify",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      // Shopify sends topic and shop domain in headers; also support `?shop=` as fallback
      const topic = req.headers.get("x-shopify-topic") || "";
      const shopHeader = req.headers.get("x-shopify-shop-domain");
      const url = new URL(req.url);
      const shopParam = url.searchParams.get("shop");
      const shop = (shopHeader || shopParam || "").toLowerCase();

      if (!shop) {
        return new Response("Missing shop domain", { status: 400 });
      }

      // Find store by domain
      const store = await ctx.runQuery(internal.stores.getStoreByDomain, {
        shopifyDomain: shop,
      });
      if (!store) {
        return new Response("Store not found", { status: 404 });
      }

      // Parse payload
      const body = await req.json();

      // Route by topic
      if (topic.startsWith("customers/")) {
        // Minimal mapping consistent with upsertCustomer
        await ctx.runMutation(api.customers.upsertCustomer, {
          storeId: store._id,
          shopifyCustomerId: String(body.id),
          email: body.email ?? undefined,
          firstName: body.first_name ?? undefined,
          lastName: body.last_name ?? undefined,
          phone: body.phone ?? undefined,
          totalSpent: Number(body.total_spent ?? 0),
          ordersCount: Number(body.orders_count ?? 0),
          state: body.state ?? undefined,
          tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
          acceptsMarketing: typeof body.accepts_marketing === "boolean" ? body.accepts_marketing : undefined,
          shopifyCreatedAt: body.created_at ?? undefined,
          shopifyUpdatedAt: body.updated_at ?? undefined,
        });
      } else if (topic.startsWith("products/")) {
        const variant = Array.isArray(body.variants) && body.variants.length > 0 ? body.variants[0] : undefined;
        await ctx.runMutation(api.products.upsertProduct, {
          storeId: store._id,
          shopifyProductId: String(body.id),
          title: String(body.title ?? "Untitled"),
          handle: body.handle ?? undefined,
          productType: body.product_type ?? undefined,
          vendor: body.vendor ?? undefined,
          status: body.status ?? undefined,
          tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
          price: variant ? Number(variant.price ?? 0) : undefined,
          compareAtPrice: variant && variant.compare_at_price != null ? Number(variant.compare_at_price) : undefined,
          inventoryQuantity: variant && variant.inventory_quantity != null ? Number(variant.inventory_quantity) : undefined,
          shopifyCreatedAt: body.created_at ?? undefined,
          shopifyUpdatedAt: body.updated_at ?? undefined,
        });
      } else if (topic.startsWith("orders/")) {
        // Resolve customerId if present
        let customerId: import("./_generated/dataModel").Id<"customers"> | undefined = undefined;
        const cust = body.customer;
        if (cust?.id) {
          const existing = await ctx.runQuery(api.customers.getCustomerByShopifyId, {
            storeId: store._id,
            shopifyCustomerId: String(cust.id),
          });
          customerId = existing?._id ?? undefined;
        }

        const orderId = await ctx.runMutation(api.orders.upsertOrder, {
          storeId: store._id,
          shopifyOrderId: String(body.id),
          orderNumber: body.order_number ? String(body.order_number) : undefined,
          customerId,
          customerEmail: body.email ?? undefined,
          totalPrice: Number(body.total_price ?? 0),
          subtotalPrice: body.subtotal_price != null ? Number(body.subtotal_price) : undefined,
          totalTax: body.total_tax != null ? Number(body.total_tax) : undefined,
          totalDiscounts: body.total_discounts != null ? Number(body.total_discounts) : undefined,
          currency: String(body.currency ?? store.currency ?? "USD"),
          financialStatus: body.financial_status ?? undefined,
          fulfillmentStatus: body.fulfillment_status ?? undefined,
          tags: Array.isArray(body.tags) ? body.tags : typeof body.tags === "string" ? body.tags.split(",").map((t: string) => t.trim()).filter(Boolean) : undefined,
          orderDate: body.created_at ?? new Date().toISOString(),
          shopifyCreatedAt: body.created_at ?? undefined,
          shopifyUpdatedAt: body.updated_at ?? undefined,
        });

        // Line items
        if (Array.isArray(body.line_items)) {
          for (const li of body.line_items) {
            await ctx.runMutation(internal.orderLineItems.upsertLineItem, {
              storeId: store._id,
              orderId,
              shopifyProductId: li.product_id != null ? String(li.product_id) : undefined,
              shopifyVariantId: li.variant_id != null ? String(li.variant_id) : undefined,
              title: String(li.title ?? "Item"),
              quantity: Number(li.quantity ?? 1),
              price: Number(li.price ?? 0),
              totalDiscount: li.total_discount != null ? Number(li.total_discount) : undefined,
              sku: li.sku ?? undefined,
            });
          }
        }
      } else {
        // Unknown or unhandled topic; acknowledge
        return new Response("Unhandled topic", { status: 200 });
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Webhook error:", err);
      return new Response("Internal error", { status: 500 });
    }
  }),
});

export default http;