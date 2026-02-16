"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Brain, Database, TrendingUp, Zap, Shield, ArrowRight, Activity, BarChart3, Binary } from "lucide-react"
import { motion } from "framer-motion"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-violet-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-600 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-blob animation-delay-4000" />

        <div className="container px-6 mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-medium mb-8">
                <Zap className="h-4 w-4" />
                <span>Version 2.0 is now live</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50">
                Enterprise Data Intelligence <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-violet-500">
                  Simplified by AI
                </span>
              </h1>
              <p className="text-xl text-zinc-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                The all-in-one analytics hub for data profiling, machine learning, and automated intelligence. Transform raw data into competitive advantages.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                    Enter Dashboard
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-white/10 bg-white/5 backdrop-blur-md hover:bg-white/10 text-white rounded-full transition-all">
                  View Documentation
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-950/50 relative">
        <div className="container px-6 mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm hover:bg-white/[0.04] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Deep Data Profiling</h3>
              <p className="text-zinc-500 leading-relaxed">
                Automated statistical analysis, correlation mapping, and outlier detection with real-time quality scoring.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm hover:bg-white/[0.04] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-violet-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Binary className="h-6 w-6 text-violet-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">No-Code ML Studio</h3>
              <p className="text-zinc-500 leading-relaxed">
                Train 15+ industry-standard algorithms for regression and classification without writing a single line of code.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/10 backdrop-blur-sm hover:bg-white/[0.04] transition-all group">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 className="h-6 w-6 text-indigo-400" />
              </div>
              <h3 className="text-xl font-bold mb-4">Visual Intel Engine</h3>
              <p className="text-zinc-500 leading-relaxed">
                Create stunning, interactive visualizations using natural language queries powered by deep learning.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container px-6 mx-auto">
          <div className="p-12 rounded-[3rem] bg-gradient-to-br from-blue-600/20 to-violet-600/20 border border-white/10 text-center relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Ready to decode your data?</h2>
              <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
                Join hundreds of data teams using DataSynth to accelerate their analytics workflow and uncover hidden insights.
              </p>
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-black hover:bg-zinc-200 rounded-full transition-all">
                  Get Started for Free
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5">
        <div className="container px-6 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <span>Insight Hub</span>
          </div>
          <p className="text-zinc-600 text-sm">
            © 2026 DataSynth Analytics. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
