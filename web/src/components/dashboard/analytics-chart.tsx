"use client"

import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts"
import { Skeleton } from "@/components/ui/skeleton"

interface AnalyticsChartProps {
  data: any[]
  loading?: boolean
  yKey?: string
}

export function AnalyticsChart({ data, loading, yKey }: AnalyticsChartProps) {
  if (loading) {
    return (
      <div className="h-[350px] w-full flex items-center justify-center bg-white/[0.02] rounded-3xl animate-pulse">
        <Skeleton className="h-[80%] w-[90%] bg-white/5 rounded-2xl" />
      </div>
    )
  }

  if (!data || data.length === 0) {
    return (
      <div className="h-[350px] w-full flex flex-col items-center justify-center border border-dashed border-white/5 rounded-3xl bg-white/[0.01]">
        <p className="text-zinc-600 text-sm font-medium">Awaiting dataset uplink</p>
        <p className="text-[10px] text-zinc-800 uppercase font-bold tracking-widest mt-2">Chart state: Uninitialized</p>
      </div>
    )
  }

  // Determine the key for Y axis if not provided
  const displayKey = yKey || Object.keys(data[0]).find(k => k !== 'index' && typeof data[0][k] === 'number') || 'value';

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={data}>
        <defs>
          <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
        <XAxis
          dataKey="index"
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#666' }}
        />
        <YAxis
          stroke="#444"
          fontSize={10}
          tickLine={false}
          axisLine={false}
          tick={{ fill: '#666' }}
          tickFormatter={(value) => typeof value === 'number' ? value.toLocaleString() : value}
        />
        <Tooltip
          contentStyle={{ backgroundColor: "#09090b", border: "1px solid #ffffff10", borderRadius: "12px", boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)" }}
          itemStyle={{ color: "#fff", fontSize: "11px", fontWeight: "bold" }}
          labelStyle={{ color: "#666", fontSize: "10px", marginBottom: "4px" }}
        />
        <Line
          type="monotone"
          dataKey={displayKey}
          stroke="#2563eb"
          strokeWidth={3}
          dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#09090b' }}
          activeDot={{ r: 6, fill: '#60a5fa', strokeWidth: 0 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
