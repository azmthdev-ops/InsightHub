import { motion } from "framer-motion";
import { Database, Settings } from "lucide-react";
import { tabs, Dataset } from "@/lib/analytics-data";
import { cn } from "@/lib/utils";

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  datasetCount: number;
  selectedDataset: Dataset | null;
}

export function Header({ activeTab, setActiveTab, datasetCount, selectedDataset }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-gradient-hero">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary shadow-glow">
              <svg className="h-6 w-6 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="M18 9l-5 5-4-4-3 3" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-foreground">Analytics Hub</h1>
              <p className="text-xs text-primary-foreground/70">Enterprise Business Intelligence Platform</p>
            </div>
          </div>

          {/* Dataset Counter & Selected Dataset */}
          <div className="flex items-center gap-4">
            {selectedDataset && (
              <div className="flex items-center gap-2 rounded-full bg-primary/20 px-4 py-2 text-sm text-primary-foreground border border-primary/30">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
                <span className="font-medium">{selectedDataset.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-primary-foreground">
              <Database className="h-4 w-4" />
              <span>{datasetCount} Datasets</span>
            </div>
            <button className="rounded-lg p-2 text-primary-foreground/70 hover:bg-white/10 hover:text-primary-foreground transition-colors">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="container mx-auto px-6 pb-4">
        <div className="flex items-center gap-1 rounded-xl bg-white/10 p-1.5 backdrop-blur-sm">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive 
                    ? "text-accent" 
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-lg bg-white shadow-md"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <Icon className={cn("relative z-10 h-4 w-4", isActive && "text-primary")} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
