import { motion } from "framer-motion";
import { Database, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface NoDatasetSelectedProps {
  onGoToImport: () => void;
}

export function NoDatasetSelected({ onGoToImport }: NoDatasetSelectedProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <div className="rounded-full bg-muted p-6 mb-6">
        <Database className="h-12 w-12 text-muted-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2">No Dataset Selected</h2>
      <p className="text-muted-foreground text-center max-w-md mb-6">
        Please select a dataset from the Import tab to view analysis, visualizations, and insights.
      </p>
      <Button onClick={onGoToImport} className="gap-2">
        Go to Import
        <ArrowRight className="h-4 w-4" />
      </Button>
    </motion.div>
  );
}
