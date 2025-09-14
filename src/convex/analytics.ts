import { v } from "convex/values";
import { query } from "./_generated/server";
import { getCurrentUser } from "./users";

// Get comprehensive dashboard analytics
export const getDashboardAnalytics = query({
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

    // Get all data in parallel
    const [customers, orders, products] = await Promise.all([
      ctx.db.query("customers").withIndex("by_store", (q) => q.eq("storeId", storeId)).collect(),
      ctx.db.query("orders").withIndex("by_store", (q) => q.eq("storeId", storeId)).collect(),
      ctx.db.query("products").withIndex("by_store", (q) => q.eq("storeId", storeId)).collect(),
    ]);

    // Calculate metrics
    const totalCustomers = customers.length;
    const totalOrders = orders.length;
    const totalProducts = products.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalPrice, 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Top customers by spend
    const topCustomers = customers
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5)
      .map(customer => ({
        id: customer._id,
        name: `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || customer.email || 'Unknown',
        email: customer.email,
        totalSpent: customer.totalSpent,
        ordersCount: customer.ordersCount,
      }));

    // Recent orders trend (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders.filter(order => 
      new Date(order.orderDate) >= thirtyDaysAgo
    );

    // Group orders by date for chart
    const ordersByDate = recentOrders.reduce((acc, order) => {
      const date = order.orderDate.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, count: 0, revenue: 0 };
      }
      acc[date].count += 1;
      acc[date].revenue += order.totalPrice;
      return acc;
    }, {} as Record<string, { date: string; count: number; revenue: number }>);

    const chartData = Object.values(ordersByDate)
      .sort((a, b) => a.date.localeCompare(b.date));

    // Calculate growth metrics
    const lastWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= weekAgo;
    });

    const previousWeekOrders = orders.filter(order => {
      const orderDate = new Date(order.orderDate);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return orderDate >= twoWeeksAgo && orderDate < weekAgo;
    });

    const orderGrowth = previousWeekOrders.length > 0 
      ? ((lastWeekOrders.length - previousWeekOrders.length) / previousWeekOrders.length) * 100
      : 0;

    const lastWeekRevenue = lastWeekOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    const previousWeekRevenue = previousWeekOrders.reduce((sum, order) => sum + order.totalPrice, 0);
    
    const revenueGrowth = previousWeekRevenue > 0 
      ? ((lastWeekRevenue - previousWeekRevenue) / previousWeekRevenue) * 100
      : 0;

    return {
      overview: {
        totalCustomers,
        totalOrders,
        totalProducts,
        totalRevenue,
        averageOrderValue,
        orderGrowth,
        revenueGrowth,
      },
      topCustomers,
      chartData,
      recentActivity: {
        ordersLast30Days: recentOrders.length,
        revenueLast30Days: recentOrders.reduce((sum, order) => sum + order.totalPrice, 0),
      },
    };
  },
});

// Get revenue trends for different time periods
export const getRevenueTrends = query({
  args: { 
    storeId: v.id("stores"),
    period: v.union(v.literal("7d"), v.literal("30d"), v.literal("90d"), v.literal("1y")),
  },
  handler: async (ctx, { storeId, period }) => {
    const user = await getCurrentUser(ctx);
    if (!user) {
      throw new Error("Not authenticated");
    }

    // Verify store ownership
    const store = await ctx.db.get(storeId);
    if (!store || store.ownerId !== user._id) {
      throw new Error("Store not found or access denied");
    }

    const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
    const days = daysMap[period];
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_store", (q) => q.eq("storeId", storeId))
      .collect();

    const filteredOrders = orders.filter(order => 
      new Date(order.orderDate) >= startDate
    );

    // Group by appropriate time unit
    const groupBy = period === "1y" ? "month" : "day";
    
    const grouped = filteredOrders.reduce((acc, order) => {
      const date = new Date(order.orderDate);
      const key = groupBy === "month" 
        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        : order.orderDate.split('T')[0];
      
      if (!acc[key]) {
        acc[key] = { period: key, revenue: 0, orders: 0 };
      }
      acc[key].revenue += order.totalPrice;
      acc[key].orders += 1;
      return acc;
    }, {} as Record<string, { period: string; revenue: number; orders: number }>);

    return Object.values(grouped).sort((a, b) => a.period.localeCompare(b.period));
  },
});
