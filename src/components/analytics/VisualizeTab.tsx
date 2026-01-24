import { motion } from "framer-motion";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { chartTypes, Dataset, getColumnProfilesForDataset } from "@/lib/analytics-data";
import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ScatterChart, Scatter } from "recharts";

interface VisualizeTabProps {
  dataset: Dataset;
}

const COLORS = ["hsl(199, 89%, 48%)", "hsl(172, 66%, 50%)", "hsl(262, 83%, 58%)", "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)"];

export function VisualizeTab({ dataset }: VisualizeTabProps) {
  const [chartType, setChartType] = useState("bar");
  const columns = getColumnProfilesForDataset(dataset);
  
  const numericColumns = columns.filter(c => c.type === "number");
  const categoryColumns = columns.filter(c => c.type === "string");
  
  const [xAxis, setXAxis] = useState(categoryColumns[0]?.name || "category");
  const [yAxis, setYAxis] = useState(numericColumns[0]?.name || "value");

  // Generate dataset-specific chart data
  const chartData = useMemo(() => {
    const dataMap: Record<string, Record<string, any[]>> = {
      "Sales Q4 2024": {
        bar: [
          { category: "Electronics", revenue: 450000, quantity: 1200 },
          { category: "Clothing", revenue: 320000, quantity: 890 },
          { category: "Home & Garden", revenue: 280000, quantity: 650 },
          { category: "Sports", revenue: 190000, quantity: 420 },
          { category: "Books", revenue: 150000, quantity: 780 },
        ],
        line: [
          { date: "Week 1", sales: 12000, profit: 3200 },
          { date: "Week 2", sales: 15000, profit: 4100 },
          { date: "Week 3", sales: 13500, profit: 3600 },
          { date: "Week 4", sales: 18000, profit: 5200 },
        ],
        pie: [
          { name: "Electronics", value: 450000 },
          { name: "Clothing", value: 320000 },
          { name: "Home & Garden", value: 280000 },
          { name: "Sports", value: 190000 },
          { name: "Books", value: 150000 },
        ],
        scatter: [
          { x: 100, y: 200 }, { x: 120, y: 100 }, { x: 170, y: 300 },
          { x: 140, y: 250 }, { x: 150, y: 400 }, { x: 110, y: 280 },
        ],
      },
      "Customer Segments": {
        bar: [
          { category: "High Value", lifetime_value: 4500, count: 2155 },
          { category: "Growing", lifetime_value: 2800, count: 1518 },
          { category: "At Risk", lifetime_value: 1200, count: 2076 },
          { category: "New", lifetime_value: 800, count: 722 },
          { category: "Dormant", lifetime_value: 400, count: 1847 },
        ],
        line: [
          { date: "Q1", retention: 92, acquisition: 450 },
          { date: "Q2", retention: 88, acquisition: 520 },
          { date: "Q3", retention: 91, acquisition: 480 },
          { date: "Q4", retention: 94, acquisition: 610 },
        ],
        pie: [
          { name: "High Value", value: 2155 },
          { name: "Growing", value: 1518 },
          { name: "At Risk", value: 2076 },
          { name: "New", value: 722 },
          { name: "Dormant", value: 1847 },
        ],
        scatter: [
          { x: 4500, y: 12 }, { x: 2800, y: 8 }, { x: 1200, y: 4 },
          { x: 3200, y: 10 }, { x: 1800, y: 6 }, { x: 4000, y: 11 },
        ],
      },
      "Inventory Levels": {
        bar: [
          { category: "Electronics", stock_level: 1850, reorder_point: 500 },
          { category: "Clothing", stock_level: 2400, reorder_point: 600 },
          { category: "Home", stock_level: 1200, reorder_point: 300 },
          { category: "Sports", stock_level: 890, reorder_point: 200 },
          { category: "Books", stock_level: 3200, reorder_point: 800 },
        ],
        line: [
          { date: "Week 1", inbound: 500, outbound: 420 },
          { date: "Week 2", inbound: 650, outbound: 580 },
          { date: "Week 3", inbound: 480, outbound: 510 },
          { date: "Week 4", inbound: 720, outbound: 640 },
        ],
        pie: [
          { name: "Electronics", value: 1850 },
          { name: "Clothing", value: 2400 },
          { name: "Home", value: 1200 },
          { name: "Sports", value: 890 },
          { name: "Books", value: 3200 },
        ],
        scatter: [
          { x: 1850, y: 4.2 }, { x: 2400, y: 3.8 }, { x: 1200, y: 5.1 },
          { x: 890, y: 6.2 }, { x: 3200, y: 2.9 },
        ],
      },
    };
    
    return dataMap[dataset.name] || dataMap["Sales Q4 2024"];
  }, [dataset.name]);

  const renderChart = () => {
    const data = chartData as any;
    
    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.bar}>
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
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(0)}K` : value}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value.toLocaleString(), ""]}
              />
              <Bar 
                dataKey={Object.keys(data.bar[0]).find(k => k !== "category") || "value"} 
                fill="hsl(199, 89%, 48%)" 
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.line}>
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
              {Object.keys(data.line[0]).filter(k => k !== "date").map((key, i) => (
                <Line 
                  key={key}
                  type="monotone" 
                  dataKey={key} 
                  stroke={COLORS[i % COLORS.length]} 
                  strokeWidth={3}
                  dot={{ fill: COLORS[i % COLORS.length] }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.pie}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {data.pie.map((_: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => [value.toLocaleString(), ""]}
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
                name="X" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                type="number" 
                dataKey="y" 
                name="Y" 
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
                name="Data Points" 
                data={data.scatter} 
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
      key={dataset.id}
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
          <CardDescription>Visualize {dataset.name}</CardDescription>
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
                {columns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
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
                {numericColumns.map((col) => (
                  <SelectItem key={col.name} value={col.name}>
                    {col.name}
                  </SelectItem>
                ))}
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
          <CardDescription>Data from {dataset.name}</CardDescription>
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
