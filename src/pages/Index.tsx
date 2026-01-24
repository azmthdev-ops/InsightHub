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
import { NoDatasetSelected } from "@/components/analytics/NoDatasetSelected";

const Index = () => {
  const [activeTab, setActiveTab] = useState("import");
  const [datasets, setDatasets] = useState<Dataset[]>(mockDatasets);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);

  const handleUpload = (file: File) => {
    const newDataset: Dataset = {
      id: String(Date.now()),
      name: file.name.replace(/\.(csv|xlsx?)/i, ""),
      rows: Math.floor(Math.random() * 10000) + 1000,
      columns: Math.floor(Math.random() * 20) + 5,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      uploadedAt: new Date().toISOString().split("T")[0],
      status: "ready",
    };
    setDatasets([newDataset, ...datasets]);
    setSelectedDataset(newDataset);
  };

  const handleSelectDataset = (dataset: Dataset) => {
    setSelectedDataset(dataset);
  };

  const requiresDataset = ["profile", "analyze", "visualize", "model", "reports", "insights"].includes(activeTab);

  const renderTab = () => {
    // Check if dataset is required but not selected
    if (requiresDataset && !selectedDataset) {
      return (
        <NoDatasetSelected 
          onGoToImport={() => setActiveTab("import")} 
        />
      );
    }

    switch (activeTab) {
      case "import":
        return (
          <ImportTab 
            datasets={datasets} 
            selectedDataset={selectedDataset}
            onUpload={handleUpload}
            onSelectDataset={handleSelectDataset}
          />
        );
      case "profile":
        return <ProfileTab dataset={selectedDataset!} />;
      case "analyze":
        return <AnalyzeTab dataset={selectedDataset!} />;
      case "visualize":
        return <VisualizeTab dataset={selectedDataset!} />;
      case "model":
        return <ModelTab dataset={selectedDataset!} />;
      case "reports":
        return <ReportsTab dataset={selectedDataset!} />;
      case "ba-studio":
        return <BAStudioTab />;
      case "insights":
        return <InsightsTab dataset={selectedDataset!} />;
      default:
        return (
          <ImportTab 
            datasets={datasets} 
            selectedDataset={selectedDataset}
            onUpload={handleUpload}
            onSelectDataset={handleSelectDataset}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-surface">
      <Header 
        activeTab={activeTab} 
        setActiveTab={setActiveTab}
        datasetCount={datasets.length}
        selectedDataset={selectedDataset}
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
