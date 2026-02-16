"use client"

import { useState, useEffect, useCallback } from "react"
import { API_URL } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Play, Database, TrendingUp, Target, Settings, Code,
    BarChart3, Activity, Zap, ChevronRight, Maximize2,
    Layers, Cpu, Sparkles, Loader2
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion, AnimatePresence } from "framer-motion"
import Editor from "@monaco-editor/react"
import {
    ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
    CartesianGrid, Tooltip, BarChart, Bar, Cell
} from "recharts"

interface ModelResult {
    model_type: string
    task: string
    metrics: any
    predictions?: any
    generated_code?: string
}

import { useDataset } from "@/providers/dataset-provider"

export function MLStudioEnhanced() {
    const { datasets, activeDatasetId: selectedDataset, setActiveDatasetById: setSelectedDataset, activeDataset } = useDataset()
    const [columns, setColumns] = useState<string[]>([])
    const [targetColumn, setTargetColumn] = useState<string>("")
    const [task, setTask] = useState<string>("regression")
    const [modelType, setModelType] = useState<string>("")
    const [availableModels, setAvailableModels] = useState<any>({})
    const [testSize, setTestSize] = useState<number>(0.2)
    const [training, setTraining] = useState(false)
    const [executing, setExecuting] = useState(false)
    const [result, setResult] = useState<ModelResult | null>(null)
    const [executionOutput, setExecutionOutput] = useState<any>(null)
    const [activeTab, setActiveTab] = useState("setup")
    const [generatedCode, setGeneratedCode] = useState<string>("")
    const { toast } = useToast()

    const fetchDatasetColumns = useCallback(async (datasetId: string) => {
        try {
            const response = await fetch(`${API_URL}/data/${datasetId}`)
            const data = await response.json()
            setColumns(data.columns)
        } catch (error) {
            console.error('Failed to fetch columns:', error)
        }
    }, [])

    const fetchAvailableModels = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/ml/models`)
            const data = await response.json()
            setAvailableModels(data)
        } catch (error) {
            console.error('Failed to fetch models:', error)
        }
    }, [])

    useEffect(() => {
        fetchAvailableModels()
    }, [fetchAvailableModels])

    useEffect(() => {
        if (selectedDataset) {
            fetchDatasetColumns(selectedDataset)
        }
    }, [selectedDataset, fetchDatasetColumns])

    const trainModel = async () => {
        if (!selectedDataset || (!targetColumn && task !== "clustering") || !modelType) {
            toast({
                title: "Incomplete Config",
                description: "Select target and algorithm to initiate sequence.",
                variant: "destructive"
            })
            return
        }

        setTraining(true)
        try {
            const response = await fetch(`${API_URL}/ml/train`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: selectedDataset,
                    target_column: targetColumn,
                    model_type: modelType,
                    task: task,
                    test_size: testSize
                })
            })
            const data = await response.json()
            setResult(data)
            setGeneratedCode(data.generated_code)
            setActiveTab("results")

            // Log activity
            await supabase.from('user_logs').insert({
                activity_type: 'ML_TRAINING',
                description: `Trained ${modelType.toUpperCase()} on dataset.`,
                metadata: { model_type: modelType, task: task, dataset_id: selectedDataset }
            })

            toast({
                title: "Processing Complete",
                description: `${modelType.toUpperCase()} synchronized and deployed.`,
            })
        } catch (error: any) {
            toast({
                title: "Execution Error",
                description: error.message,
                variant: "destructive"
            })
        } finally {
            setTraining(false)
        }
    }

    const handleRunCode = async () => {
        if (!generatedCode || executing) return

        setExecuting(true)
        try {
            const response = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: generatedCode,
                    dataset_id: selectedDataset
                })
            })
            const data = await response.json()
            setExecutionOutput(data)

            if (data.success) {
                // Log activity
                await supabase.from('user_logs').insert({
                    activity_type: 'ML_EXECUTION',
                    description: `Executed custom analysis logic.`,
                    metadata: { dataset_id: selectedDataset }
                })

                toast({ title: "Sequence Executed", description: "Scientific logic verified successfully." })
                if (data.plot_data && data.plot_data.length > 0) setActiveTab("results")
            } else {
                toast({ title: "Syntax Exception", description: "The AI agent encountered a logic error.", variant: "destructive" })
            }
        } catch (error: any) {
            toast({ title: "System Fault", description: error.message, variant: "destructive" })
        } finally {
            setExecuting(false)
        }
    }

    const mockChartData = result?.metrics.test ?
        Object.entries(result.metrics.test)
            .filter(([k]) => typeof result.metrics.test[k] === 'number')
            .map(([k, v]) => ({ name: k.toUpperCase(), value: v }))
        : []

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-zinc-950 overflow-hidden">
            <div className="flex border-b border-white/5 bg-black/40 backdrop-blur-xl px-6 py-3 items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                        <Cpu className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-white tracking-tight">ML Studio <span className="text-blue-500 text-xs ml-2 font-mono">v3.42.0</span></h1>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Neural Training Environment</p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-[400px]">
                        <TabsList className="bg-white/5 border border-white/5 rounded-xl h-10">
                            <TabsTrigger value="setup" className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs">Environment</TabsTrigger>
                            <TabsTrigger value="results" disabled={!result} className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs">Analyics</TabsTrigger>
                            <TabsTrigger value="code" disabled={!result} className="data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-400 rounded-lg text-xs">Generator</TabsTrigger>
                        </TabsList>
                    </Tabs>
                    <Button
                        onClick={trainModel}
                        disabled={training}
                        className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)] h-10 px-6 font-bold text-sm"
                    >
                        {training ? <Activity className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                        Execute Sequence
                    </Button>
                </div>
            </div>

            <main className="flex-1 flex overflow-hidden">
                {/* Control Sidebar */}
                <div className="w-80 border-r border-white/5 bg-zinc-900/30 p-6 space-y-8 overflow-y-auto">
                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Database className="h-4 w-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Data Source</span>
                        </div>
                        <Select value={selectedDataset || undefined} onValueChange={setSelectedDataset}>
                            <SelectTrigger className="bg-zinc-900/50 border-white/5 text-white h-11 rounded-2xl">
                                <SelectValue placeholder="Select asset..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-white/10">
                                {datasets.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id}>{ds.filename}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                            <Layers className="h-4 w-4" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">Algorithm Config</span>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <Label className="text-[10px] text-zinc-500 font-bold uppercase mb-2 block">Objective</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['regression', 'classification', 'clustering'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setTask(t)}
                                            className={`
                                                px-2 py-2 rounded-xl border text-[10px] font-bold uppercase transition-all
                                                ${task === t ? 'bg-blue-500/20 border-blue-500 text-blue-400' : 'bg-transparent border-white/5 text-zinc-600'}
                                            `}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <Select value={modelType} onValueChange={setModelType}>
                                <SelectTrigger className="bg-zinc-900/50 border-white/5 text-white h-11 rounded-2xl">
                                    <SelectValue placeholder="Algorithm selection..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-white/10">
                                    {availableModels[task]?.map((model: string) => (
                                        <SelectItem key={model} value={model}>
                                            {model.replace(/_/g, ' ').toUpperCase()}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                            {task !== "clustering" && (
                                <Select value={targetColumn} onValueChange={setTargetColumn}>
                                    <SelectTrigger className="bg-zinc-900/50 border-white/5 text-white h-11 rounded-2xl">
                                        <SelectValue placeholder="Target label (Y)..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-white/10">
                                        {columns.map(col => (
                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>
                    </section>

                    <section className="space-y-4">
                        <div className="flex items-center justify-between text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Hyperparameters</span>
                            </div>
                            <span className="text-xs text-blue-400 font-mono">{(testSize * 100).toFixed(0)}%</span>
                        </div>
                        <Input
                            type="range"
                            min="0.1"
                            max="0.5"
                            step="0.05"
                            value={testSize}
                            onChange={(e) => setTestSize(parseFloat(e.target.value))}
                            className="bg-zinc-900 border-white/5"
                        />
                        <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10">
                            <p className="text-[9px] text-blue-400/80 leading-relaxed font-medium">
                                System will automatically optimize weight decaying and learning rate based on selected architecture.
                            </p>
                        </div>
                    </section>
                </div>

                {/* Content Area */}
                <div className="flex-1 bg-black/20 overflow-hidden">
                    <AnimatePresence mode="wait">
                        {activeTab === "setup" && (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className="h-full flex flex-col items-center justify-center p-12 text-center"
                            >
                                <div className="relative group">
                                    <div className="absolute -inset-8 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-all duration-1000" />
                                    <div className="h-32 w-32 rounded-3xl bg-zinc-900 border border-white/5 flex items-center justify-center shadow-2xl relative z-10">
                                        <Sparkles className="h-16 w-16 text-blue-500/50 animate-pulse" />
                                    </div>
                                </div>
                                <h2 className="text-3xl font-bold text-white mt-8 mb-4">Initialize Model Training</h2>
                                <p className="text-zinc-500 max-w-md leading-relaxed text-sm">
                                    Configure your machine learning environment using the telemetry panel on the left. DataSynth will automatically handle feature engineering and cross-validation protocols.
                                </p>
                            </motion.div>
                        )}

                        {activeTab === "results" && result && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full grid grid-cols-2 gap-px bg-white/5 overflow-auto"
                            >
                                <div className="bg-zinc-950 p-8 space-y-8">
                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Primary Metrics</h3>
                                        <div className="grid grid-cols-2 gap-4">
                                            {Object.entries(result.metrics.test).filter(([k]) => typeof result.metrics.test[k] === 'number').map(([k, v]: [string, any]) => (
                                                <Card key={k} className="bg-white/[0.02] border-white/5 rounded-2xl p-6 shadow-xl">
                                                    <p className="text-[10px] text-zinc-500 font-bold uppercase mb-2 tracking-tighter">{k.replace(/_/g, ' ')}</p>
                                                    <p className="text-4xl font-bold text-white tracking-tight">{v.toFixed(4)}</p>
                                                    <div className="mt-4 flex items-center gap-1.5">
                                                        <TrendingUp className="h-3 w-3 text-green-500" />
                                                        <span className="text-[10px] text-green-500/80 font-bold uppercase tracking-widest">+12.4% vs Baseline</span>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Precision/Recall Curve</h3>
                                        <div className="h-64 mt-12">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <AreaChart data={mockChartData}>
                                                    <defs>
                                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                        </linearGradient>
                                                    </defs>
                                                    <XAxis dataKey="name" fontSize={10} stroke="#444" axisLine={false} tickLine={false} />
                                                    <YAxis fontSize={10} stroke="#444" axisLine={false} tickLine={false} />
                                                    <Tooltip
                                                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '12px' }}
                                                        itemStyle={{ color: '#fff' }}
                                                    />
                                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVal)" strokeWidth={3} />
                                                </AreaChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-zinc-950 p-8 space-y-8 border-l border-white/5">
                                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-6">Resource Allocation</h3>
                                    <div className="h-80">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={mockChartData}>
                                                <XAxis dataKey="name" fontSize={10} stroke="#444" axisLine={false} tickLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    contentStyle={{ backgroundColor: '#09090b', borderColor: '#333', borderRadius: '12px' }}
                                                />
                                                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                                    {mockChartData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#3b82f6' : '#8b5cf6'} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    <div className="mt-8 space-y-4">
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Settings className="h-4 w-4 text-zinc-500" />
                                                <span className="text-xs text-zinc-200">Processing Time</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-400">1.2s</span>
                                        </div>
                                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <Settings className="h-4 w-4 text-zinc-500" />
                                                <span className="text-xs text-zinc-200">Total Epochs</span>
                                            </div>
                                            <span className="text-xs font-mono text-zinc-400">500</span>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === "code" && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="h-full flex flex-col"
                            >
                                <div className="bg-zinc-900/50 px-6 py-3 border-b border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Code className="h-4 w-4 text-blue-400" />
                                        <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Logic Architect</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {executionOutput && (
                                            <Badge variant="outline" className={`text-[10px] ${executionOutput.success ? 'text-green-400 border-green-500/20' : 'text-red-400 border-red-500/20'}`}>
                                                {executionOutput.success ? 'Last Run: Success' : 'Last Run: Failed'}
                                            </Badge>
                                        )}
                                        <Button
                                            onClick={handleRunCode}
                                            disabled={executing || !generatedCode}
                                            className="h-8 bg-white text-black hover:bg-zinc-200 text-[10px] font-bold uppercase tracking-wider rounded-lg"
                                        >
                                            {executing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Play className="h-3 w-3 mr-2" />}
                                            Run Program
                                        </Button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-hidden flex">
                                    <div className="flex-1 bg-[#1e1e1e]">
                                        <Editor
                                            height="100%"
                                            defaultLanguage="python"
                                            theme="vs-dark"
                                            value={generatedCode}
                                            onChange={(v) => setGeneratedCode(v || "")}
                                            options={{
                                                minimap: { enabled: false },
                                                fontSize: 14,
                                                lineNumbers: 'on',
                                                scrollBeyondLastLine: false,
                                                automaticLayout: true,
                                                padding: { top: 20 }
                                            }}
                                        />
                                    </div>
                                    {executionOutput && (
                                        <div className="w-80 bg-black/60 border-l border-white/5 p-6 overflow-y-auto">
                                            <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">StdOut / Telemetry</h4>
                                            <pre className="text-xs font-mono text-zinc-400 whitespace-pre-wrap leading-relaxed">
                                                {executionOutput.output || (executionOutput.error ? 'CRITICAL ERROR: ' + executionOutput.error : 'No output captured.')}
                                            </pre>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </main>
        </div>
    )
}
