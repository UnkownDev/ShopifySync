import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  BarChart3, 
  Database, 
  Zap, 
  Shield, 
  Users, 
  TrendingUp,
  CheckCircle,
  Store,
  RefreshCw,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { 
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent
} from "@/components/ui/tabs";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import AuthPage from "@/pages/Auth.tsx";

export default function Landing() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const [openDemo, setOpenDemo] = useState(false);
  const [openAuth, setOpenAuth] = useState(false);

  // New compact bullets for hero
  const heroBullets = [
    { icon: <Zap className="h-4 w-4" />, label: "Real-time Updates" },
    { icon: <BarChart3 className="h-4 w-4" />, label: "Advanced Analytics" },
    { icon: <Users className="h-4 w-4" />, label: "Multi-store Support" },
    { icon: <Shield className="h-4 w-4" />, label: "Secure & Private" },
  ];

  // Feature cards (3-up)
  const featureCards = [
    {
      icon: <TrendingUp className="h-5 w-5" />,
      title: "Real-time Analytics",
      desc:
        "Track your sales, revenue, and customer behavior with live updates and clean visualizations.",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "Multi-store Management",
      desc:
        "Manage multiple Shopify stores from one dashboard with secure token storage.",
    },
    {
      icon: <Store className="h-5 w-5" />,
      title: "Order Tracking",
      desc:
        "Monitor orders as they come in via webhooks with detailed order information.",
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white">
      {/* Navigation */}
      <nav className="border-b border-white/10 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate("/")}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center ring-1 ring-emerald-500/30">
                <Store className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="text-xl font-bold text-white">ShopifySync</span>
            </motion.div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Button onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })} className="bg-emerald-500 hover:bg-emerald-600">
                  <Eye className="mr-2 h-4 w-4" />
                  Dashboard
                </Button>
              ) : (
                <Button onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })} className="bg-emerald-500 hover:bg-emerald-600">
                  Let's Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 lg:py-28">
        {/* Ambient accents */}
        <motion.div
          className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-24 -right-24 w-[28rem] h-[28rem] bg-cyan-500/10 rounded-full blur-3xl"
          animate={{ scale: [1.2, 1, 1.2], opacity: [0.25, 0.45, 0.25] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left: Headline + bullets */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <Badge
                variant="secondary"
                className="mb-2 w-fit bg-emerald-500/15 text-emerald-300 border border-emerald-500/20"
              >
                Real-time Shopify Dashboard
              </Badge>

              <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight">
                <span className="text-white">Real-time</span>{" "}
                <span className="text-emerald-400">Shopify</span>{" "}
                <span className="text-white">Dashboard</span>
              </h1>

              <p className="text-lg text-slate-300 max-w-xl">
                Monitor your Shopify stores in real-time. Track orders, analyze
                sales, and manage multiple stores from one powerful dashboard.
              </p>

              <div className="grid grid-cols-2 gap-3 max-w-md">
                {heroBullets.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-emerald-200"
                  >
                    <span className="grid place-items-center rounded-md bg-emerald-500/15 p-1.5">
                      {b.icon}
                    </span>
                    <span className="text-sm">{b.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  size="lg"
                  onClick={() => document.getElementById("auth-card")?.scrollIntoView({ behavior: "smooth" })}
                  className="bg-emerald-500 hover:bg-emerald-600"
                >
                  Let's Start
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setOpenDemo(true)}
                  className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10"
                >
                  View Demo
                  <Eye className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </motion.div>

            {/* Right: Get Started Card (routes to /auth) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <Card id="auth-card" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-xl">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src="/logo.svg"
                        alt="ShopifySync Logo"
                        width={32}
                        height={32}
                        className="rounded-md shadow-[0_0_24px_rgba(16,185,129,0.25)]"
                      />
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white">Get Started</h3>
                    </div>
                    <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/20">
                      Secure Login
                    </Badge>
                  </div>

                  <div className="mt-2">
                    <AuthPage redirectAfterAuth="/dashboard" force embedded />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Section: Everything you need */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl md:text-4xl font-extrabold text-white">
              Everything you need to manage your Shopify stores
            </h2>
            <p className="text-slate-300 mt-2">
              Powerful features designed to help you monitor, analyze, and grow
              your e‑commerce business.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featureCards.map((c, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <Card className="h-full bg-slate-900/60 border-white/10 backdrop-blur-xl hover:border-emerald-400/30 transition-colors">
                  <CardContent className="p-6">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-300 grid place-items-center mb-4">
                      {c.icon}
                    </div>
                    <div className="text-white font-semibold mb-1">
                      {c.title}
                    </div>
                    <p className="text-sm text-slate-300">{c.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Modal */}
      <Dialog open={openDemo} onOpenChange={setOpenDemo}>
        <DialogContent className="max-w-5xl">
          <DialogHeader>
            <DialogTitle>ShopifySync Demo</DialogTitle>
            <DialogDescription>
              Explore a realistic preview of insights and data you'll see in your dashboard.
            </DialogDescription>
          </DialogHeader>

          {/* New creative demo: Tabs with Overview, Orders, Customers */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="customers">Customers</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6 space-y-6">
              {/* KPI cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">$2,456,120</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +12.4% WoW
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Total Orders</div>
                    <div className="text-2xl font-bold">15,847</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +6.8% WoW
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Active Customers</div>
                    <div className="text-2xl font-bold">8,392</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Engaged last 90 days
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trend graph (existing improved) */}
              <Card className="bg-card/70 backdrop-blur border-0">
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-2">Revenue Trend (Demo)</div>
                  <div className="w-full overflow-x-auto">
                    <svg
                      width="100%"
                      height="200"
                      viewBox="0 0 900 200"
                      preserveAspectRatio="none"
                      className="rounded-md bg-muted"
                      role="img"
                      aria-label="Demo revenue line chart"
                    >
                      <line x1="16" y1="184" x2="884" y2="184" stroke="hsl(var(--border))" strokeWidth="1" />
                      <polyline
                        fill="none"
                        stroke="hsl(var(--primary))"
                        strokeWidth="2.5"
                        points="16,160 84,170 152,140 220,150 288,120 356,130 424,110 492,135 560,100 628,115 696,95 764,105 832,88 884,80"
                      />
                      <polyline
                        fill="url(#demoGrad2)"
                        stroke="none"
                        points="16,184 16,160 84,170 152,140 220,150 288,120 356,130 424,110 492,135 560,100 628,115 696,95 764,105 832,88 884,80 884,184"
                        opacity="0.15"
                      />
                      <defs>
                        <linearGradient id="demoGrad2" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Sample trend over the last 14 periods</div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="orders" className="mt-6">
              <Card className="bg-card/70 backdrop-blur border-0">
                <CardContent className="p-4">
                  <div className="text-sm font-medium mb-3">Recent Orders (Demo)</div>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>#2345</TableCell>
                        <TableCell>Ava Johnson</TableCell>
                        <TableCell>2024-08-12</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">paid</Badge>
                        </TableCell>
                        <TableCell className="text-right">$182.40</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>#2346</TableCell>
                        <TableCell>Liam Brown</TableCell>
                        <TableCell>2024-08-12</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">pending</Badge>
                        </TableCell>
                        <TableCell className="text-right">$76.20</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>#2347</TableCell>
                        <TableCell>Sophia Lee</TableCell>
                        <TableCell>2024-08-11</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">authorized</Badge>
                        </TableCell>
                        <TableCell className="text-right">$241.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="customers" className="mt-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">New Customers (30d)</div>
                    <div className="text-2xl font-bold">1,248</div>
                    <div className="text-xs text-green-600 flex items-center gap-1 mt-1">
                      <TrendingUp className="h-3 w-3" />
                      +9.1% MoM
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Returning Rate</div>
                    <div className="text-2xl font-bold">38%</div>
                    <div className="text-xs text-muted-foreground mt-1">Repeat purchase</div>
                  </CardContent>
                </Card>
                <Card className="bg-card/70 backdrop-blur border-0">
                  <CardContent className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">Avg LTV</div>
                    <div className="text-2xl font-bold">$312</div>
                    <div className="text-xs text-muted-foreground mt-1">Per active customer</div>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-card/70 backdrop-blur border-0">
                <CardContent className="p-4 space-y-4">
                  <div className="text-sm font-medium">Segments</div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">VIP (Top 10%)</Badge>
                    <Badge variant="secondary">High Intent</Badge>
                    <Badge variant="secondary">Dormant</Badge>
                    <Badge variant="secondary">Newsletter</Badge>
                    <Badge variant="secondary">First-time</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-24 text-xs text-muted-foreground">VIP</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: "24%" }} />
                      </div>
                      <div className="w-10 text-xs text-right">24%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 text-xs text-muted-foreground">High Intent</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: "36%" }} />
                      </div>
                      <div className="w-10 text-xs text-right">36%</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 text-xs text-muted-foreground">Dormant</div>
                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary to-primary/60" style={{ width: "18%" }} />
                      </div>
                      <div className="w-10 text-xs text-right">18%</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setOpenDemo(false)}>Close</Button>
            <Button onClick={() => { setOpenDemo(false); navigate(isAuthenticated ? "/dashboard" : "/auth?force=1"); }}>
              {isAuthenticated ? "Open My Dashboard" : "Try It Now"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Auth Modal */}
      <Dialog open={openAuth} onOpenChange={setOpenAuth}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome back</DialogTitle>
            <DialogDescription>Sign in or sign up without leaving this page.</DialogDescription>
          </DialogHeader>
          {/* Embed existing Auth flow with Google option; force to always show auth even if already signed in */}
          <div className="mt-2">
            <AuthPage redirectAfterAuth="/dashboard" force embedded />
          </div>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/40 backdrop-blur-md py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-6 h-6 bg-gradient-to-br from-primary to-primary/60 rounded-md flex items-center justify-center">
                <Store className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">ShopifySync</span>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 ShopifySync. Built with ❤️ for enterprise retailers.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}