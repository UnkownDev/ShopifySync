import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BarChart3, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface AnalyticsChartsProps {
  storeId: Id<"stores">;
  // ADDED: optional currency passed from Dashboard
  currency?: string;
}

export default function AnalyticsCharts({ storeId, currency }: AnalyticsChartsProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");
  const [showGraph, setShowGraph] = useState<boolean>(false);
  // ADD: interactive hover index
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  
  const revenueTrends = useQuery(api.analytics.getRevenueTrends, {
    storeId,
    period,
  });

  const analytics = useQuery(api.analytics.getDashboardAnalytics, { storeId });

  if (!revenueTrends || !analytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Revenue Trends
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

  // ADDED: currency formatter
  const curr = currency || "USD";
  const fmt = new Intl.NumberFormat(undefined, { style: "currency", currency: curr });

  // FIX: clamp max to avoid -Infinity/NaN when array is empty or all zeros
  const maxRevenue = Math.max(1, ...revenueTrends.map(d => d.revenue));
  const totalRevenue = revenueTrends.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = revenueTrends.reduce((sum, d) => sum + d.orders, 0);

  // Prepare data for simple line graph
  const graphData = revenueTrends.slice(-30); // limit for readability
  // FIX: responsive sizing + clearer spacing
  const padding = 12;
  const graphHeight = 180;
  const graphWidth = Math.max(320, Math.min(900, padding * 2 + Math.max(0, graphData.length - 1) * 22));
  const xStep = graphData.length > 1 ? (graphWidth - padding * 2) / (graphData.length - 1) : 0;
  const points = graphData.map((d, i) => {
    const x = padding + i * xStep;
    const y =
      maxRevenue > 0
        ? padding + (graphHeight - padding * 2) * (1 - d.revenue / maxRevenue)
        : graphHeight / 2;
    return `${x},${y}`;
  }).join(" ");
  const pointCoords = graphData.map((d, i) => {
    const x = padding + i * xStep;
    const y = maxRevenue > 0
      ? padding + (graphHeight - padding * 2) * (1 - d.revenue / maxRevenue)
      : graphHeight / 2;
    return { x, y };
  });

  const handlePointerMove = (clientX: number, target: SVGSVGElement) => {
    if (graphData.length <= 1) return;
    const rect = target.getBoundingClientRect();
    const x = clientX - rect.left;
    const idxRaw = xStep > 0 ? Math.round((x - padding) / xStep) : 0;
    const idx = Math.max(0, Math.min(graphData.length - 1, idxRaw));
    setHoverIndex(idx);
  };

  return (
    <Card className="bg-white/5 border-white/10 backdrop-blur-xl text-white">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Revenue Trends
            </CardTitle>
            <CardDescription>
              Revenue and order trends over time
            </CardDescription>
          </div>

          <div className="flex items-center gap-3">
            {/* Add: Graph view switch */}
            <div className="flex items-center gap-2">
              <Label htmlFor="graph-switch" className="text-xs text-muted-foreground">
                Graph
              </Label>
              <Switch id="graph-switch" checked={showGraph} onCheckedChange={setShowGraph} />
            </div>

            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {fmt.format(totalRevenue)}
              </div>
              <div className="text-muted-foreground">Total Revenue</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {totalOrders.toLocaleString()}
              </div>
              <div className="text-muted-foreground">Total Orders</div>
            </div>
          </div>

          {/* Replace: Bars-only with conditional Bars/Graph */}
          {showGraph ? (
            <div className="space-y-2">
              <div className="text-sm font-medium">Revenue Trend (Graph)</div>
              <div className="w-full overflow-x-auto">
                {/* ADD: relative wrapper for tooltip positioning */}
                <div className="relative" style={{ width: graphWidth }}>
                  <svg
                    width={graphWidth}
                    height={graphHeight}
                    className="rounded-md bg-muted"
                    role="img"
                    aria-label="Revenue line chart"
                    onMouseMove={(e) => handlePointerMove(e.clientX, e.currentTarget)}
                    onMouseLeave={() => setHoverIndex(null)}
                    onTouchStart={(e) => {
                      const t = e.touches[0];
                      handlePointerMove(t.clientX, e.currentTarget);
                    }}
                    onTouchMove={(e) => {
                      const t = e.touches[0];
                      handlePointerMove(t.clientX, e.currentTarget);
                    }}
                  >
                    {/* Baseline */}
                    <line
                      x1={padding}
                      y1={graphHeight - padding}
                      x2={graphWidth - padding}
                      y2={graphHeight - padding}
                      stroke="hsl(var(--border))"
                      strokeWidth="1"
                    />
                    {/* Line */}
                    <polyline
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="2"
                      points={points}
                    />
                    {/* Data point markers */}
                    {pointCoords.map((p, idx) => (
                      <circle
                        key={idx}
                        cx={p.x}
                        cy={p.y}
                        r={hoverIndex === idx ? 5 : 3}
                        fill="hsl(var(--primary))"
                        opacity={hoverIndex === idx ? 1 : 0.9}
                      />
                    ))}
                    {/* Gradient area */}
                    <polyline
                      fill="url(#grad)"
                      stroke="none"
                      points={`${padding},${graphHeight - padding} ${points} ${graphWidth - padding},${graphHeight - padding}`}
                      opacity="0.15"
                    />
                    {/* ADD: Hover guideline */}
                    {hoverIndex !== null && pointCoords[hoverIndex] && (
                      <g>
                        <line
                          x1={pointCoords[hoverIndex].x}
                          y1={padding}
                          x2={pointCoords[hoverIndex].x}
                          y2={graphHeight - padding}
                          stroke="hsl(var(--ring))"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                          opacity="0.8"
                        />
                      </g>
                    )}
                    <defs>
                      <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>

                  {/* ADD: Tooltip overlay */}
                  {hoverIndex !== null && graphData[hoverIndex] && pointCoords[hoverIndex] && (
                    <div
                      className="absolute -translate-x-1/2 pointer-events-none select-none"
                      style={{
                        left: pointCoords[hoverIndex].x,
                        top: Math.max(8, pointCoords[hoverIndex].y - 56),
                      }}
                    >
                      <div className="px-2 py-1 rounded-md text-xs bg-black/80 text-white shadow border border-white/10">
                        <div className="font-medium">
                          {period === "1y" ? graphData[hoverIndex].period : graphData[hoverIndex].period.split("-").reverse().join("-")}
                        </div>
                        <div>Revenue: {fmt.format(graphData[hoverIndex].revenue)}</div>
                        <div>Orders: {graphData[hoverIndex].orders}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Showing last {graphData.length} periods
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-sm font-medium">Revenue by Period</div>
              <div className="space-y-1">
                {revenueTrends.slice(-10).map((data, index) => (
                  <div key={data.period} className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground w-20 truncate">
                      {period === "1y" ? data.period : data.period.split('-')[2] || data.period}
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ 
                          width: `${maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0}%` 
                        }}
                      />
                    </div>
                    <div className="text-xs font-medium w-20 text-right">
                      {fmt.format(data.revenue)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity from Analytics */}
          <div className="pt-4 border-t">
            <div className="text-sm font-medium mb-2">Recent Activity (30 days)</div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-lg font-semibold">
                  {analytics.recentActivity.ordersLast30Days}
                </div>
                <div className="text-muted-foreground">Orders</div>
              </div>
              <div>
                <div className="text-lg font-semibold">
                  {fmt.format(analytics.recentActivity.revenueLast30Days)}
                </div>
                <div className="text-muted-foreground">Revenue</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}