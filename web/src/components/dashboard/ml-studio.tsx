"use client"

import { useState, useEffect } from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardFooter
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Play, Copy, Terminal, Database, Activity, Box, Save, Loader2 } from "lucide-react"
import { useDataset } from "@/providers/dataset-provider"
import { toast } from "sonner"

interface MLModel {
    id: string
    name: string
    type: string
    status: string
    accuracy: string
}

export function MLStudio() {
    const [training, setTraining] = useState(false)
    const [models, setModels] = useState<MLModel[]>([])
    const [availableModels, setAvailableModels] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const { activeDataset, datasets } = useDataset()

    // Fetch available ML models from backend
    useEffect(() => {
        fetchAvailableModels()
    }, [])

    const fetchAvailableModels = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/ml/models')
            if (response.ok) {
                const data = await response.json()
                setAvailableModels(data)
            }
        } catch (error) {
            console.error('Failed to fetch ML models:', error)
            toast.error('Failed to load ML models')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">No-Code ML Studio</h1>
                    <p className="text-sm text-zinc-500">Train, deploy, and manage machine learning models.</p>
                </div>
                {availableModels && (
                    <Badge variant="outline" className="text-xs">
                        {Object.values(availableModels).flat().length} algorithms available
                    </Badge>
                )}
            </div>

            <Tabs defaultValue="train" className="space-y-4">
                <TabsList className="bg-white/[0.03] border border-white/10">
                    <TabsTrigger value="train" className="gap-2"><Activity className="h-4 w-4" /> Train New Model</TabsTrigger>
                    <TabsTrigger value="registry" className="gap-2"><Box className="h-4 w-4" /> Model Registry</TabsTrigger>
                    <TabsTrigger value="inference" className="gap-2"><Terminal className="h-4 w-4" /> Inference API</TabsTrigger>
                </TabsList>

                {/* Train Model Tab */}
                <TabsContent value="train">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-2 bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Training Configuration</CardTitle>
                                <CardDescription>Setup your training pipeline</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-white">Dataset</Label>
                                        <Select>
                                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                <SelectValue placeholder="Select dataset" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="ds1">Customer_Data_Q1.csv</SelectItem>
                                                <SelectItem value="ds2">Housing_Prices_2024.csv</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-white">Task Type</Label>
                                        <Select>
                                            <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                <SelectValue placeholder="Select task" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="classification">Classification</SelectItem>
                                                <SelectItem value="regression">Regression</SelectItem>
                                                <SelectItem value="clustering">Clustering</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white">Target Variable</Label>
                                    <Select>
                                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                            <SelectValue placeholder="Select column to predict" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="churn">Churn</SelectItem>
                                            <SelectItem value="price">Price</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-white">Algorithm</Label>
                                    <Select>
                                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                            <SelectValue placeholder="Select algorithm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableModels?.regression && (
                                                <>
                                                    <SelectItem value="regression-header" disabled>
                                                        <span className="font-bold">Regression</span>
                                                    </SelectItem>
                                                    {availableModels.regression.map((model: string) => (
                                                        <SelectItem key={model} value={model}>
                                                            {model.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            )}
                                            {availableModels?.classification && (
                                                <>
                                                    <SelectItem value="classification-header" disabled>
                                                        <span className="font-bold">Classification</span>
                                                    </SelectItem>
                                                    {availableModels.classification.map((model: string) => (
                                                        <SelectItem key={model} value={model}>
                                                            {model.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                                                        </SelectItem>
                                                    ))}
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button className="bg-blue-600 hover:bg-blue-700 w-full" onClick={() => setTraining(true)}>
                                    {training ? "Training in progress..." : "Start Training Session"}
                                </Button>
                            </CardFooter>
                        </Card>

                        <div className="space-y-6">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white text-sm">Training Queue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-3 text-sm text-zinc-400">
                                        <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />
                                        <span>Waiting for resources...</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* Model Registry Tab */}
                <TabsContent value="registry">
                    <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                        <CardHeader>
                            <CardTitle className="text-white">Model Registry</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {models.map(model => (
                                    <div key={model.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-white/5 hover:border-white/20 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <Box className="h-8 w-8 text-blue-500 bg-blue-500/10 p-1.5 rounded" />
                                            <div>
                                                <h3 className="font-medium text-white">{model.name}</h3>
                                                <p className="text-xs text-zinc-500">{model.type}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className="text-xs text-zinc-500">Accuracy</p>
                                                <p className="font-bold text-white">{model.accuracy}</p>
                                            </div>
                                            <Badge variant={model.status === 'Ready' ? 'default' : 'outline'}>{model.status}</Badge>
                                            <Button size="sm" variant="outline">Deploy</Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Inference Tab (Existing View) */}
                <TabsContent value="inference">
                    <Card className="flex flex-col bg-zinc-900/50 backdrop-blur-md border-white/5 overflow-hidden">
                        <div className="bg-[#0d1117]/50 border-b border-white/5 p-3 flex items-center justify-between px-4">
                            <div className="flex items-center gap-2">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
                                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/40" />
                                </div>
                                <span className="ml-4 text-xs font-mono text-zinc-500">inference_engine.py</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button variant="ghost" size="sm" className="h-6 gap-1.5 text-xs text-zinc-400 hover:text-white">
                                    <Copy className="h-3 w-3" /> Copy
                                </Button>
                                <Button size="sm" className="h-6 gap-1.5 bg-blue-500/20 text-blue-500 text-xs font-bold border border-blue-500/30 hover:bg-blue-500 hover:text-white transition-all">
                                    <Play className="h-3 w-3" /> RUN MODEL
                                </Button>
                            </div>
                        </div>
                        <CardContent className="flex-1 bg-[#0d1117] p-4 font-mono text-sm overflow-y-auto">
                            <div className="flex gap-4">
                                <div className="text-zinc-600 text-right select-none w-6 text-xs leading-relaxed">
                                    1<br />2<br />3<br />4<br />5<br />6<br />7<br />8<br />9<br />10
                                </div>
                                <div className="text-zinc-300 text-xs leading-relaxed">
                                    <span className="text-purple-400">import</span> torch<br />
                                    <span className="text-purple-400">from</span> ultralytics <span className="text-purple-400">import</span> YOLO<br /><br />
                                    <span className="text-zinc-500"># Load pre-trained model</span><br />
                                    model = YOLO(<span className="text-yellow-200">'yolov8n.pt'</span>)<br /><br />
                                    <span className="text-purple-400">def</span> <span className="text-blue-400">run_inference</span>(source_id):<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;results = model.predict(source=source_id, conf=<span className="text-orange-300">0.25</span>)<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">for</span> result <span className="text-purple-400">in</span> results:<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;boxes = result.boxes<br />
                                    &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-purple-400">return</span> boxes.data.cpu().numpy()<br /><br />
                                    <span className="text-blue-400">run_inference</span>(<span className="text-yellow-200">"rtsp://edge-node-04/stream"</span>)
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
