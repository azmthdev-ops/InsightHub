"use client"

import { useState, useEffect } from "react"
import { API_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Activity, Database, TrendingUp, AlertCircle, CheckCircle2, Sparkles, Lightbulb } from "lucide-react"
import Plot from "@/components/ui/plot"
import { Skeleton } from "@/components/ui/skeleton"
import { ReportGenerator } from "@/components/dashboard/report-generator"

interface ProfileData {
    shape: { rows: number; columns: number }
    columns: any[]
    missing_analysis: any
    correlations: any
    data_quality_score: any
    outliers: any
    summary_stats: any
}

export function DataProfiler() {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string | null>(null)
    const [profileData, setProfileData] = useState<ProfileData | null>(null)
    const [aiInsights, setAiInsights] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        fetchDatasets()
    }, [])

    const fetchDatasets = async () => {
        try {
            const response = await fetch(`${API_URL}/data/list`)
            const data = await response.json()
            setDatasets(data)
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        }
    }

    const profileDataset = async (datasetId: string) => {
        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/data/profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataset_id: datasetId })
            })
            const data = await response.json()
            setProfileData(data)

            // Fetch AI Insights
            const aiRes = await fetch(`${API_URL}/ai/analyze`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dataset_id: datasetId })
            })
            const aiData = await aiRes.json()
            setAiInsights(aiData)

            setSelectedDataset(datasetId)
        } catch (error) {
            console.error('Failed to profile dataset:', error)
        } finally {
            setLoading(false)
        }
    }

    const getQualityColor = (rating: string) => {
        switch (rating) {
            case 'Excellent': return 'text-green-500'
            case 'Good': return 'text-blue-500'
            case 'Fair': return 'text-yellow-500'
            default: return 'text-red-500'
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Data Profiler</h1>
                    <p className="text-sm text-zinc-500">Comprehensive statistical analysis and data quality assessment</p>
                </div>
                {profileData && selectedDataset && (
                    <ReportGenerator
                        data={profileData}
                        aiInsights={aiInsights}
                        datasetName={datasets.find(d => d.id === selectedDataset)?.filename || 'Dataset'}
                    />
                )}
            </div>

            {/* Dataset Selector */}
            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Select Dataset</CardTitle>
                    <CardDescription>Choose a dataset to profile</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {datasets.map((ds) => (
                            <Button
                                key={ds.id}
                                variant={selectedDataset === ds.id ? "default" : "outline"}
                                className="h-auto p-4 flex flex-col items-start gap-2"
                                onClick={() => profileDataset(ds.id)}
                                disabled={loading}
                            >
                                <Database className="h-5 w-5" />
                                <div className="text-left">
                                    <div className="font-medium">{ds.filename}</div>
                                    <div className="text-xs text-zinc-500">
                                        {ds.shape.rows} rows × {ds.shape.columns} cols
                                    </div>
                                </div>
                            </Button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {loading ? (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Skeleton className="h-48 w-full" />
                        <Skeleton className="h-48 w-full" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                        <Skeleton className="h-32 w-full" />
                    </div>
                    <Skeleton className="h-[500px] w-full" />
                </div>
            ) : profileData && (
                <div className="space-y-6">
                    {/* AI Insights Section */}
                    {aiInsights && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 backdrop-blur-md border-blue-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                                        <Sparkles className="h-5 w-5 text-blue-400" />
                                        Smart Insights
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {aiInsights.insights.map((insight: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 text-sm text-zinc-300">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                                {insight}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>

                            <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 backdrop-blur-md border-emerald-500/20">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-white flex items-center gap-2 text-lg">
                                        <Lightbulb className="h-5 w-5 text-emerald-400" />
                                        Recommendations
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-3">
                                        {aiInsights.recommendations.map((rec: string, idx: number) => (
                                            <li key={idx} className="flex gap-2 text-sm text-zinc-300">
                                                <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                                                {rec}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Total Rows</p>
                                        <p className="text-3xl font-bold text-white">{profileData.shape.rows.toLocaleString()}</p>
                                    </div>
                                    <Database className="h-8 w-8 text-blue-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Columns</p>
                                        <p className="text-3xl font-bold text-white">{profileData.shape.columns}</p>
                                    </div>
                                    <TrendingUp className="h-8 w-8 text-violet-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Data Quality</p>
                                        <p className={`text-3xl font-bold ${getQualityColor(profileData.data_quality_score.rating)}`}>
                                            {profileData.data_quality_score.overall_score.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">{profileData.data_quality_score.rating}</p>
                                    </div>
                                    {profileData.data_quality_score.rating === 'Excellent' ? (
                                        <CheckCircle2 className="h-8 w-8 text-green-500 opacity-50" />
                                    ) : (
                                        <AlertCircle className="h-8 w-8 text-yellow-500 opacity-50" />
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardContent className="p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Missing Values</p>
                                        <p className="text-3xl font-bold text-white">
                                            {profileData.missing_analysis.overall_missing_percentage.toFixed(1)}%
                                        </p>
                                        <p className="text-xs text-zinc-500 mt-1">
                                            {profileData.missing_analysis.total_missing_cells.toLocaleString()} cells
                                        </p>
                                    </div>
                                    <Activity className="h-8 w-8 text-orange-500 opacity-50" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Detailed Tabs */}
                    <Tabs defaultValue="columns" className="w-full">
                        <TabsList className="bg-white/[0.03] border border-white/10">
                            <TabsTrigger value="columns">Columns</TabsTrigger>
                            <TabsTrigger value="correlations">Correlations</TabsTrigger>
                            <TabsTrigger value="missing">Missing Values</TabsTrigger>
                            <TabsTrigger value="outliers">Outliers</TabsTrigger>
                        </TabsList>

                        <TabsContent value="columns" className="space-y-4">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Column Statistics</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        {profileData.columns.map((col: any, idx: number) => (
                                            <div key={idx} className="p-4 bg-zinc-900/50 rounded-lg border border-white/5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium text-white">{col.name}</h3>
                                                    <div className="flex gap-2">
                                                        <Badge variant="outline">{col.dtype}</Badge>
                                                        <Badge variant={col.cardinality === 'high' ? 'destructive' : 'secondary'}>
                                                            {col.cardinality} cardinality
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                    <div>
                                                        <p className="text-zinc-500">Unique</p>
                                                        <p className="text-white font-medium">{col.unique_count}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-zinc-500">Missing</p>
                                                        <p className="text-white font-medium">{col.missing_percentage.toFixed(1)}%</p>
                                                    </div>
                                                    {col.mean !== undefined && (
                                                        <>
                                                            <div>
                                                                <p className="text-zinc-500">Mean</p>
                                                                <p className="text-white font-medium">{col.mean.toFixed(2)}</p>
                                                            </div>
                                                            <div>
                                                                <p className="text-zinc-500">Std Dev</p>
                                                                <p className="text-white font-medium">{col.std?.toFixed(2)}</p>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="correlations">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Correlation Analysis</CardTitle>
                                    <CardDescription>High correlations (|r| &gt; 0.7)</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {profileData.correlations.high_correlations && profileData.correlations.high_correlations.length > 0 ? (
                                        <div className="space-y-2">
                                            {profileData.correlations.high_correlations.map((corr: any, idx: number) => (
                                                <div key={idx} className="p-3 bg-zinc-900/50 rounded border border-white/5 flex justify-between items-center">
                                                    <span className="text-white">{corr.column1} ↔ {corr.column2}</span>
                                                    <Badge variant={Math.abs(corr.correlation) > 0.9 ? 'destructive' : 'secondary'}>
                                                        r = {corr.correlation.toFixed(3)}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-zinc-500 text-center py-8">No high correlations found</p>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="missing">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Missing Value Analysis</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {profileData.missing_analysis.columns_with_missing.map((col: string) => {
                                            const pct = profileData.missing_analysis.missing_percentage_by_column[col]
                                            return (
                                                <div key={col} className="p-3 bg-zinc-900/50 rounded border border-white/5">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="text-white font-medium">{col}</span>
                                                        <span className="text-zinc-400">{pct.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="w-full bg-zinc-800 rounded-full h-2">
                                                        <div
                                                            className="bg-orange-500 h-2 rounded-full"
                                                            style={{ width: `${pct}%` }}
                                                        ></div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="outliers">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white">Outlier Detection (IQR Method)</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {Object.entries(profileData.outliers).map(([col, data]: [string, any]) => (
                                            <div key={col} className="p-3 bg-zinc-900/50 rounded border border-white/5">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-white font-medium">{col}</span>
                                                    <div className="text-right">
                                                        <div className="text-white">{data.count} outliers</div>
                                                        <div className="text-xs text-zinc-500">{data.percentage.toFixed(1)}%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}
