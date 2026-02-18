"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
    Zap,
    Database,
    Cpu,
    MoveRight,
    Check,
    AlertTriangle,
    Scale,
    Timer,
    Sliders
} from "lucide-react"

import { useDataset } from "@/providers/dataset-provider"

export function OptimizationSuite() {
    const { activeDataset } = useDataset()
    const [optimizing, setOptimizing] = useState(false)
    const [progress, setProgress] = useState(0)

    const handleOptimize = () => {
        setOptimizing(true)
        setProgress(0)
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) {
                    clearInterval(interval)
                    setOptimizing(false)
                    return 100
                }
                return prev + 10
            })
        }, 500)
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Optimization Suite</h1>
                    <p className="text-zinc-400">Maximize performance, reduce costs, and fine-tune models.</p>
                </div>
            </div>

            {activeDataset ? (
                <Tabs defaultValue="data" className="space-y-4">
                    <TabsList className="bg-white/[0.03] border border-white/10">
                        <TabsTrigger value="data" className="gap-2"><Database className="h-4 w-4" /> Data Optimization</TabsTrigger>
                        <TabsTrigger value="model" className="gap-2"><Cpu className="h-4 w-4" /> Model Tuning</TabsTrigger>
                        <TabsTrigger value="process" className="gap-2"><Scale className="h-4 w-4" /> Process Solver</TabsTrigger>
                    </TabsList>

                    {/* Data Optimization Tab */}
                    <TabsContent value="data" className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Database className="h-5 w-5 text-blue-400" />
                                        Memory Reduction
                                    </CardTitle>
                                    <CardDescription>Compress data types to save RAM.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Current Size</span>
                                            <span className="text-white">1.2 GB</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-zinc-400">Projected Size</span>
                                            <span className="text-green-400">450 MB</span>
                                        </div>
                                        <Progress value={65} className="h-2" />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={handleOptimize} disabled={optimizing}>
                                        {optimizing ? "Optimizing..." : "Run Downcasting"}
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Sliders className="h-5 w-5 text-purple-400" />
                                        Feature Selection
                                    </CardTitle>
                                    <CardDescription>Remove low-variance & redundant features.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-yellow-500">
                                            <AlertTriangle className="h-4 w-4" />
                                            12 Features highly correlated
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-zinc-400">
                                            <Check className="h-4 w-4 text-green-500" />
                                            5 Constant columns detected
                                        </div>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full border-purple-500/20 text-purple-400 hover:bg-purple-500/10">
                                        Analyze Features
                                    </Button>
                                </CardFooter>
                            </Card>

                            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                                <CardHeader>
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <Zap className="h-5 w-5 text-yellow-400" />
                                        Format Conversion
                                    </CardTitle>
                                    <CardDescription>Convert CSV/JSON to Parquet/Arrow.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-center py-6">
                                        <Badge variant="outline" className="text-zinc-400 border-zinc-700">Recommended: Parquet</Badge>
                                        <p className="text-xs text-zinc-500 mt-2">Up to 10x faster read/write</p>
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" className="w-full">Convert All</Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* Model Tuning Tab */}
                    <TabsContent value="model" className="space-y-4">
                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Hyperparameter Tuning (Optuna)</CardTitle>
                                <CardDescription>Automated search for optimal model parameters.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-lg bg-zinc-900/50 border border-white/5">
                                            <h4 className="text-white font-medium mb-2">Search Space</h4>
                                            <div className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Learning Rate</span>
                                                    <span className="text-zinc-300">0.001 - 0.1</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Max Depth</span>
                                                    <span className="text-zinc-300">3 - 15</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-zinc-500">Estimators</span>
                                                    <span className="text-zinc-300">50 - 500</span>
                                                </div>
                                            </div>
                                        </div>
                                        <Button className="w-full bg-gradient-to-r from-purple-600 to-blue-600">
                                            <Zap className="mr-2 h-4 w-4" /> Start Auto-Tuning
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-center">
                                        <div className="text-center space-y-2">
                                            <Timer className="h-12 w-12 text-zinc-600 mx-auto" />
                                            <p className="text-zinc-500">Estimated time: 15 mins</p>
                                            <p className="text-xs text-zinc-600">Based on dataset size: 1.2GB</p>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Process Solver Tab */}
                    <TabsContent value="process" className="space-y-4">
                        <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                            <CardHeader>
                                <CardTitle className="text-white">Linear Optimization Solver</CardTitle>
                                <CardDescription>Allocate resources to maximize objective function.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] flex items-center justify-center border-2 border-dashed border-zinc-800 rounded-lg">
                                    <p className="text-zinc-500">Define constraints and objective to solve</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            ) : (
                <Card className="bg-white/[0.03] backdrop-blur-md border-white/10 p-6 flex flex-col items-center justify-center space-y-4">
                    <div className="p-4 rounded-full bg-zinc-800/50">
                        <Database className="h-8 w-8 text-zinc-400" />
                    </div>
                    <div className="text-center">
                        <h3 className="text-lg font-medium text-white">No Dataset Selected</h3>
                        <p className="text-zinc-400 max-w-sm mt-1">
                            Please select a dataset to access optimization tools.
                        </p>
                    </div>
                </Card>
            )}
        </div>
    )
}
