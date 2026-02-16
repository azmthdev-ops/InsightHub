"use client"

import { useEffect, useState } from "react"
import { useDataset } from "@/providers/dataset-provider"
import { API_URL } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import {
    Database, Cpu, Shield, ArrowUpRight, Cloud,
    ArrowDownRight, Loader2, AlertCircle
} from "lucide-react"
import { motion } from "framer-motion"
import { Skeleton } from "@/components/ui/skeleton"

interface StatsData {
    total_rows: number
    total_columns: number
    missing_values: number
    memory_usage: string
}

export function StatsCards() {
    const { activeDatasetId } = useDataset()
    const [stats, setStats] = useState<StatsData | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (!activeDatasetId) {
            setStats(null)
            return
        }

        const fetchStats = async () => {
            setLoading(true)
            setError(null)
            try {
                const response = await fetch(`${API_URL}/data/summary/${activeDatasetId}`)
                if (!response.ok) throw new Error("Failed to fetch statistics")
                const data = await response.json()
                setStats(data.stats)
            } catch (err: any) {
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [activeDatasetId, API_URL])

    const kpis = [
        {
            label: "Total Entities",
            value: stats?.total_rows.toLocaleString() || "0",
            detail: stats ? `${stats.total_columns} Dimensions` : "No data active",
            icon: Database,
            color: "text-blue-400",
            bg: "bg-blue-500/10",
            trend: stats ? "up" : "neutral"
        },
        {
            label: "Compute Load",
            value: stats?.memory_usage || "0 KB",
            detail: stats ? "Memory footprint" : "System idle",
            icon: Cpu,
            color: "text-violet-400",
            bg: "bg-violet-500/10",
            trend: "up"
        },
        {
            label: "Data Integrity",
            value: stats ? `${(100 - (stats.missing_values / (stats.total_rows * stats.total_columns || 1) * 100)).toFixed(1)}%` : "100%",
            detail: stats ? `${stats.missing_values} missing items` : "Clean state",
            icon: Shield,
            color: "text-emerald-400",
            bg: "bg-emerald-500/10",
            trend: stats?.missing_values === 0 ? "neutral" : "down"
        },
    ]

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 rounded-3xl bg-zinc-900/40 border border-white/5 p-8 animate-pulse">
                        <Skeleton className="h-4 w-24 mb-6 bg-white/5" />
                        <Skeleton className="h-10 w-32 mb-4 bg-white/5" />
                        <Skeleton className="h-4 w-48 bg-white/5" />
                    </div>
                ))}
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {kpis.map((stat, i) => (
                <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="relative overflow-hidden rounded-3xl p-8 bg-zinc-900/40 border border-white/5 group hover:border-white/10 transition-all shadow-xl"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                        <stat.icon className="h-24 w-24" />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color}`}>
                            <stat.icon className="h-5 w-5" />
                        </div>
                        <span className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <h3 className="text-4xl font-bold text-white tracking-tight mb-2">
                        {stat.value}
                    </h3>
                    <div className="flex items-center gap-2">
                        {stat.trend === "up" ? (
                            <ArrowUpRight className="h-3 w-3 text-emerald-400" />
                        ) : stat.trend === "down" ? (
                            <ArrowDownRight className="h-3 w-3 text-rose-400" />
                        ) : (
                            <AlertCircle className="h-3 w-3 text-zinc-500" />
                        )}
                        <span className="text-[11px] text-zinc-400 font-medium">{stat.detail}</span>
                    </div>
                </motion.div>
            ))}
        </div>
    )
}
