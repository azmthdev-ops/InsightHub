import { 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  FileText, 
  Briefcase, 
  Lightbulb
} from "lucide-react";

export interface TabItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const tabs: TabItem[] = [
  { id: "import", label: "Import", icon: Upload },
  { id: "profile", label: "Profile", icon: FileSpreadsheet },
  { id: "analyze", label: "Analyze", icon: TrendingUp },
  { id: "visualize", label: "Visualize", icon: BarChart3 },
  { id: "model", label: "Model", icon: Brain },
  { id: "reports", label: "Reports", icon: FileText },
  { id: "ba-studio", label: "BA Studio", icon: Briefcase },
  { id: "insights", label: "Insights", icon: Lightbulb },
];

export interface Dataset {
  id: string;
  name: string;
  rows: number;
  columns: number;
  size: string;
  uploadedAt: string;
  status: "ready" | "processing" | "error";
}

export const mockDatasets: Dataset[] = [
  { id: "1", name: "Sales Q4 2024", rows: 15420, columns: 12, size: "2.4 MB", uploadedAt: "2024-01-15", status: "ready" },
  { id: "2", name: "Customer Segments", rows: 8934, columns: 8, size: "1.1 MB", uploadedAt: "2024-01-14", status: "ready" },
  { id: "3", name: "Inventory Levels", rows: 3421, columns: 15, size: "890 KB", uploadedAt: "2024-01-13", status: "ready" },
];

// Dataset-specific data generators
export function getColumnProfilesForDataset(dataset: Dataset): ColumnProfile[] {
  const baseProfiles: Record<string, ColumnProfile[]> = {
    "Sales Q4 2024": [
      { name: "revenue", type: "number", mean: 45234, median: 42100, stdDev: 12450, missing: 0, unique: 15420 },
      { name: "customer_id", type: "string", missing: 12, unique: 8934 },
      { name: "product_category", type: "string", missing: 0, unique: 24 },
      { name: "quantity", type: "number", mean: 3.2, median: 3, stdDev: 1.8, missing: 5, unique: 87 },
      { name: "unit_price", type: "number", mean: 89.5, median: 75, stdDev: 45.2, missing: 0, unique: 156 },
      { name: "order_date", type: "date", missing: 0, unique: 365 },
    ],
    "Customer Segments": [
      { name: "customer_id", type: "string", missing: 0, unique: 8934 },
      { name: "segment", type: "string", missing: 0, unique: 5 },
      { name: "lifetime_value", type: "number", mean: 2450, median: 1800, stdDev: 1250, missing: 23, unique: 7521 },
      { name: "purchase_frequency", type: "number", mean: 4.2, median: 3, stdDev: 2.1, missing: 0, unique: 18 },
      { name: "last_purchase", type: "date", missing: 45, unique: 342 },
    ],
    "Inventory Levels": [
      { name: "product_id", type: "string", missing: 0, unique: 3421 },
      { name: "product_name", type: "string", missing: 0, unique: 3421 },
      { name: "category", type: "string", missing: 0, unique: 12 },
      { name: "stock_level", type: "number", mean: 156, median: 120, stdDev: 89, missing: 0, unique: 245 },
      { name: "reorder_point", type: "number", mean: 50, median: 45, stdDev: 22, missing: 3, unique: 67 },
      { name: "supplier", type: "string", missing: 8, unique: 89 },
    ],
  };
  
  return baseProfiles[dataset.name] || [
    { name: "column_1", type: "string", missing: 0, unique: dataset.rows },
    { name: "column_2", type: "number", mean: 100, median: 95, stdDev: 25, missing: 0, unique: Math.floor(dataset.rows * 0.8) },
    { name: "column_3", type: "date", missing: 0, unique: 365 },
  ];
}

export function getCorrelationsForDataset(dataset: Dataset): Correlation[] {
  const correlations: Record<string, Correlation[]> = {
    "Sales Q4 2024": [
      { pair: "revenue → quantity", value: 0.87 },
      { pair: "revenue → unit_price", value: 0.93 },
      { pair: "quantity → discount", value: -0.42 },
      { pair: "unit_price → margin", value: 0.78 },
    ],
    "Customer Segments": [
      { pair: "lifetime_value → purchase_frequency", value: 0.91 },
      { pair: "segment_score → retention", value: 0.84 },
      { pair: "recency → churn_risk", value: -0.76 },
      { pair: "frequency → satisfaction", value: 0.68 },
    ],
    "Inventory Levels": [
      { pair: "stock_level → sales_velocity", value: 0.72 },
      { pair: "reorder_point → stockouts", value: -0.88 },
      { pair: "lead_time → safety_stock", value: 0.79 },
      { pair: "demand_variability → buffer", value: 0.65 },
    ],
  };
  
  return correlations[dataset.name] || [
    { pair: "var_1 → var_2", value: 0.75 },
    { pair: "var_2 → var_3", value: -0.45 },
  ];
}

export function getKPIsForDataset(dataset: Dataset): KPIMetric[] {
  const kpis: Record<string, KPIMetric[]> = {
    "Sales Q4 2024": [
      { id: "revenue", label: "Revenue", value: "2.4M", change: 12.5, trend: "up", prefix: "$" },
      { id: "orders", label: "Orders", value: "15,420", change: 8.2, trend: "up" },
      { id: "avg_order", label: "Avg Order", value: "268", change: -3.1, trend: "down", prefix: "$" },
      { id: "conversion", label: "Conversion", value: "3.8%", change: 0.4, trend: "up" },
    ],
    "Customer Segments": [
      { id: "customers", label: "Total Customers", value: "8,934", change: 5.2, trend: "up" },
      { id: "high_value", label: "High Value", value: "2,155", change: 12.1, trend: "up" },
      { id: "at_risk", label: "At Risk", value: "1,847", change: -8.3, trend: "down" },
      { id: "ltv", label: "Avg LTV", value: "$2,450", change: 6.7, trend: "up" },
    ],
    "Inventory Levels": [
      { id: "products", label: "Products", value: "3,421", change: 2.1, trend: "up" },
      { id: "low_stock", label: "Low Stock", value: "156", change: -15.2, trend: "down" },
      { id: "turnover", label: "Turnover Rate", value: "4.2x", change: 8.5, trend: "up" },
      { id: "value", label: "Inventory Value", value: "$1.8M", change: 3.4, trend: "up" },
    ],
  };
  
  return kpis[dataset.name] || mockKPIs;
}

export function getAlertsForDataset(dataset: Dataset): Alert[] {
  const alerts: Record<string, Alert[]> = {
    "Sales Q4 2024": [
      { id: "1", type: "anomaly", title: "Anomaly Detected", description: "Revenue spike of +34% on Dec 12 (Black Friday sales)" },
      { id: "2", type: "trend", title: "Trend Alert", description: "Customer acquisition cost decreased 18% month-over-month" },
    ],
    "Customer Segments": [
      { id: "1", type: "insight", title: "Segment Shift", description: "15% of 'Growing' customers moved to 'High Value' tier" },
      { id: "2", type: "anomaly", title: "Churn Risk", description: "Unusual activity pattern detected in 'At Risk' segment" },
    ],
    "Inventory Levels": [
      { id: "1", type: "trend", title: "Stock Alert", description: "Electronics category approaching reorder point" },
      { id: "2", type: "anomaly", title: "Demand Spike", description: "Unusual demand increase for seasonal items detected" },
    ],
  };
  
  return alerts[dataset.name] || mockAlerts;
}

export function getRevenueDataForDataset(dataset: Dataset) {
  const data: Record<string, Array<{ month: string; revenue: number; target: number }>> = {
    "Sales Q4 2024": [
      { month: "Oct", revenue: 1800000, target: 1700000 },
      { month: "Nov", revenue: 2100000, target: 1900000 },
      { month: "Dec", revenue: 2850000, target: 2200000 },
      { month: "Jan", revenue: 2400000, target: 2400000 },
    ],
    "Customer Segments": [
      { month: "Oct", revenue: 890000, target: 850000 },
      { month: "Nov", revenue: 1020000, target: 920000 },
      { month: "Dec", revenue: 1180000, target: 1000000 },
      { month: "Jan", revenue: 1050000, target: 1100000 },
    ],
    "Inventory Levels": [
      { month: "Oct", revenue: 450000, target: 400000 },
      { month: "Nov", revenue: 520000, target: 480000 },
      { month: "Dec", revenue: 680000, target: 600000 },
      { month: "Jan", revenue: 490000, target: 550000 },
    ],
  };
  
  return data[dataset.name] || data["Sales Q4 2024"];
}

export interface ColumnProfile {
  name: string;
  type: "number" | "string" | "date" | "boolean";
  mean?: number;
  median?: number;
  stdDev?: number;
  missing: number;
  unique: number;
}

export const mockColumnProfiles: ColumnProfile[] = [
  { name: "revenue", type: "number", mean: 45234, median: 42100, stdDev: 12450, missing: 0, unique: 15420 },
  { name: "customer_id", type: "string", missing: 12, unique: 8934 },
  { name: "product_category", type: "string", missing: 0, unique: 24 },
  { name: "quantity", type: "number", mean: 3.2, median: 3, stdDev: 1.8, missing: 5, unique: 87 },
  { name: "unit_price", type: "number", mean: 89.5, median: 75, stdDev: 45.2, missing: 0, unique: 156 },
  { name: "order_date", type: "date", missing: 0, unique: 365 },
];

export interface Correlation {
  pair: string;
  value: number;
}

export const mockCorrelations: Correlation[] = [
  { pair: "revenue → quantity", value: 0.87 },
  { pair: "revenue → unit_price", value: 0.93 },
  { pair: "quantity → discount", value: -0.42 },
  { pair: "unit_price → margin", value: 0.78 },
];

export interface KPIMetric {
  id: string;
  label: string;
  value: string;
  change: number;
  trend: "up" | "down";
  prefix?: string;
}

export const mockKPIs: KPIMetric[] = [
  { id: "revenue", label: "Revenue", value: "2.4M", change: 12.5, trend: "up", prefix: "$" },
  { id: "customers", label: "Customers", value: "8,934", change: 8.2, trend: "up" },
  { id: "avg_order", label: "Avg Order", value: "268", change: -3.1, trend: "down", prefix: "$" },
  { id: "conversion", label: "Conversion", value: "3.8%", change: 0.4, trend: "up" },
];

export interface Alert {
  id: string;
  type: "anomaly" | "trend" | "insight";
  title: string;
  description: string;
}

export const mockAlerts: Alert[] = [
  { id: "1", type: "anomaly", title: "Anomaly Detected", description: "Revenue spike of +34% on Dec 12 (Black Friday sales)" },
  { id: "2", type: "trend", title: "Trend Alert", description: "Customer acquisition cost decreased 18% month-over-month" },
];

export interface MLModel {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  status: "trained" | "training" | "pending";
}

export const mockModels: MLModel[] = [
  { id: "1", name: "Linear Regression", type: "regression", accuracy: 94, status: "trained" },
  { id: "2", name: "Classification", type: "classification", accuracy: 89, status: "trained" },
  { id: "3", name: "Clustering", type: "clustering", accuracy: 87, status: "trained" },
];

export interface CustomerSegment {
  name: string;
  count: number;
  color: string;
}

export const mockSegments: CustomerSegment[] = [
  { name: "High Value", count: 2155, color: "hsl(199, 89%, 48%)" },
  { name: "Growing", count: 1518, color: "hsl(172, 66%, 50%)" },
  { name: "At Risk", count: 2076, color: "hsl(38, 92%, 50%)" },
  { name: "New", count: 722, color: "hsl(262, 83%, 58%)" },
  { name: "Dormant", count: 1847, color: "hsl(220, 13%, 46%)" },
];

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  category: string;
  confidence: number;
}

export const mockRecommendations: Recommendation[] = [
  { id: "1", title: "Optimize Inventory", description: "Reduce overstock in electronics category by 15% based on Q4 trends", priority: "high", category: "Inventory", confidence: 92 },
  { id: "2", title: "Dynamic Pricing", description: "Implement tiered pricing for premium segments to increase margins", priority: "high", category: "Pricing", confidence: 88 },
  { id: "3", title: "Customer Retention", description: "Launch re-engagement campaign for 'At Risk' segment", priority: "medium", category: "Marketing", confidence: 85 },
  { id: "4", title: "Supply Chain", description: "Consolidate suppliers in Asia region to reduce lead times", priority: "medium", category: "Operations", confidence: 79 },
];

export const chartTypes = [
  { value: "bar", label: "Bar Chart" },
  { value: "line", label: "Line Chart" },
  { value: "pie", label: "Pie Chart" },
  { value: "scatter", label: "Scatter Plot" },
  { value: "heatmap", label: "Heatmap" },
];

export const reportTemplates = [
  { value: "executive", label: "Executive Summary" },
  { value: "detailed", label: "Detailed Analysis" },
  { value: "custom", label: "Custom Report" },
];

export const documentTypes = [
  { value: "brd", label: "Business Requirements (BRD)" },
  { value: "frd", label: "Functional Requirements (FRD)" },
  { value: "gantt", label: "Gantt Chart" },
];
