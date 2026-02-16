import { motion } from "framer-motion";
import { Brain, Target, Users, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Dataset, mockModels, mockSegments } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";
import { useMemo } from "react";

interface ModelTabProps {
  dataset: Dataset;
}

export function ModelTab({ dataset }: ModelTabProps) {
  const { forecastData, predictions } = useMemo(() => {
    const forecasts: Record<string, Array<{ scenario: string; value: string; percentage: number }>> = {
      "Sales Q4 2024": [
        { scenario: "Optimistic", value: "$2.8M", percentage: 100 },
        { scenario: "Expected", value: "$2.5M", percentage: 89 },
        { scenario: "Conservative", value: "$2.2M", percentage: 78 },
      ],
      "Customer Segments": [
        { scenario: "High Growth", value: "12,500", percentage: 100 },
        { scenario: "Expected", value: "10,200", percentage: 82 },
        { scenario: "Conservative", value: "9,100", percentage: 73 },
      ],
      "Inventory Levels": [
        { scenario: "Optimistic", value: "$2.1M", percentage: 100 },
        { scenario: "Expected", value: "$1.8M", percentage: 86 },
        { scenario: "Conservative", value: "$1.5M", percentage: 71 },
      ],
    };

    const preds: Record<string, Array<{ id: string; customer: string; churn: number; action: string }>> = {
      "Sales Q4 2024": [
        { id: "1", customer: "Customer #4521", churn: 23, action: "Retention offer recommended" },
        { id: "2", customer: "Customer #7832", churn: 67, action: "High risk - immediate action" },
        { id: "3", customer: "Customer #2156", churn: 12, action: "Low risk - monitor" },
      ],
      "Customer Segments": [
        { id: "1", customer: "Segment: At Risk", churn: 45, action: "Launch win-back campaign" },
        { id: "2", customer: "Segment: Dormant", churn: 78, action: "Reactivation offers needed" },
        { id: "3", customer: "Segment: Growing", churn: 15, action: "Upsell opportunities" },
      ],
      "Inventory Levels": [
        { id: "1", customer: "SKU #E-1024", churn: 85, action: "Stockout risk - reorder now" },
        { id: "2", customer: "SKU #C-5892", churn: 32, action: "Monitor lead times" },
        { id: "3", customer: "SKU #H-3421", churn: 8, action: "Stock levels healthy" },
      ],
    };

    return {
      forecastData: forecasts[dataset.name] || forecasts["Sales Q4 2024"],
      predictions: preds[dataset.name] || preds["Sales Q4 2024"],
    };
  }, [dataset.name]);

  return (
    <motion.div
      key={dataset.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* ML Models Grid */}
      <div className="grid gap-4 sm:grid-cols-3">
        {mockModels.map((model, index) => (
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="stat-card shadow-card">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Brain className="h-5 w-5 text-primary" />
                  </div>
                  <span className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    model.status === "trained" && "bg-success/10 text-success",
                    model.status === "training" && "bg-warning/10 text-warning",
                    model.status === "pending" && "bg-muted text-muted-foreground"
                  )}>
                    {model.status}
                  </span>
                </div>
                <h4 className="mt-4 font-semibold">{model.name}</h4>
                <p className="mt-1 text-sm text-muted-foreground capitalize">{model.type}</p>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Accuracy</span>
                    <span className="font-medium">{model.accuracy}%</span>
                  </div>
                  <Progress value={model.accuracy} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Forecast */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Forecast Analysis
            </CardTitle>
            <CardDescription>Predictions based on {dataset.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {forecastData.map((item, index) => (
              <motion.div
                key={item.scenario}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between rounded-lg border bg-muted/20 p-4"
              >
                <div>
                  <p className="font-medium">{item.scenario}</p>
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                </div>
                <div className="h-16 w-16">
                  <svg viewBox="0 0 36 36" className="h-full w-full">
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="3"
                    />
                    <path
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                      fill="none"
                      stroke="hsl(199, 89%, 48%)"
                      strokeWidth="3"
                      strokeDasharray={`${item.percentage}, 100`}
                    />
                  </svg>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Customer Segmentation */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Segmentation Analysis
            </CardTitle>
            <CardDescription>K-means clustering on {dataset.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockSegments.map((segment, index) => (
              <motion.div
                key={segment.name}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.08 }}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="h-3 w-3 rounded-full" 
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="font-medium">{segment.name}</span>
                </div>
                <span className="font-mono text-sm text-muted-foreground">
                  {segment.count.toLocaleString()}
                </span>
              </motion.div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Predictions */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Predictive Analysis</CardTitle>
          <CardDescription>AI-powered predictions for {dataset.name}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Recommended Action</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((pred, index) => (
                  <motion.tr
                    key={pred.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <td className="font-medium">{pred.customer}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-16 overflow-hidden rounded-full bg-muted">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              pred.churn < 30 && "bg-success",
                              pred.churn >= 30 && pred.churn < 60 && "bg-warning",
                              pred.churn >= 60 && "bg-destructive"
                            )}
                            style={{ width: `${pred.churn}%` }}
                          />
                        </div>
                        <span className="font-mono text-sm">{pred.churn}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium",
                        pred.churn < 30 && "bg-success/10 text-success",
                        pred.churn >= 30 && pred.churn < 60 && "bg-warning/10 text-warning",
                        pred.churn >= 60 && "bg-destructive/10 text-destructive"
                      )}>
                        {pred.churn < 30 ? "Low" : pred.churn < 60 ? "Medium" : "High"}
                      </span>
                    </td>
                    <td className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      {pred.action}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
