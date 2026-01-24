import { motion } from "framer-motion";
import { Briefcase, FileCheck, Clock, Save, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { documentTypes } from "@/lib/analytics-data";
import { useState } from "react";
import { cn } from "@/lib/utils";

const ganttTasks = [
  { name: "Requirements", start: 0, duration: 2, color: "bg-primary" },
  { name: "Design", start: 2, duration: 3, color: "bg-chart-2" },
  { name: "Development", start: 4, duration: 5, color: "bg-chart-3" },
  { name: "Testing", start: 8, duration: 2, color: "bg-chart-4" },
  { name: "Deployment", start: 10, duration: 1, color: "bg-success" },
];

const brdContent = `## Business Requirements Document

### 1. Executive Summary
This document outlines the business requirements for the Analytics Hub platform, designed to provide SMEs with comprehensive data analysis capabilities.

### 2. Business Objectives
- Reduce data analysis time by 70%
- Enable self-service analytics for business users
- Consolidate multiple tools into single platform
- Provide AI-powered insights and recommendations

### 3. Scope
- Data import and profiling
- Interactive visualizations
- ML-powered predictions
- Automated report generation

### 4. Success Criteria
- User adoption rate > 80%
- Report generation time < 5 minutes
- Customer satisfaction score > 4.5/5`;

export function BAStudioTab() {
  const [docType, setDocType] = useState("brd");
  const [content, setContent] = useState(brdContent);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      {/* Document Type Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {documentTypes.map((doc, index) => (
          <motion.div
            key={doc.value}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card 
              className={cn(
                "cursor-pointer transition-all hover:shadow-lg",
                docType === doc.value && "ring-2 ring-primary"
              )}
              onClick={() => setDocType(doc.value)}
            >
              <CardContent className="flex items-center gap-4 p-6">
                <div className={cn(
                  "rounded-lg p-3",
                  docType === doc.value ? "bg-primary text-primary-foreground" : "bg-muted"
                )}>
                  {doc.value === "brd" && <FileCheck className="h-5 w-5" />}
                  {doc.value === "frd" && <Briefcase className="h-5 w-5" />}
                  {doc.value === "gantt" && <Clock className="h-5 w-5" />}
                </div>
                <div>
                  <h4 className="font-medium">{doc.label}</h4>
                  <p className="text-xs text-muted-foreground">
                    {doc.value === "brd" && "Business objectives & scope"}
                    {doc.value === "frd" && "Technical specifications"}
                    {doc.value === "gantt" && "Project timeline"}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Document Editor or Gantt Chart */}
      {docType === "gantt" ? (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Project Timeline - Gantt Chart
            </CardTitle>
            <CardDescription>Interactive project schedule visualization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {/* Timeline Header */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-28 shrink-0 font-medium">Task</div>
                <div className="flex-1">
                  <div className="flex justify-between px-2">
                    {Array.from({ length: 12 }, (_, i) => (
                      <span key={i}>W{i + 1}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Gantt Bars */}
              {ganttTasks.map((task, index) => (
                <motion.div
                  key={task.name}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <div className="w-28 shrink-0 text-sm font-medium">{task.name}</div>
                  <div className="flex-1 relative h-8 bg-muted/30 rounded">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(task.duration / 12) * 100}%` }}
                      transition={{ delay: index * 0.1 + 0.2, duration: 0.5 }}
                      className={cn(
                        "absolute h-full rounded shadow-sm",
                        task.color
                      )}
                      style={{ left: `${(task.start / 12) * 100}%` }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {docType === "brd" ? (
                <FileCheck className="h-5 w-5 text-primary" />
              ) : (
                <Briefcase className="h-5 w-5 text-primary" />
              )}
              {docType === "brd" ? "Business Requirements Document" : "Functional Requirements Document"}
            </CardTitle>
            <CardDescription>
              {docType === "brd" 
                ? "Define business objectives and success criteria"
                : "Specify functional and technical requirements"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
              placeholder="Start writing your document..."
            />
            <div className="flex gap-3">
              <Button className="gap-2">
                <Save className="h-4 w-4" />
                Save Draft
              </Button>
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
