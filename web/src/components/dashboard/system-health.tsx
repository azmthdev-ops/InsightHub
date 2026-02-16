"use client"

import { useEffect, useState } from "react"
import { useDataset } from "@/providers/dataset-provider"
import { API_URL } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Activity, ShieldAlert, Loader2 } from "lucide-react"

export function SystemHealth() {
    const [health, setHealth] = useState<{ status: string; services: any } | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        const checkHealth = async () => {
            try {
                const response = await fetch(`${API_URL}/health`)
                if (!response.ok) throw new Error()
                const data = await response.json()
                setHealth(data)
                setError(false)
            } catch (err) {
                setError(true)
                setHealth(null)
            } finally {
                setLoading(false)
            }
        }

        checkHealth()
        const interval = setInterval(checkHealth, 30000)
        return () => clearInterval(interval)
    }, [API_URL])

    if (loading) return null

    return (
        <div className="fixed bottom-8 right-8 z-50">
            {error ? (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-rose-500/10 border border-rose-500/50 backdrop-blur-xl animate-bounce">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Critical: Backend Offline</span>
                </div>
            ) : (
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl opacity-60 hover:opacity-100 transition-opacity">
                    <div className="relative">
                        <Activity className="h-4 w-4 text-emerald-400" />
                        <div className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Core Synchronized</span>
                </div>
            )}
        </div>
    )
}
