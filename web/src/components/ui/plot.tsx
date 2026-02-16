"use client"

import React from 'react'
import dynamic from 'next/dynamic'

// Use a factory to create the Plotly component to avoid SSR and resolution issues
const Plot = dynamic(
    async () => {
        const Plotly = await import('plotly.js-dist-min')
        const createPlotlyComponent = (await import('react-plotly.js/factory')).default
        return createPlotlyComponent(Plotly)
    },
    { ssr: false, loading: () => <div className="w-full h-[400px] bg-zinc-900/50 animate-pulse rounded-lg flex items-center justify-center text-zinc-500">Loading Plot...</div> }
) as any

export default Plot
