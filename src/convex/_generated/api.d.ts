/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as analytics from "../analytics.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as customers from "../customers.js";
import type * as fullSync from "../fullSync.js";
import type * as http from "../http.js";
import type * as orderLineItems from "../orderLineItems.js";
import type * as orders from "../orders.js";
import type * as products from "../products.js";
import type * as shopifySync from "../shopifySync.js";
import type * as stores from "../stores.js";
import type * as syncLogs from "../syncLogs.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "auth/emailOtp": typeof auth_emailOtp;
  auth: typeof auth;
  crons: typeof crons;
  customers: typeof customers;
  fullSync: typeof fullSync;
  http: typeof http;
  orderLineItems: typeof orderLineItems;
  orders: typeof orders;
  products: typeof products;
  shopifySync: typeof shopifySync;
  stores: typeof stores;
  syncLogs: typeof syncLogs;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
