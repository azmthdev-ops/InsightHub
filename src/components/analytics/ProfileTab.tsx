import { motion } from "framer-motion";
import { FileSpreadsheet, CheckCircle, AlertTriangle, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dataset, getColumnProfilesForDataset, getCorrelationsForDataset } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";

interface ProfileTabProps {
  dataset: Dataset;
}

export function ProfileTab({ dataset }: ProfileTabProps) {
  const columnProfiles = getColumnProfilesForDataset(dataset);
  const correlations = getCorrelationsForDataset(dataset);

  const getQualityIndicator = (missing: number) => {
    if (missing === 0) return { icon: CheckCircle, class: "text-success", label: "Good" };
    if (missing < 10) return { icon: AlertTriangle, class: "text-warning", label: "Warning" };
    return { icon: XCircle, class: "text-destructive", label: "Issues" };
  };

  return (
    <motion.div
      key={dataset.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-3"
    >
      {/* Statistical Summary Table */}
      <Card className="shadow-card lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Data Quality & Statistics
          </CardTitle>
          <CardDescription>
            Analyzing <span className="font-medium text-foreground">{dataset.name}</span> • {dataset.rows.toLocaleString()} rows × {dataset.columns} columns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Column</th>
                  <th>Type</th>
                  <th>Mean</th>
                  <th>Median</th>
                  <th>Std Dev</th>
                  <th>Missing</th>
                  <th>Unique</th>
                  <th>Quality</th>
                </tr>
              </thead>
              <tbody>
                {columnProfiles.map((col, index) => {
                  const quality = getQualityIndicator(col.missing);
                  const QualityIcon = quality.icon;
                  
                  return (
                    <motion.tr
                      key={col.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="font-medium font-mono text-sm">{col.name}</td>
                      <td>
                        <span className={cn(
                          "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
                          col.type === "number" && "bg-primary/10 text-primary",
                          col.type === "string" && "bg-chart-3/10 text-chart-3",
                          col.type === "date" && "bg-chart-2/10 text-chart-2",
                        )}>
                          {col.type}
                        </span>
                      </td>
                      <td className="font-mono text-sm">{col.mean?.toLocaleString() ?? "—"}</td>
                      <td className="font-mono text-sm">{col.median?.toLocaleString() ?? "—"}</td>
                      <td className="font-mono text-sm">{col.stdDev?.toLocaleString() ?? "—"}</td>
                      <td className={cn(
                        "font-mono text-sm",
                        col.missing > 0 && "text-warning font-medium"
                      )}>
                        {col.missing}
                      </td>
                      <td className="font-mono text-sm">{col.unique.toLocaleString()}</td>
                      <td>
                        <QualityIcon className={cn("h-4 w-4", quality.class)} />
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Correlation Matrix */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Correlation Matrix</CardTitle>
          <CardDescription>Key variable relationships</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {correlations.map((corr, index) => (
            <motion.div
              key={corr.pair}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-mono text-xs text-muted-foreground">{corr.pair}</span>
                <span className={cn(
                  "font-medium",
                  corr.value > 0 ? "text-success" : "text-warning"
                )}>
                  {corr.value > 0 ? "+" : ""}{corr.value.toFixed(2)}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.abs(corr.value) * 100}%` }}
                  transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                  className={cn(
                    "correlation-bar",
                    corr.value > 0 ? "correlation-positive" : "correlation-negative"
                  )}
                />
              </div>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
