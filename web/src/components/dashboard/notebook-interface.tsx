"use client"

import { useState, useEffect } from "react"
import { API_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Play, Trash2, Code, FileText } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import dynamic from 'next/dynamic'

const Editor = dynamic(() => import('@monaco-editor/react'), { ssr: false })

interface Cell {
    id: string
    type: 'code' | 'markdown'
    content: string
    output?: string
    error?: string
    executionCount?: number
}

export function NotebookInterface() {
    const [datasets, setDatasets] = useState<any[]>([])
    const [selectedDataset, setSelectedDataset] = useState<string>("")
    const [cells, setCells] = useState<Cell[]>([
        {
            id: '1',
            type: 'code',
            content: '# Welcome to DataSynth Analytics Hub\n# The selected dataset is available as "df"\n\nif "df" in globals():\n    print("Dataset loaded successfully!")\n    print(f"Shape: {df.shape}")\n    print("\\nFirst 5 rows:")\n    print(df.head())\nelse:\n    print("No dataset selected. Use the selector above.")',
            executionCount: 0
        }
    ])
    const [executing, setExecuting] = useState<string | null>(null)
    const { toast } = useToast()

    useEffect(() => {
        fetchDatasets()
    }, [])

    const fetchDatasets = async () => {
        try {
            const response = await fetch(`${API_URL}/data/list`)
            const data = await response.json()
            setDatasets(data)
            if (data.length > 0 && !selectedDataset) {
                setSelectedDataset(data[0].id)
            }
        } catch (error) {
            console.error('Failed to fetch datasets:', error)
        }
    }

    const addCell = (type: 'code' | 'markdown') => {
        const newCell: Cell = {
            id: Date.now().toString(),
            type,
            content: type === 'code' ? '# New code cell' : '# New markdown cell',
            executionCount: 0
        }
        setCells([...cells, newCell])
    }

    const updateCell = (id: string, content: string) => {
        setCells(cells.map(cell => cell.id === id ? { ...cell, content } : cell))
    }

    const deleteCell = (id: string) => {
        setCells(cells.filter(cell => cell.id !== id))
    }

    const executeCell = async (id: string) => {
        const cell = cells.find(c => c.id === id)
        if (!cell || cell.type !== 'code') return

        setExecuting(id)
        try {
            const response = await fetch(`${API_URL}/execute`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    code: cell.content,
                    dataset_id: selectedDataset || undefined
                })
            })
            const data = await response.json()

            setCells(cells.map(c => c.id === id ? {
                ...c,
                output: data.output || '',
                error: data.error || undefined,
                executionCount: (c.executionCount || 0) + 1
            } : c))

            if (data.error) {
                toast({
                    title: "Execution Error",
                    description: "Check the cell output for details",
                    variant: "destructive"
                })
            }
        } catch (error) {
            toast({
                title: "Execution Failed",
                description: String(error),
                variant: "destructive"
            })
        } finally {
            setExecuting(null)
        }
    }

    return (
        <div className="p-8 space-y-6 max-w-7xl mx-auto">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-1">Notebook</h1>
                    <p className="text-sm text-zinc-500">Interactive Python notebook environment</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-zinc-500">Context:</span>
                        <Select value={selectedDataset} onValueChange={setSelectedDataset}>
                            <SelectTrigger className="w-[200px] bg-zinc-900 border-white/10 text-white h-9">
                                <SelectValue placeholder="Select dataset" />
                            </SelectTrigger>
                            <SelectContent>
                                {datasets.map(ds => (
                                    <SelectItem key={ds.id} value={ds.id}>{ds.filename}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => addCell('code')} variant="outline" size="sm">
                            <Code className="mr-2 h-4 w-4" />
                            Add Code Cell
                        </Button>
                        <Button onClick={() => addCell('markdown')} variant="outline" size="sm">
                            <FileText className="mr-2 h-4 w-4" />
                            Add Markdown
                        </Button>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {cells.map((cell, index) => (
                    <Card key={cell.id} className="bg-white/[0.03] backdrop-blur-md border-white/10">
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Badge variant={cell.type === 'code' ? 'default' : 'secondary'}>
                                        {cell.type === 'code' ? <Code className="h-3 w-3" /> : <FileText className="h-3 w-3" />}
                                    </Badge>
                                    {cell.type === 'code' && cell.executionCount !== undefined && (
                                        <span className="text-xs text-zinc-500">
                                            [{cell.executionCount}]
                                        </span>
                                    )}
                                </div>
                                <div className="flex gap-2">
                                    {cell.type === 'code' && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => executeCell(cell.id)}
                                            disabled={executing === cell.id}
                                        >
                                            {executing === cell.id ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <Play className="h-4 w-4" />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => deleteCell(cell.id)}
                                    >
                                        <Trash2 className="h-4 w-4 text-red-500" />
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <Editor
                                height="150px"
                                language={cell.type === 'code' ? 'python' : 'markdown'}
                                theme="vs-dark"
                                value={cell.content}
                                onChange={(value) => updateCell(cell.id, value || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    lineNumbers: 'on',
                                    scrollBeyondLastLine: false,
                                    automaticLayout: true
                                }}
                            />

                            {/* Output */}
                            {cell.output && (
                                <div className="mt-2 p-3 bg-zinc-900 rounded border border-white/5">
                                    <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap">
                                        {cell.output}
                                    </pre>
                                </div>
                            )}

                            {/* Error */}
                            {cell.error && (
                                <div className="mt-2 p-3 bg-red-500/10 rounded border border-red-500/20">
                                    <pre className="text-sm text-red-400 font-mono whitespace-pre-wrap">
                                        {cell.error}
                                    </pre>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {cells.length === 0 && (
                <Card className="bg-white/[0.03] backdrop-blur-md border-white/10">
                    <CardContent className="p-12 text-center">
                        <p className="text-zinc-500">No cells yet. Add a code or markdown cell to get started.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
