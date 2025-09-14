import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, Crown, Mail } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface TopCustomersProps {
  storeId: Id<"stores">;
  // Optional currency to format amounts
  currency?: string;
}

export default function TopCustomers({ storeId, currency }: TopCustomersProps) {
  const topCustomers = useQuery(api.customers.getTopCustomers, {
    storeId,
    limit: 5,
  });

  // Currency formatter
  const curr = currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: curr });

  if (!topCustomers) {
    return (
      <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Customers
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

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Crown className="h-5 w-5 text-yellow-500" />
          Top Customers
        </CardTitle>
        <CardDescription>
          Customers ranked by total spend
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topCustomers.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Customers Yet</h3>
              <p className="text-muted-foreground">
                Sync your store data to see top customers.
              </p>
            </div>
          ) : (
            topCustomers.map((customer, index) => {
              const initials = customer.firstName && customer.lastName 
                ? `${customer.firstName[0]}${customer.lastName[0]}`.toUpperCase()
                : customer.email 
                ? customer.email.substring(0, 2).toUpperCase()
                : "??";

              const displayName = customer.firstName && customer.lastName
                ? `${customer.firstName} ${customer.lastName}`
                : customer.email || "Unknown Customer";

              return (
                <div key={customer._id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                  <div className="relative">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    {index === 0 && (
                      <Crown className="absolute -top-1 -right-1 h-4 w-4 text-yellow-500" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{displayName}</p>
                      {index < 3 && (
                        <Badge variant="secondary" className="text-xs">
                          #{index + 1}
                        </Badge>
                      )}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>{customer.ordersCount} orders</span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-semibold text-emerald-400">
                      {fmt.format(customer.totalSpent)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      total spent
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}