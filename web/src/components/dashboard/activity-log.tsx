"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"

interface ActivityLogItem {
    id: string
    activity_type: string
    description: string
    metadata: any
    created_at: string
}

export function ActivityLog() {
    const [logs, setLogs] = useState<ActivityLogItem[]>([])
    const [loading, setLoading] = useState(true)
    const supabase = createClient()
    const router = useRouter()

    useEffect(() => {
        const fetchLogs = async () => {
            const { data, error } = await supabase
                .from('user_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(5)

            if (data) setLogs(data)
            setLoading(false)
        }

        fetchLogs()

        // Real-time updates
        const channel = supabase
            .channel('user_logs_changes')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_logs' }, (payload) => {
                setLogs(prev => [payload.new as ActivityLogItem, ...prev].slice(0, 5))
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr)
        const now = new Date()
        const diff = (now.getTime() - date.getTime()) / 1000

        if (diff < 60) return "Just now"
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
        return `${Math.floor(diff / 3600)}h ago`
    }

    const handleAction = (log: ActivityLogItem) => {
        if (log.activity_type === 'ML_TRAINING' && log.metadata?.model_id) {
            router.push(`/dashboard/ml-studio?model_id=${log.metadata.model_id}`)
        } else if (log.activity_type === 'DATA_INGESTION') {
            router.push('/dashboard/data')
        }
    }

    return (
        <Card className="bg-zinc-900/40 border-white/5 backdrop-blur-2xl rounded-[32px] overflow-hidden flex flex-col min-h-[400px] shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-xl text-white">Neural activity</CardTitle>
                        <CardDescription className="text-zinc-500 mt-1">Real-time event stream from global operations.</CardDescription>
                    </div>
                    <Button variant="ghost" className="text-xs text-blue-400 font-bold uppercase tracking-widest hover:bg-blue-500/10">Archive</Button>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 overflow-y-auto">
                <div className="divide-y divide-white/5">
                    {loading ? (
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="px-8 py-6 animate-pulse">
                                <div className="h-4 w-32 bg-white/5 rounded mb-2" />
                                <div className="h-3 w-48 bg-white/5 rounded" />
                            </div>
                        ))
                    ) : logs.length > 0 ? (
                        logs.map((log) => (
                            <div
                                key={log.id}
                                onClick={() => handleAction(log)}
                                className="px-8 py-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors cursor-pointer group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`h-2 w-2 rounded-full ${log.activity_type === 'ERROR' ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                    <div>
                                        <p className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors uppercase tracking-tight">{log.activity_type.replace('_', ' ')}</p>
                                        <p className="text-xs text-zinc-500">{log.description}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-mono text-zinc-600">{formatTime(log.created_at)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <p className="text-zinc-500 text-sm">No activity detected yet.</p>
                            <p className="text-zinc-700 text-[10px] mt-2 uppercase font-bold tracking-widest">Awaiting system ignition</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
