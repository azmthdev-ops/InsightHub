import { motion } from "framer-motion";
import { Lightbulb, ArrowRight, CheckCircle, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { mockRecommendations } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";

const goalSeekScenarios = [
  { metric: "Target Revenue", current: "$2.4M", target: "$3.0M", change: "+25%", feasibility: 82 },
  { metric: "Customer Retention", current: "76%", target: "85%", change: "+9%", feasibility: 91 },
  { metric: "Margin Improvement", current: "18%", target: "22%", change: "+4%", feasibility: 74 },
];

export function InsightsTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Prescriptive Recommendations */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            AI-Powered Recommendations
          </CardTitle>
          <CardDescription>Actionable insights generated from your data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {mockRecommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-xl border bg-card p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-xs font-medium",
                        rec.priority === "high" && "bg-destructive/10 text-destructive",
                        rec.priority === "medium" && "bg-warning/10 text-warning",
                        rec.priority === "low" && "bg-muted text-muted-foreground"
                      )}>
                        {rec.priority}
                      </span>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {rec.category}
                      </span>
                    </div>
                    <h4 className="font-semibold">{rec.title}</h4>
                    <p className="mt-1 text-sm text-muted-foreground">{rec.description}</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{rec.confidence}%</div>
                    <div className="text-xs text-muted-foreground">confidence</div>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 gap-1 text-primary">
                  View Details <ArrowRight className="h-3 w-3" />
                </Button>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Goal Seek & Optimization */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Goal Seek Analysis
            </CardTitle>
            <CardDescription>What-if scenarios for your targets</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {goalSeekScenarios.map((scenario, index) => (
              <motion.div
                key={scenario.metric}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="rounded-lg border p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium">{scenario.metric}</h4>
                  <span className={cn(
                    "text-sm font-medium",
                    scenario.feasibility >= 80 ? "text-success" : 
                    scenario.feasibility >= 60 ? "text-warning" : "text-destructive"
                  )}>
                    {scenario.feasibility}% feasible
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Current:</span>
                    <span className="ml-1 font-medium">{scenario.current}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-muted-foreground">Target:</span>
                    <span className="ml-1 font-medium text-primary">{scenario.target}</span>
                  </div>
                  <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-medium text-success">
                    {scenario.change}
                  </span>
                </div>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
            <CardDescription>Prioritized action items</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { step: 1, title: "Optimize Inventory Levels", status: "ready", impact: "High" },
                { step: 2, title: "Launch Retention Campaign", status: "ready", impact: "High" },
                { step: 3, title: "Implement Dynamic Pricing", status: "pending", impact: "Medium" },
                { step: 4, title: "Supplier Consolidation", status: "pending", impact: "Medium" },
              ].map((item, index) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-4"
                >
                  <div className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    item.status === "ready" 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {item.status === "ready" ? <CheckCircle className="h-4 w-4" /> : item.step}
                  </div>
                  <div className="flex-1">
                    <p className={cn(
                      "font-medium",
                      item.status === "pending" && "text-muted-foreground"
                    )}>
                      {item.title}
                    </p>
                  </div>
                  <span className={cn(
                    "text-xs font-medium",
                    item.impact === "High" ? "text-destructive" : "text-warning"
                  )}>
                    {item.impact} Impact
                  </span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
