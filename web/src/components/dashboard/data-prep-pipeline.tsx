"use client"

import { useState, useEffect } from "react"
import { API_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Play, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Operation {
    id: string
    type: string
    column?: string
    strategy?: string
    method?: string
    columns?: string[]
    fill_value?: any
}

export function DataPrepPipeline() {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [columns, setColumns] = useState<string[]>([])
    const [operations, setOperations] = useState<Operation[]>([])
    const [strategies, setStrategies] = useState<any>({})
    const [result, setResult] = useState<any>(null)
    const [processing, setProcessing] = useState(false)
    const { toast } = useToast()

    useEffect(() => {
        fetchDatasets()
        fetchStrategies()
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

    const fetchStrategies = async () => {
        try {
            const response = await fetch(`${API_URL}/data/prep-strategies`)
            const data = await response.json()
            setStrategies(data)
        } catch (error) {
            console.error('Failed to fetch strategies:', error)
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

    const addOperation = (type: string) => {
        const newOp: Operation = {
            id: Date.now().toString(),
            type
        }
        setOperations([...operations, newOp])
    }

    const updateOperation = (id: string, updates: Partial<Operation>) => {
        setOperations(operations.map(op => op.id === id ? { ...op, ...updates } : op))
    }

    const removeOperation = (id: string) => {
        setOperations(operations.filter(op => op.id !== id))
    }

    const applyPipeline = async () => {
        if (!selectedDataset || operations.length === 0) {
            toast({
                title: "Missing Information",
                description: "Select a dataset and add operations",
                variant: "destructive"
            })
            return
        }

        setProcessing(true)
        try {
            const response = await fetch(`${API_URL}/data/prepare`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dataset_id: selectedDataset,
                    operations: operations.map(op => {
                        const { id, ...rest } = op
                        return rest
                    })
                })
            })
            const data = await response.json()
            setResult(data)
            toast({
                title: "Pipeline Applied!",
                description: `${operations.length} operations completed successfully`,
            })
        } catch (error) {
            toast({
                title: "Pipeline Failed",
                description: String(error),
                variant: "destructive"
            })
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-white mb-1">Data Preparation</h1>
                <p className="text-sm text-zinc-500">Build a data transformation pipeline</p>
            </div>

            {/* Dataset Selection */}
            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Select Dataset</CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                            <SelectValue placeholder="Choose a dataset" />
                        </SelectTrigger>
                        <SelectContent>
                            {datasets.map(ds => (
                                <SelectItem key={ds.id} value={ds.id}>
                                    {ds.filename} ({ds.shape.rows} × {ds.shape.columns})
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {/* Pipeline Builder */}
            <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                <CardHeader>
                    <CardTitle className="text-white">Pipeline Operations</CardTitle>
                    <div className="flex gap-2 mt-4">
                        <Button size="sm" onClick={() => addOperation('impute')} variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Impute
                        </Button>
                        <Button size="sm" onClick={() => addOperation('encode')} variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Encode
                        </Button>
                        <Button size="sm" onClick={() => addOperation('scale')} variant="outline">
                            <Plus className="h-4 w-4 mr-1" /> Scale
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {operations.length === 0 ? (
                        <p className="text-zinc-500 text-center py-8">No operations added yet</p>
                    ) : (
                        operations.map((op, idx) => (
                            <div key={op.id} className="p-4 bg-zinc-900/50 rounded-lg border border-white/10">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <Badge>{idx + 1}</Badge>
                                        <span className="text-white font-medium capitalize">{op.type}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => removeOperation(op.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {op.type === 'impute' && (
                                        <>
                                            <div>
                                                <Label className="text-white">Column</Label>
                                                <Select
                                                    value={op.column}
                                                    onValueChange={(val) => updateOperation(op.id, { column: val })}
                                                >
                                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectValue placeholder="Select column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {columns.map(col => (
                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-white">Strategy</Label>
                                                <Select
                                                    value={op.strategy}
                                                    onValueChange={(val) => updateOperation(op.id, { strategy: val })}
                                                >
                                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectValue placeholder="Select strategy" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {strategies.imputation?.map((s: string) => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}

                                    {op.type === 'encode' && (
                                        <>
                                            <div>
                                                <Label className="text-white">Column</Label>
                                                <Select
                                                    value={op.column}
                                                    onValueChange={(val) => updateOperation(op.id, { column: val })}
                                                >
                                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectValue placeholder="Select column" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {columns.map(col => (
                                                            <SelectItem key={col} value={col}>{col}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div>
                                                <Label className="text-white">Method</Label>
                                                <Select
                                                    value={op.method}
                                                    onValueChange={(val) => updateOperation(op.id, { method: val })}
                                                >
                                                    <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                        <SelectValue placeholder="Select method" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {strategies.encoding?.map((s: string) => (
                                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    )}

                                    {op.type === 'scale' && (
                                        <div className="md:col-span-2">
                                            <Label className="text-white">Method</Label>
                                            <Select
                                                value={op.method}
                                                onValueChange={(val) => updateOperation(op.id, { method: val })}
                                            >
                                                <SelectTrigger className="bg-zinc-900 border-white/10 text-white">
                                                    <SelectValue placeholder="Select method" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {strategies.scaling?.map((s: string) => (
                                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {operations.length > 0 && (
                        <Button
                            onClick={applyPipeline}
                            disabled={processing}
                            className="w-full bg-blue-500 hover:bg-blue-600"
                        >
                            {processing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <Play className="mr-2 h-4 w-4" />
                                    Apply Pipeline
                                </>
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* Results */}
            {result && (
                <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                    <CardHeader>
                        <CardTitle className="text-white">Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-zinc-900/50 rounded">
                                    <p className="text-zinc-500 text-sm">Rows</p>
                                    <p className="text-2xl font-bold text-white">{result.shape.rows}</p>
                                </div>
                                <div className="p-4 bg-zinc-900/50 rounded">
                                    <p className="text-zinc-500 text-sm">Columns</p>
                                    <p className="text-2xl font-bold text-white">{result.shape.columns}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-white font-medium mb-2">Applied Operations</h3>
                                <div className="space-y-2">
                                    {result.applied_operations.map((op: any, idx: number) => (
                                        <div key={idx} className="p-3 bg-zinc-900/50 rounded border border-white/5">
                                            <Badge className="mb-2">{op.operation}</Badge>
                                            <pre className="text-xs text-zinc-400 overflow-auto">
                                                {JSON.stringify(op.details, null, 2)}
                                            </pre>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
