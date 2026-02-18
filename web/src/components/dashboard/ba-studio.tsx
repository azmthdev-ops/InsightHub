"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Activity, ArrowRight, Brain, Database } from "lucide-react"
import { ReportGenerator } from "@/components/dashboard/report-generator"
// Re-using the same Plot component for consistency
import Plot from "@/components/ui/plot"

import { useDataset } from "@/providers/dataset-provider"

// Mock Data for initial visualization - To be replaced with real data fetch
const KPIData = [
    { title: "Total Revenue", value: "$45,231.89", change: "+20.1%", trend: "up", icon: DollarSign },
    { title: "Active Users", value: "+2350", change: "+180.1%", trend: "up", icon: Users },
    { title: "Sales", value: "+12,234", change: "+19.2%", trend: "up", icon: ShoppingCart },
    { title: "Bounce Rate", value: "2.4%", change: "-4.1%", trend: "down", icon: Activity },
]

const recentSales = [
    { name: "Olivia Martin", email: "olivia.martin@email.com", amount: "+$1,999.00" },
    { name: "Jackson Lee", email: "jackson.lee@email.com", amount: "+$39.00" },
    { name: "Isabella Nguyen", email: "isabella.nguyen@email.com", amount: "+$299.00" },
    { name: "William Kim", email: "will@email.com", amount: "+$99.00" },
    { name: "Sofia Davis", email: "sofia.davis@email.com", amount: "+$39.00" },
]

export function BAStudio() {
    const { activeDataset, isLoading } = useDataset()
    const [loading, setLoading] = useState(false)

    // Mock chart data
    const chartData = [
        {
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            y: [4000, 3000, 2000, 2780, 1890, 2390],
            type: 'scatter',
            mode: 'lines+markers',
            marker: { color: '#3b82f6' },
            name: 'Revenue'
        },
        {
            x: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            y: [2400, 1398, 9800, 3908, 4800, 3800],
            type: 'bar',
            marker: { color: '#8b5cf6' },
            name: 'Sales'
        }
    ]

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Business Analytics Studio</h1>
                    <p className="text-zinc-400">Advanced KPI tracking, forecasting, and strategic insights.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                        <Brain className="mr-2 h-4 w-4" />
                        AI Forecast
                    </Button>
                    {/* Placeholder for Report Generator using mock data */}
                    <ReportGenerator
                        data={activeDataset ? {
                            data_quality_score: { overall_score: 85, rating: 'Good' }, // Mock score for now
                            columns: activeDataset.columns.map(col => ({ name: col, dtype: 'string', missing_percentage: 0, unique_count: 0, mean: 0 }))
                        } : undefined}
                        datasetName={activeDataset?.filename || "No Dataset Selected"}
                        aiInsights={{
                            insights: ["Revenue shows a 20% upward trend.", "User acquisition cost dropped by 4%."],
                            recommendations: ["Increase marketing spend in Q2.", "Optimize checkout flow."]
                        }}
                    />
                </div>
            </div>

            {activeDataset ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {KPIData.map((kpi, index) => (
                        <Card key={index} className="bg-white/[0.03] backdrop-blur-md border-white/10 hover:bg-white/[0.05] transition-colors">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium text-zinc-200">
                                    {kpi.title}
                                </CardTitle>
                                <kpi.icon className="h-4 w-4 text-zinc-400" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-white">{kpi.value}</div>
                                <p className={`text-xs flex items-center mt-1 ${kpi.trend === 'up' ? 'text-green-500' : 'text-red-500'
                                    }`}>
                                    {kpi.trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                                    {kpi.change} from last month
                                </p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="bg-white/[0.03] backdrop-blur-md border-white/10 p-6 flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-full bg-zinc-800/50">
                        <Database className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-white">No Dataset Selected</h3>
                        <p className="text-zinc-400 max-w-sm mt-1">
                            Please select a dataset from the dashboard to view business analytics.
                        </p>
                    </div>
                </Card>
            )}

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList className="bg-white/[0.03] border border-white/10">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="forecasting">Forecasting</TabsTrigger>
                    <TabsTrigger value="reports">Reports</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                        <Card className="col-span-4 bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Revenue Overview</CardTitle>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <div className="h-[300px] w-full">
                                    <Plot
                                        data={chartData}
                                        layout={{
                                            autosize: true,
                                            paper_bgcolor: 'rgba(0,0,0,0)',
                                            plot_bgcolor: 'rgba(0,0,0,0)',
                                            font: { color: '#a1a1aa' },
                                            margin: { t: 10, r: 10, l: 40, b: 20 },
                                            showlegend: true,
                                            legend: { orientation: 'h', y: 1.1 }
                                        }}
                                        config={{ responsive: true, displayModeBar: false }}
                                        className="w-full h-full"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="col-span-3 bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Recent Sales</CardTitle>
                                <CardDescription>
                                    You made 265 sales this month.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-8">
                                    {recentSales.map((sale, index) => (
                                        <div key={index} className="flex items-center">
                                            <div className="space-y-1">
                                                <p className="text-sm font-medium leading-none text-white">{sale.name}</p>
                                                <p className="text-sm text-zinc-500">{sale.email}</p>
                                            </div>
                                            <div className="ml-auto font-medium text-white">{sale.amount}</div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="forecasting">
                    <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Brain className="h-5 w-5 text-purple-500" />
                                AI-Powered Revenue Forecast
                            </CardTitle>
                            <CardDescription>
                                Predicted revenue for the next 6 months based on historical data.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="h-[400px] w-full flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg">
                                <p className="text-zinc-500">Connect a dataset to generate forecasts</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
