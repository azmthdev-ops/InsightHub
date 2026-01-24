import { motion } from "framer-motion";
import { FileText, Download, Eye, Check } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { reportTemplates, Dataset } from "@/lib/analytics-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ReportsTabProps {
  dataset: Dataset;
}

const reportSections = [
  { id: "metrics", label: "Key Metrics", checked: true },
  { id: "trends", label: "Trend Charts", checked: true },
  { id: "statistics", label: "Statistical Summary", checked: true },
  { id: "recommendations", label: "Recommendations", checked: false },
];

export function ReportsTab({ dataset }: ReportsTabProps) {
  const [template, setTemplate] = useState("executive");
  const [title, setTitle] = useState(`${dataset.name} - Analysis Report`);
  const [sections, setSections] = useState(reportSections);

  const toggleSection = (id: string) => {
    setSections(sections.map(s => 
      s.id === id ? { ...s, checked: !s.checked } : s
    ));
  };

  return (
    <motion.div
      key={dataset.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-2"
    >
      {/* Report Builder */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Report Generator
          </CardTitle>
          <CardDescription>Create professional reports from {dataset.name}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Title</label>
            <Input 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter report title..."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={template} onValueChange={setTemplate}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {reportTemplates.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium">Include Sections</label>
            {sections.map((section) => (
              <div 
                key={section.id}
                className="flex items-center gap-3"
              >
                <Checkbox 
                  id={section.id}
                  checked={section.checked}
                  onCheckedChange={() => toggleSection(section.id)}
                />
                <label 
                  htmlFor={section.id}
                  className="text-sm cursor-pointer"
                >
                  {section.label}
                </label>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <Button className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Export as PDF
            </Button>
            <Button variant="outline" className="flex-1 gap-2">
              <Download className="h-4 w-4" />
              Export as Word
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Report Preview */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Report Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border bg-muted/30 p-6">
            {/* Mock Report Preview */}
            <div className="space-y-4">
              <div className="border-b pb-4">
                <h3 className="text-lg font-bold">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  Generated on {new Date().toLocaleDateString()} • Source: {dataset.name}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {dataset.rows.toLocaleString()} rows × {dataset.columns} columns
                </p>
              </div>

              {sections.filter(s => s.checked).map((section, index) => (
                <motion.div
                  key={section.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <h4 className="font-medium text-sm">{section.label}</h4>
                  </div>
                  <div className={cn(
                    "h-16 rounded-md animate-shimmer",
                    section.id === "metrics" && "bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5",
                    section.id === "trends" && "bg-gradient-to-r from-chart-2/5 via-chart-2/10 to-chart-2/5",
                    section.id === "statistics" && "bg-gradient-to-r from-chart-3/5 via-chart-3/10 to-chart-3/5",
                    section.id === "recommendations" && "bg-gradient-to-r from-chart-4/5 via-chart-4/10 to-chart-4/5"
                  )} />
                </motion.div>
              ))}

              {sections.filter(s => s.checked).length === 0 && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  Select sections to include in your report
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
