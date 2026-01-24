import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, AlertTriangle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { mockKPIs, mockAlerts } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const revenueData = [
  { month: "Oct", revenue: 1800000, target: 1700000 },
  { month: "Nov", revenue: 2100000, target: 1900000 },
  { month: "Dec", revenue: 2850000, target: 2200000 },
  { month: "Jan", revenue: 2400000, target: 2400000 },
];

export function AnalyzeTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {mockKPIs.map((kpi, index) => (
          <motion.div
            key={kpi.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="stat-card shadow-card overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{kpi.label}</p>
                    <p className="mt-2 text-3xl font-bold">
                      {kpi.prefix}{kpi.value}
                    </p>
                  </div>
                  <div className={cn(
                    "flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    kpi.trend === "up" 
                      ? "bg-success/10 text-success" 
                      : "bg-destructive/10 text-destructive"
                  )}>
                    {kpi.trend === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {kpi.change > 0 ? "+" : ""}{kpi.change}%
                  </div>
                </div>
              </CardContent>
              <div className={cn(
                "h-1 w-full",
                kpi.trend === "up" ? "bg-success" : "bg-destructive"
              )} />
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Revenue Chart */}
        <Card className="shadow-card lg:col-span-2">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Q4 2024 performance vs target</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(199, 89%, 48%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${(value / 1000000).toFixed(2)}M`, ""]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="hsl(199, 89%, 48%)"
                    strokeWidth={3}
                    fill="url(#revenueGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="target"
                    stroke="hsl(var(--muted-foreground))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Smart Alerts
            </CardTitle>
            <CardDescription>AI-detected patterns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {mockAlerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={cn(
                  "rounded-lg border p-4",
                  alert.type === "anomaly" && "border-warning/30 bg-warning/5",
                  alert.type === "trend" && "border-success/30 bg-success/5",
                  alert.type === "insight" && "border-primary/30 bg-primary/5"
                )}
              >
                <div className="flex items-start gap-3">
                  <AlertTriangle className={cn(
                    "mt-0.5 h-5 w-5",
                    alert.type === "anomaly" && "text-warning",
                    alert.type === "trend" && "text-success",
                    alert.type === "insight" && "text-primary"
                  )} />
                  <div>
                    <p className="font-medium text-sm">{alert.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{alert.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
