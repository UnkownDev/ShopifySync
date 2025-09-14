import { useState } from "react";
import { useMutation } from "convex/react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Store } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface StoreSetupProps {
  open: boolean;
  onClose: () => void;
}

export default function StoreSetup({ open, onClose }: StoreSetupProps) {
  const [formData, setFormData] = useState({
    name: "",
    shopifyDomain: "",
    shopifyAccessToken: "",
    currency: "USD",
    timezone: "UTC",
  });
  const [isLoading, setIsLoading] = useState(false);

  const createStore = useMutation(api.stores.createStore);
  const syncStore = useAction(api.fullSync.fullSync);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const newStoreId = await createStore({
        name: formData.name,
        shopifyDomain: formData.shopifyDomain,
        shopifyAccessToken: formData.shopifyAccessToken || undefined,
        currency: formData.currency,
        timezone: formData.timezone,
      });

      if (formData.shopifyAccessToken) {
        await toast.promise(
          syncStore({ storeId: newStoreId }),
          {
            loading: "Running first sync...",
            success: (result) => `Synced ${result.results.customers} customers, ${result.results.products} products, ${result.results.orders} orders`,
            error: "Failed to run initial sync",
          }
        );
      }

      toast.success("Store connected successfully!");
      onClose();
      
      // Reset form
      setFormData({
        name: "",
        shopifyDomain: "",
        shopifyAccessToken: "",
        currency: "USD",
        timezone: "UTC",
      });
    } catch (error) {
      toast.error("Failed to connect store. Please try again.");
      console.error("Store creation error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-xl text-white shadow-xl shadow-emerald-900/30 rounded-xl">
        <motion.div
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 18, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 24, mass: 0.8 }}
          className="space-y-4"
        >
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center ring-1 ring-emerald-500/30">
                <Store className="h-5 w-5 text-primary" />
              </div>
              <DialogTitle>Connect Shopify Store</DialogTitle>
            </div>
            <DialogDescription className="text-emerald-200/80">
              Add your Shopify store to start syncing data and generating insights.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Store Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Store"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Shopify Domain</Label>
              <Input
                id="domain"
                placeholder="mystore.myshopify.com"
                value={formData.shopifyDomain}
                onChange={(e) => handleInputChange("shopifyDomain", e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your store's .myshopify.com domain
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="token">Access Token (Optional)</Label>
              <Input
                id="token"
                type="password"
                placeholder="shpat_..."
                value={formData.shopifyAccessToken}
                onChange={(e) => handleInputChange("shopifyAccessToken", e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to use demo data for testing
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(value) => handleInputChange("currency", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <Select value={formData.timezone} onValueChange={(value) => handleInputChange("timezone", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UTC">UTC</SelectItem>
                    <SelectItem value="America/New_York">Eastern</SelectItem>
                    <SelectItem value="America/Chicago">Central</SelectItem>
                    <SelectItem value="America/Denver">Mountain</SelectItem>
                    <SelectItem value="America/Los_Angeles">Pacific</SelectItem>
                    <SelectItem value="Europe/London">London</SelectItem>
                    <SelectItem value="Asia/Kolkata">India (Kolkata)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} className="border-emerald-500/40 hover:bg-emerald-500/10">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-500/90">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Connect Store
              </Button>
            </DialogFooter>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}