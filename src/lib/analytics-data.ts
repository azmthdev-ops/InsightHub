import { 
  Upload, 
  FileSpreadsheet, 
  TrendingUp, 
  BarChart3, 
  Brain, 
  FileText, 
  Briefcase, 
  Lightbulb,
  Database,
  Settings,
  ChevronRight
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
