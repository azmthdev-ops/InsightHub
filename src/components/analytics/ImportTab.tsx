import { motion } from "framer-motion";
import { Upload, FileSpreadsheet, Eye, Check, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dataset } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";
import { useState, useCallback } from "react";

interface ImportTabProps {
  datasets: Dataset[];
  onUpload: (file: File) => void;
}

export function ImportTab({ datasets, onUpload }: ImportTabProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      simulateUpload(file);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload(file);
    }
  }, []);

  const simulateUpload = (file: File) => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      onUpload(file);
    }, 1500);
  };

  const statusIcons = {
    ready: <Check className="h-4 w-4 text-success" />,
    processing: <Loader2 className="h-4 w-4 text-primary animate-spin" />,
    error: <AlertCircle className="h-4 w-4 text-destructive" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="grid gap-6 lg:grid-cols-2"
    >
      {/* Upload Section */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-primary" />
            Upload Dataset
          </CardTitle>
          <CardDescription>Import CSV or Excel files to begin analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 transition-all duration-300 cursor-pointer",
              isDragging 
                ? "border-primary bg-primary/5 scale-[1.02]" 
                : "border-border hover:border-primary/50 hover:bg-muted/30",
              isUploading && "pointer-events-none"
            )}
          >
            <input
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            
            {isUploading ? (
              <>
                <Loader2 className="h-12 w-12 text-primary animate-spin mb-4" />
                <p className="text-sm font-medium">Uploading...</p>
              </>
            ) : (
              <>
                <div className={cn(
                  "mb-4 rounded-full p-4 transition-colors",
                  isDragging ? "bg-primary/10" : "bg-muted"
                )}>
                  <Upload className={cn(
                    "h-8 w-8 transition-colors",
                    isDragging ? "text-primary" : "text-muted-foreground"
                  )} />
                </div>
                <p className="mb-1 text-sm font-medium">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  CSV, XLS, XLSX up to 50MB
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Available Datasets */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Available Datasets
          </CardTitle>
          <CardDescription>
            {datasets.length} datasets ready for analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {datasets.map((dataset, index) => (
            <motion.div
              key={dataset.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="group flex items-center justify-between rounded-lg border bg-card p-4 transition-all hover:shadow-md hover:border-primary/30"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{dataset.name}</h4>
                  {statusIcons[dataset.status]}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{dataset.rows.toLocaleString()} rows</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>{dataset.columns} cols</span>
                  <span className="h-1 w-1 rounded-full bg-muted-foreground/50" />
                  <span>{dataset.size}</span>
                </div>
              </div>
              <button className="rounded-lg p-2 text-muted-foreground opacity-0 transition-all group-hover:opacity-100 hover:bg-primary/10 hover:text-primary">
                <Eye className="h-4 w-4" />
              </button>
            </motion.div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
