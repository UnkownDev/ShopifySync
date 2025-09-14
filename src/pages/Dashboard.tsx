import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton,
  SidebarInset,
  SidebarTrigger,
  SidebarFooter
} from "@/components/ui/sidebar";
import { 
  BarChart3, 
  Users, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  Store,
  Plus,
  RefreshCw,
  Settings,
  LogOut,
  Eye,
  Calendar,
  Package,
  Trash2 as TrashIcon,
  Loader2
} from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import StoreSetup from "@/components/StoreSetup";
import AnalyticsCharts from "@/components/AnalyticsCharts";
import TopCustomers from "@/components/TopCustomers";
import RecentOrders from "@/components/RecentOrders";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export default function Dashboard() {
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();
  const [selectedStoreId, setSelectedStoreId] = useState<Id<"stores"> | null>(null);
  const [showStoreSetup, setShowStoreSetup] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const stores = useQuery(
    api.stores.getUserStores,
    user ? {} : "skip"
  );
  const selectedStore = useQuery(
    api.stores.getStore,
    selectedStoreId ? { storeId: selectedStoreId } : "skip"
  );
  const analytics = useQuery(
    api.analytics.getDashboardAnalytics,
    selectedStoreId ? { storeId: selectedStoreId } : "skip"
  );

  const syncStore = useAction(api.fullSync.fullSync);
  const deleteStore = useMutation(api.stores.deleteStore);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (stores && stores.length > 0 && !selectedStoreId) {
      setSelectedStoreId(stores[0]._id);
    }
  }, [stores, selectedStoreId]);

  const handleSync = async () => {
    if (!selectedStoreId || isSyncing) return;

    setIsSyncing(true);
    const syncPromise = syncStore({ storeId: selectedStoreId });
    toast.promise(syncPromise, {
      loading: "Syncing store data...",
      success: (result) =>
        `Successfully synced ${result.results.customers} customers, ${result.results.products} products, and ${result.results.orders} orders`,
      error: "Failed to sync store data",
    });

    // Do not await here to keep UI responsive; settle state when done
    syncPromise
      .catch((error) => {
        console.error("Sync error:", error);
      })
      .finally(() => {
        setIsSyncing(false);
      });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleDeleteStore = async () => {
    if (!selectedStoreId) return;
    try {
      await deleteStore({ storeId: selectedStoreId });
      toast.success("Store deleted");
      setOpenDeleteDialog(false);
      setSelectedStoreId(null);
    } catch (error) {
      console.error("Delete store error:", error);
      toast.error("Failed to delete store");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!stores || stores.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-950 via-emerald-900 to-slate-900 text-white">
        <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Store className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Welcome to ShopifySync</CardTitle>
            <CardDescription>
              Connect your first Shopify store to get started with analytics and insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => setShowStoreSetup(true)} 
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Connect Shopify Store
            </Button>
          </CardContent>
        </Card>

        {showStoreSetup && (
          <StoreSetup 
            open={showStoreSetup} 
            onClose={() => setShowStoreSetup(false)} 
          />
        )}
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
        {/* Make sidebar match the dark dashboard theme */}
        <Sidebar className="bg-gradient-to-b from-slate-950/80 via-slate-900/70 to-emerald-950/60 text-white border-r border-emerald-500/20"
          innerClassName="bg-transparent"
        >
          <SidebarHeader className="border-b border-emerald-500/20 p-4 bg-transparent backdrop-blur">
            {/* Make brand clickable to return to landing */}
            <div 
              className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition"
              onClick={() => navigate("/")}
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/60 rounded-lg flex items-center justify-center">
                <Store className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-semibold">ShopifySync</span>
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4 bg-transparent backdrop-blur">
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Stores</h3>
                <SidebarMenu>
                  {stores.map((store) => (
                    <SidebarMenuItem key={store._id}>
                      <SidebarMenuButton
                        isActive={selectedStoreId === store._id}
                        onClick={() => setSelectedStoreId(store._id)}
                        className="bg-transparent text-white hover:bg-emerald-500/10 data-[active=true]:bg-emerald-600/20 data-[active=true]:text-white transition-colors"
                      >
                        <Store className="h-4 w-4" />
                        <span className="truncate">{store.name}</span>
                        {store.isActive && (
                          <Badge variant="secondary" className="ml-auto text-[10px] bg-emerald-600/20 text-emerald-300 border border-emerald-500/30">
                            Active
                          </Badge>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Actions</h3>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setShowStoreSetup(true)}
                      className="bg-transparent text-emerald-300 hover:bg-emerald-500/10 transition-colors"
                    >
                      <Plus className="h-4 w-4" />
                      Add Store
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={handleSync}
                      disabled={!selectedStoreId || isSyncing}
                      className="bg-transparent text-emerald-300 hover:bg-emerald-500/10 disabled:opacity-60 transition-colors"
                    >
                      {isSyncing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      Sync Data
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <AlertDialog open={openDeleteDialog} onOpenChange={setOpenDeleteDialog}>
                      <AlertDialogTrigger asChild>
                        <SidebarMenuButton
                          disabled={!selectedStoreId}
                          className="bg-transparent text-white hover:bg-emerald-500/10 disabled:opacity-60 transition-colors"
                        >
                          <TrashIcon className="h-4 w-4" />
                          Delete Store
                        </SidebarMenuButton>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this store?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently remove the store and its synced data from your dashboard. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteStore}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </SidebarMenuItem>
                </SidebarMenu>
              </div>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-emerald-500/20 p-4 bg-transparent backdrop-blur">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton className="bg-transparent text-white hover:bg-emerald-500/10 transition-colors">
                  <Settings className="h-4 w-4" />
                  Settings
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={handleSignOut} className="bg-transparent text-white hover:bg-emerald-500/10 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={async () => {
                    await signOut();
                    navigate("/auth");
                  }}
                  className="bg-transparent text-white hover:bg-emerald-500/10 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  Switch Account
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex-1 bg-transparent">
          <header className="flex h-16 shrink-0 items-center gap-2 border-b border-emerald-500/20 bg-emerald-950/40 backdrop-blur-md supports-[backdrop-filter]:bg-emerald-950/40 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">
                {selectedStore ? selectedStore.name : "Dashboard"}
              </h1>
              {selectedStore && (
                <Badge variant="outline" className="text-xs bg-white/10 text-white border-white/20">
                  {selectedStore.shopifyDomain}
                </Badge>
              )}
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSync}
                disabled={!selectedStoreId || isSyncing}
                className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
              >
                {isSyncing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                {isSyncing ? "Syncing..." : "Sync"}
              </Button>
            </div>
          </header>

          <main className="flex-1 p-6 space-y-6">
            {selectedStoreId ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="space-y-6"
              >
                {/* Currency formatter based on store */}
                {/* ADDED: currency formatter */}
                {/* Overview Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* ADDED: currency formatter helper */}
                  {(() => {
                    const currency = selectedStore?.currency || "USD";
                    const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency });
                    return (
                      <>
                        <Card className="bg-emerald-950/30 border-emerald-500/20 backdrop-blur-xl text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-200">Total Revenue</CardTitle>
                            <DollarSign className="h-4 w-4 text-emerald-300" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-emerald-400">
                              {fmt.format((analytics?.overview?.totalRevenue ?? 0))}
                            </div>
                            <div className="flex items-center text-xs text-emerald-300">
                              {(analytics?.overview?.revenueGrowth ?? 0) >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                              )}
                              {Math.abs(analytics?.overview?.revenueGrowth ?? 0).toFixed(1)}% from last week
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-emerald-950/30 border-emerald-500/20 backdrop-blur-xl text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-200">Total Orders</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-emerald-300" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {(analytics?.overview?.totalOrders ?? 0).toLocaleString()}
                            </div>
                            <div className="flex items-center text-xs text-emerald-200">
                              {(analytics?.overview?.orderGrowth ?? 0) >= 0 ? (
                                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                              ) : (
                                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                              )}
                              {Math.abs(analytics?.overview?.orderGrowth ?? 0).toFixed(1)}% from last week
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-emerald-950/30 border-emerald-500/20 backdrop-blur-xl text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-200">Total Customers</CardTitle>
                            <Users className="h-4 w-4 text-emerald-300" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">
                              {(analytics?.overview?.totalCustomers ?? 0).toLocaleString()}
                            </div>
                            <p className="text-xs text-emerald-200">
                              Active customer base
                            </p>
                          </CardContent>
                        </Card>

                        <Card className="bg-emerald-950/30 border-emerald-500/20 backdrop-blur-xl text-white">
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-emerald-200">Avg Order Value</CardTitle>
                            <BarChart3 className="h-4 w-4 text-emerald-300" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-emerald-400">
                              {fmt.format((analytics?.overview?.averageOrderValue ?? 0))}
                            </div>
                            <p className="text-xs text-emerald-300">
                              Per order average
                            </p>
                          </CardContent>
                        </Card>
                      </>
                    );
                  })()}
                </div>

                {/* Charts and Tables */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* PASS CURRENCY TO CHILDREN */}
                  <AnalyticsCharts storeId={selectedStoreId} currency={selectedStore?.currency} />
                  <TopCustomers storeId={selectedStoreId} currency={selectedStore?.currency} />
                </div>

                <RecentOrders storeId={selectedStoreId} currency={selectedStore?.currency} />
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Eye className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Data Available</h3>
                  <p className="text-emerald-300 mb-4">
                    Sync your store data to see analytics and insights.
                  </p>
                  <Button onClick={handleSync} disabled={!selectedStoreId}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Store Data
                  </Button>
                </div>
              </div>
            )}
          </main>
        </SidebarInset>
      </div>

      {showStoreSetup && (
        <StoreSetup 
          open={showStoreSetup} 
          onClose={() => setShowStoreSetup(false)} 
        />
      )}
    </SidebarProvider>
  );
}