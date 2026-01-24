import { motion } from "framer-motion";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { chartTypes } from "@/lib/analytics-data";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from "recharts";

const barData = [
  { category: "Electronics", revenue: 450000 },
  { category: "Clothing", revenue: 320000 },
  { category: "Home & Garden", revenue: 280000 },
  { category: "Sports", revenue: 190000 },
  { category: "Books", revenue: 150000 },
];

const pieData = [
  { name: "Electronics", value: 450000 },
  { name: "Clothing", value: 320000 },
  { name: "Home & Garden", value: 280000 },
  { name: "Sports", value: 190000 },
  { name: "Books", value: 150000 },
];

const lineData = [
  { date: "Week 1", sales: 12000, profit: 3200 },
  { date: "Week 2", sales: 15000, profit: 4100 },
  { date: "Week 3", sales: 13500, profit: 3600 },
  { date: "Week 4", sales: 18000, profit: 5200 },
];

const scatterData = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];

const COLORS = ["hsl(199, 89%, 48%)", "hsl(172, 66%, 50%)", "hsl(262, 83%, 58%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export function VisualizeTab() {
  const [chartType, setChartType] = useState("bar");
  const [xAxis, setXAxis] = useState("category");
  const [yAxis, setYAxis] = useState("revenue");

  const renderChart = () => {
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="category" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
              <Bar 
                dataKey="revenue" 
                fill="hsl(199, 89%, 48%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={lineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12}
                tickLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="hsl(199, 89%, 48%)" 
                strokeWidth={3}
                dot={{ fill: "hsl(199, 89%, 48%)" }}
              />
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="hsl(172, 66%, 50%)" 
                strokeWidth={3}
                dot={{ fill: "hsl(172, 66%, 50%)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                dataKey="x" 
                name="Price" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Sales" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
              />
              <Scatter 
                name="Products" 
                data={scatterData} 
                fill="hsl(199, 89%, 48%)"
              />
            </ScatterChart>
          </ResponsiveContainer>
        );
      default:
        return (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Select a chart type to visualize
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-4"
    >
      {/* Chart Builder Controls */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Chart Builder
          </CardTitle>
          <CardDescription>Create interactive visualizations</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Chart Type</label>
            <Select value={chartType} onValueChange={setChartType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {chartTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">X-Axis</label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="category">Category</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="region">Region</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Y-Axis</label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="revenue">Revenue</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="profit">Profit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full gap-2">
            <Download className="h-4 w-4" />
            Export Chart
          </Button>
        </CardContent>
      </Card>

      {/* Chart Display */}
      <Card className="shadow-card lg:col-span-3">
        <CardHeader>
          <CardTitle>
            {chartTypes.find(t => t.value === chartType)?.label || "Chart"} Preview
          </CardTitle>
          <CardDescription>Revenue by Category - Q4 2024</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            {renderChart()}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
