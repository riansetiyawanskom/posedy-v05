import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface DailySales {
  date: string;
  revenue: number;
  orders: number;
  profit: number;
}

export interface LowStockProduct {
  id: string;
  name: string;
  stock: number;
  category_name: string | null;
}

export interface PurchaseSummary {
  month: string;
  total: number;
  count: number;
}

const LOW_STOCK_THRESHOLD = 10;

export function useDashboard() {
  // Sales data for last 30 days
  const salesQuery = useQuery({
    queryKey: ["dashboard-sales"],
    queryFn: async () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: orders, error } = await supabase
        .from("orders")
        .select("id, total, subtotal, created_at")
        .gte("created_at", thirtyDaysAgo.toISOString())
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Get order items with product cost for profit calc
      const orderIds = (orders ?? []).map((o) => o.id);
      let itemsData: Array<{ order_id: string; quantity: number; unit_price: number; product_id: string }> = [];
      if (orderIds.length > 0) {
        const { data, error: itemsError } = await supabase
          .from("order_items")
          .select("order_id, quantity, unit_price, product_id")
          .in("order_id", orderIds);
        if (itemsError) throw itemsError;
        itemsData = data ?? [];
      }

      // Get cost prices for all products
      const productIds = [...new Set(itemsData.map((i) => i.product_id))];
      let costMap: Record<string, number> = {};
      if (productIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, cost_price")
          .in("id", productIds);
        (products ?? []).forEach((p) => {
          costMap[p.id] = p.cost_price ?? 0;
        });
      }

      // Group by date
      const dailyMap = new Map<string, DailySales>();
      for (const order of orders ?? []) {
        const date = new Date(order.created_at!).toISOString().split("T")[0];
        const existing = dailyMap.get(date) || { date, revenue: 0, orders: 0, profit: 0 };
        existing.revenue += Number(order.total);
        existing.orders += 1;

        // Calc profit for this order
        const orderItems = itemsData.filter((i) => i.order_id === order.id);
        for (const item of orderItems) {
          const cost = costMap[item.product_id] ?? 0;
          existing.profit += (item.unit_price - cost) * item.quantity;
        }

        dailyMap.set(date, existing);
      }

      return Array.from(dailyMap.values());
    },
  });

  // Summary totals
  const summaryQuery = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

      // Today's sales
      const { data: todayOrders } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", startOfDay)
        .eq("status", "completed");

      // This month's sales
      const { data: monthOrders } = await supabase
        .from("orders")
        .select("total")
        .gte("created_at", startOfMonth)
        .eq("status", "completed");

      // This month's purchases
      const { data: monthPurchases } = await supabase
        .from("purchase_orders")
        .select("total")
        .gte("created_at", startOfMonth)
        .eq("status", "received");

      const todayRevenue = (todayOrders ?? []).reduce((s, o) => s + Number(o.total), 0);
      const todayOrderCount = (todayOrders ?? []).length;
      const monthRevenue = (monthOrders ?? []).reduce((s, o) => s + Number(o.total), 0);
      const monthOrderCount = (monthOrders ?? []).length;
      const monthPurchaseTotal = (monthPurchases ?? []).reduce((s, o) => s + Number(o.total), 0);
      const monthPurchaseCount = (monthPurchases ?? []).length;

      return {
        todayRevenue,
        todayOrderCount,
        monthRevenue,
        monthOrderCount,
        monthPurchaseTotal,
        monthPurchaseCount,
      };
    },
  });

  // Low stock products
  const lowStockQuery = useQuery({
    queryKey: ["dashboard-low-stock"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, stock, category_id, categories(name)")
        .eq("is_active", true)
        .lte("stock", LOW_STOCK_THRESHOLD)
        .order("stock", { ascending: true })
        .limit(20);

      if (error) throw error;

      return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name,
        stock: p.stock ?? 0,
        category_name: p.categories?.name ?? null,
      })) as LowStockProduct[];
    },
  });

  // Monthly purchase trend (last 6 months)
  const purchaseTrendQuery = useQuery({
    queryKey: ["dashboard-purchase-trend"],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data, error } = await supabase
        .from("purchase_orders")
        .select("total, created_at")
        .gte("created_at", sixMonthsAgo.toISOString())
        .eq("status", "received")
        .order("created_at", { ascending: true });

      if (error) throw error;

      const monthMap = new Map<string, PurchaseSummary>();
      for (const po of data ?? []) {
        const d = new Date(po.created_at);
        const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const existing = monthMap.get(month) || { month, total: 0, count: 0 };
        existing.total += Number(po.total);
        existing.count += 1;
        monthMap.set(month, existing);
      }

      return Array.from(monthMap.values());
    },
  });

  return {
    dailySales: salesQuery.data ?? [],
    summary: summaryQuery.data,
    lowStockProducts: lowStockQuery.data ?? [],
    purchaseTrend: purchaseTrendQuery.data ?? [],
    isLoading: salesQuery.isLoading || summaryQuery.isLoading || lowStockQuery.isLoading,
  };
}
