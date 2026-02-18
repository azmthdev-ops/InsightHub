"use client"

import { useState, useEffect } from "react"
import { API_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Play, Activity, Sparkles, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Plot from "@/components/ui/plot"

export function VisualizationStudio() {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [columns, setColumns] = useState<string[]>([])
    const [plotType, setPlotType] = useState<string>("scatter")
    const [xColumn, setXColumn] = useState<string>("")
    const [yColumn, setYColumn] = useState<string>("")
    const [colorColumn, setColorColumn] = useState<string>("")
    const [nlQuery, setNlQuery] = useState<string>("")
    const [plotData, setPlotData] = useState<any>(null)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    const plotTypes = [
        { value: "scatter", label: "Scatter Plot" },
        { value: "line", label: "Line Chart" },
        { value: "bar", label: "Bar Chart" },
        { value: "histogram", label: "Histogram" },
        { value: "box", label: "Box Plot" },
        { value: "heatmap", label: "Heatmap" },
    ]

    useEffect(() => {
        fetchDatasets()
    }, [])

    useEffect(() => {
        if (selectedDataset) {
            fetchDatasetColumns(selectedDataset)
        }
    }, [selectedDataset])

    const fetchDatasets = async () => {
        try {
            const response = await fetch(`${API_URL}/data/list`)
            const data = await response.json()
            setDatasets(data)
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        }
    }

    const fetchDatasetColumns = async (datasetId: string) => {
        try {
            const response = await fetch(`${API_URL}/data/${datasetId}`)
            const data = await response.json()
            setColumns(data.columns)
        } catch (error) {
            console.error('Failed to fetch columns:', error)
        }
    }

    const createPlot = async () => {
        if (!selectedDataset || !xColumn) {
            toast({
                title: "Missing Information",
                description: "Select dataset and X column",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            const response = await fetch(`${API_URL}/data/visualize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: selectedDataset,
                    plot_config: {
                        type: plotType,
                        x: xColumn,
                        y: yColumn,
                        color: colorColumn
                    }
                })
            })
            const data = await response.json()
            if (data.error) throw new Error(data.error)
            setPlotData(data)
            toast({
                title: "Visualization Created",
                description: `${plotType} plot generated`,
            })
        } catch (error) {
            toast({
                title: "Visualization Failed",
                description: String(error),
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Visualization Studio</h1>
                <p className="text-sm text-zinc-500">Create interactive charts and visualizations</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Configuration */}
                <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Configuration</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label className="text-white">Dataset</Label>
                            <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                                <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                    <SelectValue placeholder="Select dataset" />
                                </SelectTrigger>
                                <SelectContent>
                                    {datasets.map(ds => (
                                        <SelectItem key={ds.id} value={ds.id}>{ds.filename}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label className="text-white">Plot Type</Label>
                            <Select value={plotType} onValueChange={setPlotType}>
                                <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {plotTypes.map(pt => (
                                        <SelectItem key={pt.value} value={pt.value}>{pt.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label className="text-white">X Axis</Label>
                                <Select value={xColumn} onValueChange={setXColumn}>
                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                        <SelectValue placeholder="X" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <Label className="text-white">Y Axis</Label>
                                <Select value={yColumn} onValueChange={setYColumn}>
                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                        <SelectValue placeholder="Y" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {columns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <Label className="text-white">Color (Optional)</Label>
                            <Select value={colorColumn} onValueChange={setColorColumn}>
                                <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                    <SelectValue placeholder="Color by..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">None</SelectItem>
                                    {columns.map(col => (
                                        <SelectItem key={col} value={col}>{col}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <Button
                            onClick={createPlot}
                            disabled={loading || !selectedDataset}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                            {loading ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            ) : (
                                <Play className="mr-2 h-4 w-4" />
                            )}
                            Create Plot
                        </Button>
                    </CardContent>
                </Card>

                {/* Smart Suggestions */}
                <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 backdrop-blur-md border-violet-500/20">
                    <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2 text-base">
                            <Sparkles className="h-4 w-4 text-violet-400" />
                            Smart Suggestions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <Button variant="ghost" className="w-full justify-start text-left h-auto p-2 hover:bg-white/5 group" onClick={() => {
                            setPlotType('scatter')
                            setXColumn(columns[0])
                            setYColumn(columns[1])
                        }}>
                            <div className="bg-violet-500/20 p-2 rounded-lg mr-3 group-hover:bg-violet-500/30 transition-colors">
                                <Activity className="h-4 w-4 text-violet-300" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-zinc-200">Correlation Analysis</div>
                                <div className="text-xs text-zinc-500">Scatter plot of numerical columns</div>
                            </div>
                            <Plus className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
                        </Button>

                        <Button variant="ghost" className="w-full justify-start text-left h-auto p-2 hover:bg-white/5 group" onClick={() => {
                            setPlotType('bar')
                            setXColumn(columns.find(c => c.toLowerCase().includes('cat') || c.toLowerCase().includes('name')) || columns[0])
                            setYColumn(columns.find(c => c.toLowerCase().includes('val') || c.toLowerCase().includes('num')) || columns[1])
                        }}>
                            <div className="bg-pink-500/20 p-2 rounded-lg mr-3 group-hover:bg-pink-500/30 transition-colors">
                                <Activity className="h-4 w-4 text-pink-300" />
                            </div>
                            <div>
                                <div className="text-sm font-medium text-zinc-200">Distribution Overview</div>
                                <div className="text-xs text-zinc-500">Bar chart of categorical data</div>
                            </div>
                            <Plus className="ml-auto h-4 w-4 text-zinc-500 group-hover:text-white" />
                        </Button>
                    </CardContent>
                </Card>

                {/* Preview */}
                <div className="lg:col-span-2">
                    <Card className="bg-white/[0.03] backdrop-blur-md border-white/10 h-full">
                        <CardHeader>
                            <CardTitle className="text-white">Preview</CardTitle>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            {plotData ? (
                                <Plot
                                    data={plotData.data}
                                    layout={plotData.layout}
                                    useResizeHandler={true}
                                    className="w-full h-full"
                                />
                            ) : (
                                <div className="w-full h-full bg-zinc-900/50 rounded-lg flex flex-col items-center justify-center border border-dashed border-white/5">
                                    <Activity className="h-12 w-12 text-zinc-700 mb-4" />
                                    <p className="text-zinc-500">Visualization preview will appear here</p>
                                    <p className="text-zinc-700 text-xs mt-2 uppercase tracking-widest font-bold">Configure and click Create Plot</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Natural Language Query */}
            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Natural Language Query</CardTitle>
                    <CardDescription>Describe the visualization you want to create</CardDescription>
                </CardHeader>
                <CardContent>
                    <Textarea
                        placeholder="e.g., Show me a scatter plot of revenue vs marketing spend colored by region"
                        value={nlQuery}
                        onChange={(e) => setNlQuery(e.target.value)}
                        className="bg-zinc-900 border-white/10 text-white min-h-[100px]"
                    />
                    <Button className="mt-4 bg-violet-500 hover:bg-violet-600">
                        Generate from Query
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
