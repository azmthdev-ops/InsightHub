"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import { API_URL } from "@/lib/api"
import { useToast } from "@/hooks/use-toast"

interface Dataset {
    id: string
    filename: string
    shape: { rows: number; columns: number }
    columns: string[]
}

interface DatasetContextType {
    activeDatasetId: string | null
    activeDataset: Dataset | null
    datasets: Dataset[]
    isLoading: boolean
    setActiveDatasetById: (id: string) => void
    refreshDatasets: () => Promise<void>
}

const DatasetContext = createContext<DatasetContextType | undefined>(undefined)

export function DatasetProvider({ children }: { children: React.ReactNode }) {
    const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null)
    const [datasets, setDatasets] = useState<Dataset[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const { toast } = useToast()

    const refreshDatasets = useCallback(async () => {
        setIsLoading(true)
        try {
            const response = await fetch(`${API_URL}/data/list`)
            if (!response.ok) throw new Error("Failed to fetch datasets")
            const data = await response.json()
            setDatasets(data)

            // Auto-select first dataset if none selected
            if (!activeDatasetId && data.length > 0) {
                setActiveDatasetId(data[0].id)
            }
        } catch (error) {
            console.error("Dataset sync error:", error)
        } finally {
            setIsLoading(false)
        }
    }, [activeDatasetId])

    const setActiveDatasetById = useCallback((id: string) => {
        setActiveDatasetId(id)
        const ds = datasets.find(d => d.id === id)
        if (ds) {
            toast({
                title: "Context Shift",
                description: `Switched active node to ${ds.filename}`,
            })
        }
    }, [datasets, toast])

    useEffect(() => {
        refreshDatasets()
    }, [refreshDatasets])

    const activeDataset = datasets.find(d => d.id === activeDatasetId) || null

    return (
        <DatasetContext.Provider value={{
            activeDatasetId,
            activeDataset,
            datasets,
            isLoading,
            setActiveDatasetById,
            refreshDatasets
        }}>
            {children}
        </DatasetContext.Provider>
    )
}

export function useDataset() {
    const context = useContext(DatasetContext)
    if (context === undefined) {
        throw new Error("useDataset must be used within a DatasetProvider")
    }
    return context
}
