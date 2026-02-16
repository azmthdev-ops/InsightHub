"use client"

import { useState, useEffect, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { API_URL } from "@/lib/api"
import { supabase } from "@/lib/supabase"
import { Input } from "@/components/ui/input"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Upload, Trash2, Database, FileText, CloudUpload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

import { useDataset } from "@/providers/dataset-provider"

export function DataCenter() {
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const [isDragActive, setIsDragActive] = useState(false)
    const { toast } = useToast()
    const { datasets, isLoading: loading, refreshDatasets } = useDataset()

    const processFile = async (file: File) => {
        if (!file) return

        setIsUploading(true)
        setUploadProgress(10)

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Authentication required for ingestion")

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop()
            const fileName = `${user.id}/${Date.now()}.${fileExt}`
            const filePath = `${fileName}`

            setUploadProgress(20)
            const { data: storageData, error: storageError } = await supabase.storage
                .from('datasets')
                .upload(filePath, file)

            if (storageError) {
                if (storageError.message.includes("Bucket not found")) {
                    throw new Error("Supabase Storage 'datasets' bucket not initialized. Please create it in your Supabase dashboard.")
                }
                throw storageError
            }

            setUploadProgress(50)

            // 2. Parse & Register with FastAPI
            const formData = new FormData()
            formData.append('file', file)

            const response = await fetch(`${API_URL}/data/upload`, {
                method: 'POST',
                body: formData,
            })

            if (!response.ok) throw new Error('Neural extraction failed')
            const parseData = await response.json()

            setUploadProgress(80)

            // 3. Save Metadata to Supabase Table
            const { error: dbError } = await supabase
                .from('datasets')
                .insert({
                    user_id: user.id,
                    filename: file.name,
                    storage_path: storageData.path,
                    row_count: parseData.shape.rows,
                    column_count: parseData.shape.columns,
                    columns: parseData.columns,
                    schema: parseData.preview[0] // Head preview as initial schema hint
                })

            if (dbError) throw dbError

            setUploadProgress(100)
            await refreshDatasets()

            toast({
                title: "Asset Synchronized",
                description: `${file.name} is now available in the hub.`,
            })
        } catch (error: any) {
            console.error("Ingestion Error:", error)
            toast({
                title: "Ingestion Failed",
                description: error.message || "An unexpected error occurred",
                variant: "destructive"
            })
        } finally {
            setIsUploading(false)
            setUploadProgress(0)
        }
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) processFile(file)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        setIsDragActive(false)
        const file = e.dataTransfer.files[0]
        if (file) processFile(file)
    }

    const handleDelete = async (id: string, name: string) => {
        try {
            // Remove from Supabase Table
            const { error: dbError } = await supabase.from('datasets').delete().eq('id', id)
            if (dbError) throw dbError

            // Remove from FastAPI memory
            await fetch(`${API_URL}/data/${id}`, { method: 'DELETE' })

            await refreshDatasets()
            toast({
                title: "Dataset Decoupled",
                description: `${name} has been removed from the persistent layer.`,
            })
        } catch (error) {
            toast({
                title: "Action Failed",
                description: "Could not remove the specified dataset.",
                variant: "destructive"
            })
        }
    }

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-1">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <Database className="h-6 w-6 text-blue-400" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Data Center</h1>
                </div>
                <p className="text-zinc-400">Secure ingestion and lifecycle management for your analytics assets.</p>
            </header>

            {/* Premium Upload Zone */}
            <motion.div
                onDragOver={(e) => { e.preventDefault(); setIsDragActive(true) }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                className={`
                    relative group transition-all duration-500 rounded-3xl p-1 bg-gradient-to-br
                    ${isDragActive ? "from-blue-500 to-violet-600 scale-[1.01]" : "from-white/5 to-white/[0.02]"}
                `}
            >
                <div className="relative overflow-hidden rounded-[22px] bg-zinc-950 px-10 py-16 border border-white/5">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-blue-500/10 blur-[120px] pointer-events-none" />

                    <div className="relative flex flex-col items-center justify-center text-center gap-6">
                        <motion.div
                            animate={isUploading ? { y: [0, -10, 0] } : {}}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className={`
                                p-5 rounded-2xl border-2 border-dashed transition-colors duration-300
                                ${isDragActive ? "border-white/50 bg-white/10" : "border-white/10 bg-white/5"}
                                ${isUploading ? "border-blue-500/50" : ""}
                            `}
                        >
                            {isUploading ? (
                                <Loader2 className="h-10 w-10 text-blue-400 animate-spin" />
                            ) : (
                                <CloudUpload className={`h-10 w-10 transition-colors ${isDragActive ? "text-white" : "text-zinc-500"}`} />
                            )}
                        </motion.div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-white">
                                {isUploading ? "Synchronizing Asset..." : "Drop your data here"}
                            </h3>
                            <p className="text-zinc-500 max-w-sm mx-auto">
                                Supporting CSV, Parquet, and JSON. Maximum file size 100MB for standard ingestion.
                            </p>
                        </div>

                        {!isUploading ? (
                            <div className="relative overflow-hidden group/btn">
                                <Input
                                    type="file"
                                    onChange={handleFileChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                />
                                <Button className="relative bg-white text-black hover:bg-zinc-200 px-8 h-12 rounded-full font-bold transition-transform active:scale-95">
                                    Browse Files
                                </Button>
                            </div>
                        ) : (
                            <div className="w-full max-w-md bg-white/5 rounded-full h-2 mt-4 overflow-hidden border border-white/5">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-blue-500 to-violet-600"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Inventory Section */}
            <Card className="bg-zinc-950/50 backdrop-blur-xl border-white/5 rounded-[24px] overflow-hidden">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-xl text-white">Asset Inventory</CardTitle>
                            <CardDescription className="text-zinc-500 mt-1">Manage and decouple active datasets from your workspace.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/5">
                            <span className="flex h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{datasets.length} Total Assets</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-8 space-y-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-4 items-center">
                                    <div className="h-10 w-10 rounded-lg bg-white/5 animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-1/3 bg-white/5 animate-pulse rounded" />
                                        <div className="h-3 w-1/4 bg-white/5 animate-pulse rounded" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : datasets.length === 0 ? (
                        <div className="text-center py-24">
                            <div className="inline-flex p-4 rounded-3xl bg-white/[0.02] border border-white/5 mb-6">
                                <Database className="h-10 w-10 text-zinc-700" />
                            </div>
                            <h4 className="text-white font-medium mb-1">Vault is empty</h4>
                            <p className="text-zinc-500 text-sm">Upload your first dataset to start the lifecycle.</p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-white/[0.01]">
                                <TableRow className="border-white/5 hover:bg-transparent px-8">
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-12 pl-8">Asset</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-12">Dimensions</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-12">Security</TableHead>
                                    <TableHead className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest h-12 text-right pr-8">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {datasets.map((ds) => (
                                    <TableRow key={ds.id} className="border-white/5 hover:bg-white/[0.02] group transition-colors">
                                        <TableCell className="py-5 pl-8">
                                            <div className="flex items-center gap-4">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/10 to-violet-500/10 border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                    <FileText className="h-5 w-5 text-blue-400" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white font-semibold">{ds.filename}</span>
                                                    <span className="text-[10px] text-zinc-500 font-mono uppercase truncate max-w-[150px]">{ds.id}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="text-zinc-300 font-medium">{ds.shape.rows.toLocaleString()} Rows</span>
                                                <span className="text-[10px] text-zinc-500">{ds.shape.columns} Strategic Channels</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-green-500/10 text-green-400 border border-green-500/20">
                                                <CheckCircle2 className="h-3 w-3" />
                                                Verified
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-5 text-right pr-8">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(ds.id, ds.filename)}
                                                className="h-9 w-9 rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 className="h-4.5 w-4.5" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
