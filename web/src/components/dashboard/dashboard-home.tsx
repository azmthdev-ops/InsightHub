"use client"

import { useEffect, useState } from "react"
import { useDataset } from "@/providers/dataset-provider"
import { API_URL } from "@/lib/api"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Database, TrendingUp, Zap, Activity, Upload,
    Search, Filter, Shield, Bell, ArrowUpRight,
    Cpu, Globe, Cloud, Sparkles, MessageSquare,
    MousePointer2, ChevronDown
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { StatsCards } from "./stats-cards"
import { ActivityLog } from "./activity-log"
import { SystemHealth } from "./system-health"
import { AnalyticsChart } from "./analytics-chart"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

export function DashboardHome() {
    const { activeDatasetId } = useDataset()
    const [chartData, setChartData] = useState<any[]>([])
    const [numericCols, setNumericCols] = useState<string[]>([])
    const [selectedY, setSelectedY] = useState<string>("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!activeDatasetId) {
            setChartData([])
            setNumericCols([])
            setSelectedY("")
            return
        }

        const fetchSummary = async () => {
            setLoading(true)
            try {
                const response = await fetch(`${API_URL}/data/summary/${activeDatasetId}`)
                if (response.ok) {
                    const data = await response.json()
                    setChartData(data.chart_data)
                    setNumericCols(data.numeric_columns)
                    if (data.numeric_columns.length > 0) {
                        setSelectedY(data.numeric_columns[0])
                    }
                }
            } catch (error) {
                console.error("Failed to load dashboard summary:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchSummary()
    }, [activeDatasetId, API_URL])

    const quickActions = [
        { label: "Upload New", icon: Upload, desc: "Ingest CSV/JSON", href: "/dashboard/data", color: "text-blue-400" },
        { label: "Ask AI", icon: MessageSquare, desc: "Neural Query", href: "/dashboard/chat", color: "text-emerald-400" },
        { label: "Train Model", icon: Zap, desc: "Start Deep Learning", href: "/dashboard/ml-studio", color: "text-amber-400" },
    ]

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#e8e8e8] overflow-auto p-8 lg:p-12 space-y-12">
            <SystemHealth />

            {/* Header Section */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-6"
            >
                <div>
                    <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
                        Mission Control
                        <Sparkles className="h-6 w-6 text-blue-500 animate-pulse" />
                    </h1>
                    <p className="text-gray-600 mt-2 font-medium">Neural diagnostic and data lifecycle management console.</p>
                </div>
                <div className="flex items-center gap-4">
                    <Button variant="outline" className="bg-white border-gray-200 text-gray-700 hover:text-gray-900 rounded-xl px-6 h-12">
                        <Bell className="h-4 w-4 mr-2" />
                        Incidents
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-6 h-12 font-bold shadow-lg">
                        Generate Report
                    </Button>
                </div>
            </motion.header>

            {/* Stats Grid */}
            <StatsCards />

            {/* Quick Actions Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickActions.map((action, i) => (
                    <motion.button
                        key={action.label}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => window.location.href = action.href}
                        className="flex items-center gap-4 p-6 rounded-2xl bg-white border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all text-left"
                    >
                        <div className={`p-3 rounded-xl bg-gray-50 ${action.color}`}>
                            <action.icon className="h-5 w-5" />
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">{action.label}</h4>
                            <p className="text-[10px] text-gray-500 mt-0.5">{action.desc}</p>
                        </div>
                        <MousePointer2 className="h-4 w-4 ml-auto text-gray-300" />
                    </motion.button>
                ))}
            </div>

            {/* Main Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Data Insights Chart */}
                <Card className="lg:col-span-3 bg-white border-gray-200 rounded-2xl overflow-hidden flex flex-col shadow-sm">
                    <CardHeader className="p-6 border-b border-gray-200 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-gray-900 font-bold">Neural Pattern Analysis</CardTitle>
                                <CardDescription className="text-gray-500 text-xs mt-1">Direct inference from active data stream.</CardDescription>
                            </div>

                            {numericCols.length > 1 && (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="outline" size="sm" className="bg-white/5 border-white/10 text-[10px] font-bold uppercase tracking-widest">
                                            Dimension: {selectedY}
                                            <ChevronDown className="h-3 w-3 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="bg-zinc-900 border-white/10">
                                        {numericCols.map(col => (
                                            <DropdownMenuItem
                                                key={col}
                                                onClick={() => setSelectedY(col)}
                                                className="text-xs text-zinc-400 hover:text-white"
                                            >
                                                {col}
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <AnalyticsChart data={chartData} loading={loading} yKey={selectedY} />
                    </CardContent>
                </Card>

                {/* Recent Activity Mini table */}
                <div className="lg:col-span-2">
                    <ActivityLog />
                </div>
            </div>
        </div>
    )
}
