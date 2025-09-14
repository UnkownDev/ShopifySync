import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShoppingCart, Eye, Calendar } from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@/components/ui/input";

interface RecentOrdersProps {
  storeId: Id<"stores">;
  // ADDED: currency from Dashboard
  currency?: string;
}

export default function RecentOrders({ storeId, currency }: RecentOrdersProps) {
  const [cursor, setCursor] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const computedStartISO =
    startDate ? new Date(startDate + "T00:00:00.000Z").toISOString() : undefined;
  const computedEndISO =
    endDate ? new Date(new Date(endDate + "T23:59:59.999Z")).toISOString() : undefined;

  const orders = useQuery(api.orders.getOrders, {
    storeId,
    startDate: computedStartISO,
    endDate: computedEndISO,
    paginationOpts: {
      numItems: 10,
      cursor,
    },
  });

  // ADDED: currency formatter
  const curr = currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: curr });

  if (!orders) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Recent Orders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (status: string | undefined) => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "pending":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      case "authorized":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  const getFulfillmentColor = (status: string | undefined) => {
    switch (status) {
      case "fulfilled":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "partial":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>
              Latest orders from your store
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-white/30 text-white bg-white/10 hover:bg-white/20">
            <Eye className="h-4 w-4 mr-2" />
            View All
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">Start date</div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setCursor(null);
                setStartDate(e.target.value);
              }}
            />
          </div>
          <div className="sm:col-span-2">
            <div className="text-xs text-muted-foreground mb-1">End date</div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setCursor(null);
                setEndDate(e.target.value);
              }}
            />
          </div>
          <div className="flex items-end gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCursor(null);
                setStartDate("");
                setEndDate("");
              }}
              className="w-full border-white/30 text-white bg-white/10 hover:bg-white/20"
            >
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {orders.page.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
            <p className="text-muted-foreground">
              Sync your store data to see recent orders.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fulfillment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.page.map((order) => (
                  <TableRow key={order._id}>
                    <TableCell className="font-medium">
                      {order.orderNumber || `#${order.shopifyOrderId.slice(-6)}`}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {order.customerEmail || "Guest"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getStatusColor(order.financialStatus)}
                      >
                        {order.financialStatus || "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="secondary" 
                        className={getFulfillmentColor(order.fulfillmentStatus)}
                      >
                        {order.fulfillmentStatus || "unfulfilled"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {fmt.format(order.totalPrice)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {!orders.isDone && (
              <div className="flex justify-center">
                <Button 
                  variant="outline" 
                  onClick={() => setCursor(orders.continueCursor)}
                  className="border-white/30 text-white bg-white/10 hover:bg-white/20"
                >
                  Load More
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}