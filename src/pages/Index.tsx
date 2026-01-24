import { useState } from "react";
import { Header } from "@/components/analytics/Header";
import { ImportTab } from "@/components/analytics/ImportTab";
import { ProfileTab } from "@/components/analytics/ProfileTab";
import { AnalyzeTab } from "@/components/analytics/AnalyzeTab";
import { VisualizeTab } from "@/components/analytics/VisualizeTab";
import { ModelTab } from "@/components/analytics/ModelTab";
import { ReportsTab } from "@/components/analytics/ReportsTab";
import { BAStudioTab } from "@/components/analytics/BAStudioTab";
import { InsightsTab } from "@/components/analytics/InsightsTab";
import { mockDatasets, Dataset } from "@/lib/analytics-data";
import { AnimatePresence } from "framer-motion";

const Index = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);

  const handleUpload = (file: File) => {
    const newDataset: Dataset = {
      id: String(datasets.length + 1),
      name: file.name.replace(/\.(csv|xlsx?)/i, ""),
      rows: Math.floor(Math.random() * 10000) + 1000,
      columns: Math.floor(Math.random() * 20) + 5,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "ready",
    };
    setDatasets([newDataset, ...datasets]);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "import":
        return <ImportTab datasets={datasets} onUpload={handleUpload} />;
      case "profile":
        return <ProfileTab />;
      case "analyze":
        return <AnalyzeTab />;
      case "visualize":
        return <VisualizeTab />;
      case "model":
        return <ModelTab />;
      case "reports":
        return <ReportsTab />;
      case "ba-studio":
        return <BAStudioTab />;
      case "insights":
        return <InsightsTab />;
      default:
        return <ImportTab datasets={datasets} onUpload={handleUpload} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        datasetCount={datasets.length}
      />
      
      <main className="container mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {renderTab()}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
